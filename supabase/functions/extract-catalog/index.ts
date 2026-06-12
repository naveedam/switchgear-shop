import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { job_id, storage_path } = await req.json();
    if (!job_id || !storage_path) {
      return new Response(JSON.stringify({ error: "job_id and storage_path are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    await supabase.from("catalog_ingestion_jobs")
      .update({ status: "extracting", updated_at: new Date().toISOString() })
      .eq("id", job_id);

    // Fetch existing products for matching
    const { data: products } = await supabase.from("products")
      .select("id, name, brand, category")
      .eq("status", "active")
      .limit(500);
    const productNames = (products || []).map((p: any) => p.name).join("\n");
    const productMap = new Map((products || []).map((p: any) => [p.name, p.id]));

    // Download PDF from Supabase (edge function has no size/CORS limits)
    const pdfUrl = `${SUPABASE_URL}/storage/v1/object/public/product-images/${storage_path}`;
    console.log("Fetching PDF from:", pdfUrl);
    const pdfRes = await fetch(pdfUrl);
    if (!pdfRes.ok) throw new Error(`Failed to fetch PDF: ${pdfRes.status}`);

    const pdfBuffer = await pdfRes.arrayBuffer();
    console.log("PDF size:", pdfBuffer.byteLength, "bytes");

    // Convert to base64
    const pdfBytes = new Uint8Array(pdfBuffer);
    let binary = "";
    const chunkSize = 8192;
    for (let i = 0; i < pdfBytes.length; i += chunkSize) {
      binary += String.fromCharCode(...pdfBytes.subarray(i, i + chunkSize));
    }
    const pdfBase64 = btoa(binary);
    console.log("Base64 length:", pdfBase64.length);

    // Call Gemini with inline PDF data
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: "application/pdf", data: pdfBase64 } },
              { text: `Extract ALL products from this electrical switchgear catalog PDF.

For each product provide:
- name: full product name with specs
- sku: part/catalog number if visible
- brand: manufacturer
- price: numeric price or 0
- category_hint: one of: low_voltage_switchgear, wires_and_cables, switches_and_sockets, relays, starters_and_switches, testing_and_measuring_instruments
- description: brief technical description
- matched_existing_name: closest match from this list or null:
${productNames}
- confidence: high|medium|low

Respond ONLY with valid JSON, no markdown:
{"products":[{"name":"...","sku":"...","brand":"...","price":0,"category_hint":"...","description":"...","matched_existing_name":null,"confidence":"medium"}],"catalog_brand":"..."}` },
            ],
          }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
        }),
      }
    );

    const geminiData = await geminiRes.json();
    console.log("Gemini status:", geminiRes.status);
    if (!geminiRes.ok) throw new Error(`Gemini error: ${JSON.stringify(geminiData)}`);

    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    console.log("Response length:", rawText.length);

    let parsed: any = { products: [] };
    try {
      parsed = JSON.parse(rawText.replace(/```json|```/g, "").trim());
    } catch {
      throw new Error("Unparseable response: " + rawText.slice(0, 300));
    }

    const extractedProducts = parsed.products || [];
    console.log("Extracted:", extractedProducts.length, "products");

    let auto_applied = 0;
    for (const p of extractedProducts) {
      if (p.confidence === "high" && p.matched_existing_name && productMap.get(p.matched_existing_name)) {
        auto_applied++;
      }
    }

    const summary = {
      total_images_extracted: extractedProducts.length,
      total_processed: extractedProducts.length,
      high_confidence: extractedProducts.filter((p: any) => p.confidence === "high").length,
      medium_confidence: extractedProducts.filter((p: any) => p.confidence === "medium").length,
      low_confidence: extractedProducts.filter((p: any) => p.confidence === "low").length,
      auto_applied,
      catalog_brand: parsed.catalog_brand || "unknown",
      matches: extractedProducts.map((p: any, i: number) => ({
        image_url: null,
        matched_product_id: p.matched_existing_name ? productMap.get(p.matched_existing_name) || null : null,
        matched_name: p.matched_existing_name || p.name,
        confidence: p.confidence,
        product_type: p.description,
        brand: p.brand,
        image_index: i,
        extracted_product: p,
      })),
    };

    await supabase.from("catalog_ingestion_jobs").update({
      status: "preview",
      extracted_count: extractedProducts.length,
      committed_count: auto_applied,
      raw_extracted: summary,
      updated_at: new Date().toISOString(),
    }).eq("id", job_id);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("extract-catalog error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
