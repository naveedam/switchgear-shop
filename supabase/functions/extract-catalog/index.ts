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

    // Download PDF from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("product-images")
      .download(storage_path);
    if (downloadError || !fileData) throw new Error(`Failed to download PDF: ${downloadError?.message}`);

    console.log("PDF downloaded, uploading to Gemini File API...");

    // Upload PDF to Gemini File API
    const pdfBuffer = await fileData.arrayBuffer();
    const uploadResponse = await fetch(
      `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/pdf",
          "X-Goog-Upload-Protocol": "raw",
          "X-Goog-Upload-Header-Content-Type": "application/pdf",
        },
        body: pdfBuffer,
      }
    );

    if (!uploadResponse.ok) {
      const err = await uploadResponse.text();
      throw new Error(`Gemini file upload failed: ${err}`);
    }

    const uploadData = await uploadResponse.json();
    const fileUri = uploadData.file?.uri;
    if (!fileUri) throw new Error("No file URI returned from Gemini File API");
    console.log("File uploaded to Gemini:", fileUri);

    // Fetch existing products for matching
    const { data: products } = await supabase.from("products")
      .select("id, name, brand, category")
      .eq("status", "active")
      .limit(500);
    const productNames = (products || []).map((p: any) => p.name).join("\n");
    const productMap = new Map((products || []).map((p: any) => [p.name, p.id]));

    // Send to Gemini 2.5 Flash for extraction
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                file_data: {
                  mime_type: "application/pdf",
                  file_uri: fileUri,
                },
              },
              {
                text: `You are extracting product data from an electrical switchgear supplier catalog PDF.

Extract ALL products you can find. For each product identify:
- name: full product name with specs (e.g. "Havells 32A MCB C-Curve SP")
- sku: part number or catalog number if visible
- brand: manufacturer brand
- price: price if shown (number only, 0 if not shown)
- category_hint: one of: low_voltage_switchgear, wires_and_cables, switches_and_sockets, relays, starters_and_switches, testing_and_measuring_instruments
- description: brief technical description
- matched_existing_name: best match from this existing product list or null if no close match:
${productNames}
- confidence: high if name+specs match closely, medium if partial, low if uncertain

Respond ONLY with valid JSON, no preamble, no markdown backticks:
{
  "products": [
    {
      "name": "...",
      "sku": "...",
      "brand": "...",
      "price": 0,
      "category_hint": "...",
      "description": "...",
      "matched_existing_name": "...",
      "confidence": "high|medium|low"
    }
  ],
  "total_pages_scanned": 0,
  "catalog_brand": "..."
}`,
              },
            ],
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    const geminiData = await geminiResponse.json();
    console.log("Gemini response status:", geminiResponse.status);
    if (!geminiResponse.ok) throw new Error(`Gemini API error: ${JSON.stringify(geminiData)}`);

    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    console.log("Gemini response length:", rawText.length);

    let parsed: any = { products: [] };
    try {
      parsed = JSON.parse(rawText.replace(/```json|```/g, "").trim());
    } catch {
      console.error("Failed to parse Gemini response:", rawText.slice(0, 500));
      throw new Error("Gemini returned unparseable response: " + rawText.slice(0, 200));
    }

    const extractedProducts = parsed.products || [];
    console.log(`Extracted ${extractedProducts.length} products`);

    let auto_applied = 0;
    for (const p of extractedProducts) {
      if (p.confidence === "high" && p.matched_existing_name) {
        const pid = productMap.get(p.matched_existing_name);
        if (pid) auto_applied++;
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
