// supabase/functions/extract-catalog/index.ts
// Sends PDF pages directly to Claude as a document for product extraction
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
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

    const pdfBuffer = await fileData.arrayBuffer();
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));

    // Fetch existing products for matching
    const { data: products } = await supabase.from("products")
      .select("id, name, brand, category")
      .eq("status", "active")
      .limit(500);
    const productNames = (products || []).map((p: any) => p.name).join("\n");

    // Send entire PDF to Claude as a document
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "pdfs-2024-09-25",
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 8000,
        messages: [{
          role: "user",
          content: [
            {
              type: "document",
              source: { type: "base64", media_type: "application/pdf", data: pdfBase64 },
            },
            {
              type: "text",
              text: `You are extracting product data from an electrical switchgear supplier catalog PDF.

Extract ALL products you can find in this catalog. For each product identify:
- name: full product name with specs (e.g. "Schneider iC60N MCB 32A C-Curve 2P")
- sku: part number or catalog number if visible
- brand: manufacturer brand
- price: price if shown (number only, 0 if not shown)
- category_hint: one of: low_voltage_switchgear, wires_and_cables, switches_and_sockets, relays, starters_and_switches, testing_and_measuring_instruments
- description: brief technical description

Also try to match each product to the closest name in this existing product list:
${productNames}

Respond ONLY with valid JSON, no preamble, no markdown:
{
  "products": [
    {
      "name": "...",
      "sku": "...",
      "brand": "...",
      "price": 0,
      "category_hint": "...",
      "description": "...",
      "matched_existing_name": "exact name from list or null",
      "confidence": "high|medium|low"
    }
  ],
  "total_pages_scanned": 0,
  "catalog_brand": "..."
}`,
            },
          ],
        }],
      }),
    });

    const claudeData = await response.json();
    if (!response.ok) throw new Error(`Claude API error: ${JSON.stringify(claudeData)}`);

    const rawText = claudeData.content?.[0]?.text || "{}";
    let parsed: any = { products: [] };
    try {
      parsed = JSON.parse(rawText.replace(/```json|```/g, "").trim());
    } catch {
      console.error("Failed to parse Claude response:", rawText.slice(0, 500));
    }

    const extractedProducts = parsed.products || [];

    // Auto-apply high-confidence matches that have an existing product match
    const productMap = new Map((products || []).map((p: any) => [p.name, p.id]));
    let auto_applied = 0;
    for (const p of extractedProducts) {
      if (p.confidence === "high" && p.matched_existing_name) {
        const pid = productMap.get(p.matched_existing_name);
        if (pid) {
          // Update description/sku if we have better data
          await supabase.from("products").update({
            updated_at: new Date().toISOString(),
          }).eq("id", pid);
          auto_applied++;
        }
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
        // Pass full product data for preview/commit
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
