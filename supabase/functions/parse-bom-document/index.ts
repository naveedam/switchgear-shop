import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, projectId, rawText } = await req.json();

    if (!rawText || !projectId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[parse-bom] Starting AI parse for project ${projectId}, text length: ${rawText.length}`);

    // Send entire text to AI in a single request
    const aiResult = await parseWithAI(rawText);

    if (aiResult.length <= 1) {
      console.warn(`[parse-bom] AI returned only ${aiResult.length} item(s) from text of ${rawText.length} chars. May need prompt tuning.`);
    }

    console.log(`[parse-bom] AI returned ${aiResult.length} components`);

    // Create BOM items from AI result
    const bomItems = aiResult.map((item: any) => ({
      project_id: projectId,
      component_type: item.component_type || null,
      description: item.description || "Unknown component",
      quantity: typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 1,
      rated_current: item.rated_current || null,
      rated_voltage: item.rated_voltage || null,
      poles: item.poles || null,
      breaking_capacity: item.breaking_capacity || null,
      power_rating: item.power_rating || null,
      brand: item.brand || null,
      model_number: item.model_number || null,
      category_slug: item.category_slug || null,
      confidence_score: item.confidence_score || 0.5,
      validation_status: (item.confidence_score || 0.5) >= 0.7 ? "complete" : (item.confidence_score || 0.5) >= 0.4 ? "missing_fields" : "needs_review",
      source_document_id: documentId || null,
      raw_text: item.raw_text || null,
    }));

    // Save to database
    if (bomItems.length > 0) {
      const { error: insertError } = await supabase.from("project_bom_items").insert(bomItems);
      if (insertError) {
        console.error("[parse-bom] Error inserting BOM items:", insertError);
        throw new Error("Failed to save BOM items");
      }
    }

    // Update document status
    if (documentId) {
      await supabase.from("project_documents").update({ processing_status: "completed" }).eq("id", documentId);
    }

    // Update project status
    await supabase.from("projects").update({ status: "bom_generated" }).eq("id", projectId);

    return new Response(
      JSON.stringify({
        success: true,
        items_found: bomItems.length,
        method: "ai_full_text",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[parse-bom] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function parseWithAI(text: string): Promise<any[]> {
  const prompt = `You are an expert electrical engineer specializing in panel design and switchgear BOMs.

Extract ALL electrical components from the following text and return a JSON array. Each item in the array represents one distinct component/line item.

IMPORTANT:
- Return EVERY component you find, not just one.
- A typical panel BOM has 10-30 line items. If you find fewer than 5, re-read the text carefully.
- Each row in a table or each numbered item is a separate component.
- Extract the quantity from each row. If not specified, default to 1.
- Ignore header rows, project metadata (client name, voltage rating, drawing number), and totals.

Each JSON object must have these fields:
- component_type (string): e.g. MCCB, MCB, ACB, Contactor, Overload Relay, VFD, Soft Starter, DOL Starter, Star Delta Starter, Meter, CT, Cable, Busbar, Enclosure, Push Button, Indicator Light, Selector Switch, SPD, Timer, PLC, HMI, Power Supply, Capacitor, Switch Fuse Unit, Isolator, RCCB, RCBO, Relay
- description (string): full description of the component including specs
- quantity (number): count of this item, default 1
- rated_current (string or null): e.g. "63 A"
- rated_voltage (string or null): e.g. "415 V"
- poles (string or null): e.g. "3P" or "4P"
- breaking_capacity (string or null): e.g. "25 kA"
- power_rating (string or null): e.g. "15 kW" or "20 HP"
- brand (string or null): e.g. Schneider, ABB, Siemens, L&T, Havells
- model_number (string or null): if mentioned
- category_slug (string): one of: low-voltage-switchgears, controlling-gear-signalling-devices, relays, meters, capacitors-reactors, wires-cables, industrial-automation
- confidence_score (number): 0.0-1.0 based on how many fields you could extract
- raw_text (string): the original text segment for this component

Return ONLY a valid JSON array. No markdown, no explanation, no extra text.

Text to parse:
${text.substring(0, 8000)}`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You extract structured data from electrical engineering documents. Always return a valid JSON array with ALL components found. Never return a single object when multiple components exist." },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.error("[parse-bom] AI gateway error:", response.status);
      return [];
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";

    // Extract JSON array from response (handle markdown code blocks)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("[parse-bom] No JSON array found in AI response");
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) {
      console.error("[parse-bom] AI response is not an array");
      return [];
    }

    return parsed;
  } catch (err) {
    console.error("[parse-bom] AI parsing error:", err);
    return [];
  }
}
