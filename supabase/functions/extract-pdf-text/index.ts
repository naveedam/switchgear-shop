import { adminClient, clientIp, errorResponse, HttpError, optionalUser, rateLimit, requireUser } from "../_shared/guard.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // --- access guard ---
  try {
    const caller = await requireUser(req);
    await rateLimit(`extract-pdf:${caller.user.id}`, 30, 3600);
  } catch (e) {
    return errorResponse(e);
  }

  try {
    const { documentId, projectId, fileUrl } = await req.json();

    if (!documentId || !projectId || !fileUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: documentId, projectId, fileUrl" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[extract-pdf-text] Starting extraction for document ${documentId}, fileUrl: ${fileUrl}`);

    // Update status to extracting
    await supabase
      .from("project_documents")
      .update({ processing_status: "extracting" })
      .eq("id", documentId);

    // Download the PDF from Supabase Storage using the service role client
    let pdfBytes: Uint8Array;

    const storagePathMatch = fileUrl.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
    
    if (storagePathMatch) {
      const bucketName = storagePathMatch[1];
      const filePath = decodeURIComponent(storagePathMatch[2]);
      console.log(`[extract-pdf-text] Downloading from bucket: ${bucketName}, path: ${filePath}`);
      
      const { data, error: downloadError } = await supabase.storage
        .from(bucketName)
        .download(filePath);

      if (downloadError || !data) {
        throw new Error(`Failed to download PDF from storage: ${downloadError?.message || 'No data returned'}`);
      }

      pdfBytes = new Uint8Array(await data.arrayBuffer());
    } else {
      console.log(`[extract-pdf-text] URL doesn't match storage pattern, trying direct fetch`);
      const downloadResponse = await fetch(fileUrl);
      if (!downloadResponse.ok) {
        throw new Error(`Failed to download PDF: ${downloadResponse.status} ${downloadResponse.statusText}`);
      }
      pdfBytes = new Uint8Array(await downloadResponse.arrayBuffer());
    }

    console.log(`[extract-pdf-text] Downloaded PDF, size: ${pdfBytes.length} bytes`);

    if (pdfBytes.length === 0) {
      throw new Error("Downloaded PDF is empty");
    }

    // Use unpdf for Deno-compatible PDF text extraction
    const { getDocumentProxy, extractText } = await import("https://esm.sh/unpdf@0.12.1");
    const doc = await getDocumentProxy(new Uint8Array(pdfBytes));
    const { text: extractedText } = await extractText(doc, { mergePages: true });

    console.log(`[extract-pdf-text] Extracted ${extractedText?.length || 0} characters of text`);

    // Save extracted text to the document
    const success = !!extractedText && extractedText.trim().length > 10;

    await supabase
      .from("project_documents")
      .update({
        raw_extracted_text: extractedText || null,
        processing_status: success ? "extracted" : "extraction_failed",
      })
      .eq("id", documentId);

    return new Response(
      JSON.stringify({
        success,
        text_length: extractedText?.length || 0,
        extractedText: success ? extractedText : null,
        message: success
          ? "Text extracted successfully"
          : "Could not extract meaningful text from PDF. Please paste text manually.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[extract-pdf-text] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";

    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
