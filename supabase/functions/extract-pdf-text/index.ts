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

  try {
    const { documentId, projectId, fileUrl } = await req.json();

    if (!documentId || !projectId || !fileUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: documentId, projectId, fileUrl" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[extract-pdf-text] Starting extraction for document ${documentId}`);

    // Update status to extracting
    await supabase
      .from("project_documents")
      .update({ processing_status: "extracting" })
      .eq("id", documentId);

    // Download the PDF file
    // fileUrl could be a full public URL or a storage path
    let pdfBytes: Uint8Array;

    // Try downloading from the public URL
    const downloadResponse = await fetch(fileUrl);
    if (!downloadResponse.ok) {
      throw new Error(`Failed to download PDF: ${downloadResponse.status} ${downloadResponse.statusText}`);
    }
    pdfBytes = new Uint8Array(await downloadResponse.arrayBuffer());

    console.log(`[extract-pdf-text] Downloaded PDF, size: ${pdfBytes.length} bytes`);

    if (pdfBytes.length === 0) {
      throw new Error("Downloaded PDF is empty");
    }

    // Use pdf-parse via esm.sh to extract text
    // We'll use a simpler approach: parse PDF text using a lightweight method
    const extractedText = await extractTextFromPdf(pdfBytes);

    console.log(`[extract-pdf-text] Extracted ${extractedText.length} characters of text`);

    // Save extracted text to the document
    await supabase
      .from("project_documents")
      .update({
        raw_extracted_text: extractedText || null,
        processing_status: extractedText && extractedText.trim().length > 10 ? "extracted" : "extraction_failed",
      })
      .eq("id", documentId);

    const success = !!extractedText && extractedText.trim().length > 10;

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

/**
 * Extract text from PDF bytes using basic PDF text stream parsing.
 * This handles most text-based PDFs without external dependencies.
 */
async function extractTextFromPdf(pdfBytes: Uint8Array): Promise<string> {
  // Try using pdf-parse library
  try {
    const pdfParse = (await import("https://esm.sh/pdf-parse@1.1.1")).default;
    // pdf-parse expects a Buffer-like object
    const result = await pdfParse(pdfBytes);
    if (result.text && result.text.trim().length > 0) {
      console.log(`[extract-pdf-text] pdf-parse extracted ${result.text.length} chars, ${result.numpages} pages`);
      return result.text;
    }
  } catch (err: unknown) {
    console.warn("[extract-pdf-text] pdf-parse failed, falling back to manual extraction:", err);
  }

  // Fallback: Basic PDF text extraction by reading text streams
  try {
    const text = extractTextManually(pdfBytes);
    if (text.trim().length > 0) {
      console.log(`[extract-pdf-text] Manual extraction got ${text.length} chars`);
      return text;
    }
  } catch (err: unknown) {
    console.warn("[extract-pdf-text] Manual extraction failed:", err);
  }

  return "";
}

/**
 * Basic manual PDF text extraction by finding text between BT/ET markers
 * and decoding parenthesized strings. Works for simple text-based PDFs.
 */
function extractTextManually(pdfBytes: Uint8Array): string {
  const decoder = new TextDecoder("latin1");
  const pdfText = decoder.decode(pdfBytes);

  const textParts: string[] = [];

  // Find text between BT (begin text) and ET (end text) markers
  const btEtRegex = /BT\s([\s\S]*?)ET/g;
  let match;

  while ((match = btEtRegex.exec(pdfText)) !== null) {
    const block = match[1];

    // Extract parenthesized strings (PDF literal strings)
    const strRegex = /\(([^)]*)\)/g;
    let strMatch;
    while ((strMatch = strRegex.exec(block)) !== null) {
      const decoded = strMatch[1]
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\t/g, "\t")
        .replace(/\\\\/g, "\\")
        .replace(/\\([()])/g, "$1");
      if (decoded.trim()) {
        textParts.push(decoded);
      }
    }

    // Extract hex strings
    const hexRegex = /<([0-9A-Fa-f]+)>/g;
    let hexMatch;
    while ((hexMatch = hexRegex.exec(block)) !== null) {
      const hex = hexMatch[1];
      let hexStr = "";
      for (let i = 0; i < hex.length; i += 2) {
        const charCode = parseInt(hex.substring(i, i + 2), 16);
        if (charCode >= 32 && charCode < 127) {
          hexStr += String.fromCharCode(charCode);
        }
      }
      if (hexStr.trim()) {
        textParts.push(hexStr);
      }
    }
  }

  return textParts.join(" ").replace(/\s+/g, " ").trim();
}
