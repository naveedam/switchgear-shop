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

    // Step 1: Fetch PDF from Supabase storage
    const pdfUrl = "https://hdoefblcoavpzvfiiglm.supabase.co/storage/v1/object/public/product-images/" + storage_path;
    console.log("Fetching PDF:", pdfUrl);
    const pdfRes = await fetch(pdfUrl);
    if (!pdfRes.ok) throw new Error("Failed to fetch PDF: " + pdfRes.status);
    const pdfSize = pdfRes.headers.get("content-length") || "";
    console.log("PDF size:", pdfSize);

    // Step 2: Start resumable upload to Gemini File API
    const startHeaders: Record<string, string> = {
      "X-Goog-Upload-Protocol": "resumable",
      "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Type": "application/pdf",
      "Content-Type": "application/json",
    };
    if (pdfSize) startHeaders["X-Goog-Upload-Header-Content-Length"] = pdfSize;

    const startRes = await fetch(
      "https://generativelanguage.googleapis.com/upload/v1beta/files?key=" + GEMINI_API_KEY,
      { method: "POST", headers: startHeaders, body: JSON.stringify({ file: { display_name: storage_path } }) }
    );
    if (!startRes.ok) throw new Error("Gemini upload start failed: " + await startRes.text());
    const uploadUrl = startRes.headers.get("x-goog-upload-url");
    if (!uploadUrl) throw new Error("No upload URL from Gemini");
    console.log("Got upload URL");

    // Step 3: Stream PDF to Gemini
    const uploadHeaders: Record<string, string> = {
      "Content-Type": "application/pdf",
      "X-Goog-Upload-Command": "upload, finalize",
    };
    if (pdfSize) {
      uploadHeaders["X-Goog-Upload-Offset"] = "0";
      uploadHeaders["Content-Length"] = pdfSize;
    }
    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: uploadHeaders,
      body: pdfRes.body,
      // @ts-ignore
      duplex: "half",
    });
    if (!uploadRes.ok) throw new Error("Gemini upload failed: " + await uploadRes.text());
    const uploadData = await uploadRes.json();
    const fileUri = uploadData.file?.uri;
    if (!fileUri) throw new Error("No file URI: " + JSON.stringify(uploadData));
    console.log("Uploaded to Gemini:", fileUri);

    // Step 4: Fetch existing products
    const { data: products } = await supabase.from("products")
      .select("id, name, brand, category")
      .eq("status", "active")
      .limit(500);
    const productNames = (products || []).map((p: any) => p.name).join("\n");
    const productMap = new Map((products || []).map((p: any) => [p.name, p.id]));

    // Step 5: Call Gemini with file URI
    console.log("Calling Gemini generateContent...");
    const prompt = "Extract ALL products from this electrical switchgear catalog PDF.\n\nFor each product provide:\n- name: full product name with specs\n- sku: part/catalog number if visible\n- brand: manufacturer\n- price: numeric price or 0\n- category_hint: one of: low_voltage_switchgear, wires_and_cables, switches_and_sockets, relays, starters_and_switches, testing_and_measuring_instruments\n- description: brief technical description\n- matched_existing_name: closest match from this list or null:\n" + productNames + "\n- confidence: high|medium|low\n\nRespond ONLY with valid JSON, no markdown fences:\n{\"products\":[{\"name\":\"...\",\"sku\":\"...\",\"brand\":\"...\",\"price\":0,\"category_hint\":\"...\",\"description\":\"...\",\"matched_existing_name\":null,\"confidence\":\"medium\"}],\"catalog_brand\":\"...\"}";

    const geminiRes = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ file_data: { mime_type: "application/pdf", file_uri: fileUri } }, { text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 65536 },
        }),
      }
    );

    const geminiData = await geminiRes.json();
    const finishReason = geminiData.candidates?.[0]?.finishReason;
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    console.log("Gemini status:", geminiRes.status, "finish:", finishReason, "length:", rawText.length);
    if (!geminiRes.ok) throw new Error("Gemini error: " + JSON.stringify(geminiData).slice(0, 300));

    // Parse response
    let parsed: any = { products: [] };
    try {
      const cleaned = rawText.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      try {
        const lastBrace = rawText.lastIndexOf("}");
        const firstBrace = rawText.indexOf("{");
        if (firstBrace > -1 && lastBrace > firstBrace) {
          parsed = JSON.parse(rawText.slice(firstBrace, lastBrace + 1));
        }
      } catch {
        console.error("Parse failed:", rawText.slice(0, 300));
      }
    }

    const extractedProducts = parsed.products || [];
    console.log("Extracted:", extractedProducts.length, "products");

    const summary = {
      total_images_extracted: extractedProducts.length,
      total_processed: extractedProducts.length,
      high_confidence: extractedProducts.filter((p: any) => p.confidence === "high").length,
      medium_confidence: extractedProducts.filter((p: any) => p.confidence === "medium").length,
      low_confidence: extractedProducts.filter((p: any) => p.confidence === "low").length,
      auto_applied: 0,
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
      committed_count: 0,
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
