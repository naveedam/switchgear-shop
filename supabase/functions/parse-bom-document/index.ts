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

// ============================================================
// Validation rules (mirrored from client — keep in sync)
// ============================================================
const validationRules: Record<string, string[]> = {
  MCCB: ['rated_current', 'poles', 'breaking_capacity', 'rated_voltage'],
  MCB: ['rated_current', 'poles', 'breaking_capacity'],
  ACB: ['rated_current', 'poles', 'breaking_capacity', 'rated_voltage'],
  Contactor: ['rated_current', 'rated_voltage'],
  'Overload Relay': ['rated_current'],
  Relay: ['rated_voltage', 'poles'],
  CT: ['rated_current'],
  VFD: ['power_rating', 'rated_voltage'],
  'Soft Starter': ['power_rating', 'rated_voltage'],
  Meter: ['rated_voltage'],
  SPD: ['rated_voltage', 'poles'],
  RCCB: ['rated_current', 'poles'],
  RCBO: ['rated_current', 'poles'],
  'Switch Fuse Unit': ['rated_current', 'poles'],
  Isolator: ['rated_current', 'poles'],
};

function getRule(componentType?: string): string[] | null {
  if (!componentType) return null;
  const ct = componentType.trim();
  if (validationRules[ct]) return validationRules[ct];
  const key = Object.keys(validationRules).find(k => k.toLowerCase() === ct.toLowerCase());
  return key ? validationRules[key] : null;
}

// ============================================================
// Normalization helpers
// ============================================================
function normCurrent(v: string | null): string | null {
  if (!v) return null;
  const m = v.trim().match(/^(\d+\.?\d*)\s*(A|a|amp|amps)?$/i);
  if (m) return `${m[1]} A`;
  const r = v.trim().match(/^(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)\s*(A|a)?$/i);
  if (r) return `${r[1]}-${r[2]} A`;
  return v.trim();
}
function normVoltage(v: string | null): string | null {
  if (!v) return null;
  const m = v.trim().match(/^(\d+\.?\d*)\s*(V|v)\s*(AC|DC|ac|dc)?$/i);
  if (m) return `${m[1]} V${m[3] ? ` ${m[3].toUpperCase()}` : ''}`;
  return v.trim();
}
function normPoles(v: string | null): string | null {
  if (!v) return null;
  const m = v.trim().match(/^(\d+)\s*(P|p|pole|poles)?$/i);
  if (m) return `${m[1]}P`;
  return v.trim().toUpperCase();
}
function normBreaking(v: string | null): string | null {
  if (!v) return null;
  const m = v.trim().match(/^(\d+\.?\d*)\s*(kA|ka|KA)$/i);
  if (m) return `${m[1]} kA`;
  return v.trim();
}
function normPower(v: string | null): string | null {
  if (!v) return null;
  const kw = v.trim().match(/^(\d+\.?\d*)\s*(kW|kw|KW)$/i);
  if (kw) return `${kw[1]} kW`;
  const hp = v.trim().match(/^(\d+\.?\d*)\s*(HP|hp|Hp)$/i);
  if (hp) return `${hp[1]} HP`;
  return v.trim();
}

// ============================================================
// Confidence scoring — weighted multi-factor
// ============================================================
function calculateConfidence(item: Record<string, unknown>): number {
  let score = 0;
  const rule = getRule(item.component_type as string);
  const optionalFields = ['rated_current', 'rated_voltage', 'poles', 'breaking_capacity', 'power_rating'];

  // Factor 1: required fields (40%)
  if (rule) {
    const filled = rule.filter(f => {
      const v = item[f];
      return v !== null && v !== undefined && (typeof v !== 'string' || v.trim() !== '');
    }).length;
    score += 0.4 * (filled / rule.length);
  } else {
    score += item.component_type ? 0.2 : 0;
  }

  // Factor 2: category (20%)
  if (item.category_slug) score += 0.2;

  // Factor 3: optional specs (20%)
  const optFilled = optionalFields.filter(f => {
    const v = item[f];
    return v !== null && v !== undefined && (typeof v !== 'string' || v.trim() !== '');
  }).length;
  score += 0.2 * (optFilled / optionalFields.length);

  // Factor 4: brand/model (20%)
  if (item.brand) score += 0.1;
  if (item.model_number) score += 0.1;

  return Math.round(score * 100) / 100;
}

function determineValidationStatus(item: Record<string, unknown>): string {
  const rule = getRule(item.component_type as string);
  if (!rule) {
    if (!item.component_type && !item.category_slug) return 'needs_review';
    return 'complete';
  }
  const missing = rule.filter(f => {
    const v = item[f];
    return v === null || v === undefined || (typeof v === 'string' && !v.trim());
  });
  if (missing.length === 0) return 'complete';
  if (missing.length <= 1) return 'missing_fields';
  return 'needs_review';
}

// ============================================================
// Main handler
// ============================================================
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, projectId, rawText } = await req.json();

    if (!rawText || !projectId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields", error_code: "MISSING_FIELDS" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[parse-bom] Starting AI parse for project ${projectId}, text length: ${rawText.length}`);

    const aiResult = await parseWithAI(rawText);

    if (aiResult.length === 0) {
      console.warn(`[parse-bom] AI returned 0 items from text of ${rawText.length} chars.`);
      return new Response(
        JSON.stringify({ success: false, items_found: 0, error_code: "NO_ITEMS_FOUND", message: "AI could not extract any components. Check document format." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (aiResult.length <= 1) {
      console.warn(`[parse-bom] AI returned only ${aiResult.length} item(s). May need prompt tuning.`);
    }

    console.log(`[parse-bom] AI returned ${aiResult.length} components`);

    // Normalize, score, and validate each item
    const bomItems = aiResult.map((item: any) => {
      // Normalize values
      const normalized = {
        ...item,
        rated_current: normCurrent(item.rated_current || null),
        rated_voltage: normVoltage(item.rated_voltage || null),
        poles: normPoles(item.poles || null),
        breaking_capacity: normBreaking(item.breaking_capacity || null),
        power_rating: normPower(item.power_rating || null),
        quantity: typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 1,
      };

      // Calculate confidence and validation server-side
      const confidence = calculateConfidence(normalized);
      const validationStatus = determineValidationStatus(normalized);

      return {
        project_id: projectId,
        component_type: normalized.component_type || null,
        description: normalized.description || "Unknown component",
        quantity: normalized.quantity,
        rated_current: normalized.rated_current,
        rated_voltage: normalized.rated_voltage,
        poles: normalized.poles,
        breaking_capacity: normalized.breaking_capacity,
        power_rating: normalized.power_rating,
        brand: normalized.brand || null,
        model_number: normalized.model_number || null,
        category_slug: normalized.category_slug || null,
        confidence_score: confidence,
        validation_status: validationStatus,
        source_document_id: documentId || null,
        raw_text: normalized.raw_text || null,
      };
    });

    // Save to database
    if (bomItems.length > 0) {
      const { error: insertError } = await supabase.from("project_bom_items").insert(bomItems);
      if (insertError) {
        console.error("[parse-bom] Error inserting BOM items:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to save BOM items", error_code: "DB_INSERT_FAILED" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
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
        validation_summary: {
          complete: bomItems.filter((i: any) => i.validation_status === 'complete').length,
          missing_fields: bomItems.filter((i: any) => i.validation_status === 'missing_fields').length,
          needs_review: bomItems.filter((i: any) => i.validation_status === 'needs_review').length,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[parse-bom] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message, error_code: "INTERNAL_ERROR" }),
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
