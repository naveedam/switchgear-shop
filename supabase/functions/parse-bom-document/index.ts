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
  SMPS: ['rated_voltage', 'rated_current'],
  'Control Transformer': ['power_rating', 'rated_voltage'],
  'Push Button': [],
  'Indicator Light': [],
  'Selector Switch': [],
};

function getRule(componentType?: string): string[] | null {
  if (!componentType) return null;
  const ct = componentType.trim();
  if (validationRules[ct]) return validationRules[ct];
  const key = Object.keys(validationRules).find(k => k.toLowerCase() === ct.toLowerCase());
  return key ? validationRules[key] : null;
}

// ============================================================
// Normalization helpers — robust regex-based
// ============================================================
function normCurrent(v: string | null): string | null {
  if (!v) return null;
  // Handle CT ratio: "200/5A" or "200/5 A"
  const ctMatch = v.trim().match(/^(\d+)\s*\/\s*(\d+)\s*(A|a)?$/i);
  if (ctMatch) return `${ctMatch[1]}/${ctMatch[2]} A`;
  // Handle ranges: "55-65A" or "23–32A"
  const rangeMatch = v.trim().match(/^(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)\s*(A|a|amp|amps)?$/i);
  if (rangeMatch) return `${rangeMatch[1]}-${rangeMatch[2]} A`;
  // Simple: "250A" or "250 A"
  const m = v.trim().match(/^(\d+\.?\d*)\s*(A|a|amp|amps)?$/i);
  if (m) return `${m[1]} A`;
  return v.trim();
}

function normVoltage(v: string | null): string | null {
  if (!v) return null;
  // Handle transformer voltage: "415/230V" or "415/110V"
  const txMatch = v.trim().match(/^(\d+)\s*\/\s*(\d+)\s*(V|v)\s*(AC|DC|ac|dc)?$/i);
  if (txMatch) return `${txMatch[1]}/${txMatch[2]} V${txMatch[4] ? ` ${txMatch[4].toUpperCase()}` : ''}`;
  // Handle "24V DC", "415V", "230V AC"
  const m = v.trim().match(/^(\d+\.?\d*)\s*(V|v)\s*(AC|DC|ac|dc)?$/i);
  if (m) return `${m[1]} V${m[3] ? ` ${m[3].toUpperCase()}` : ''}`;
  return v.trim();
}

function normPoles(v: string | null): string | null {
  if (!v) return null;
  // "TPN" → "3P+N", "TP" → "3P", "SPN" → "1P+N", "SP" → "1P"
  const upper = v.trim().toUpperCase();
  if (upper === 'TPN' || upper === 'TP+N') return '3P+N';
  if (upper === 'TP') return '3P';
  if (upper === 'SPN' || upper === 'SP+N') return '1P+N';
  if (upper === 'SP') return '1P';
  if (upper === 'FP') return '4P';
  // "4P", "3 Pole", etc.
  const m = v.trim().match(/^(\d+)\s*(P|p|pole|poles)?$/i);
  if (m) return `${m[1]}P`;
  return upper;
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
  const kva = v.trim().match(/^(\d+\.?\d*)\s*(kVA|kva|KVA)$/i);
  if (kva) return `${kva[1]} kVA`;
  const va = v.trim().match(/^(\d+\.?\d*)\s*(VA|va)$/i);
  if (va) return `${va[1]} VA`;
  const w = v.trim().match(/^(\d+\.?\d*)\s*(W|w|watt|watts)$/i);
  if (w) return `${w[1]} W`;
  return v.trim();
}

// ============================================================
// Post-extraction: re-parse specs from description if AI missed fields
// ============================================================
function extractSpecsFromDescription(item: Record<string, unknown>): Record<string, unknown> {
  const desc = ((item.description as string) || '').toUpperCase();
  const rawText = ((item.raw_text as string) || '').toUpperCase();
  const combined = `${desc} ${rawText}`;

  // Extract rated_current if missing
  if (!item.rated_current) {
    // CT ratio pattern: 200/5A
    const ctRatio = combined.match(/(\d+)\s*\/\s*(\d+)\s*A\b/i);
    if (ctRatio && (item.component_type as string)?.toUpperCase()?.includes('CT')) {
      item.rated_current = `${ctRatio[1]}/${ctRatio[2]} A`;
      item.ct_ratio = `${ctRatio[1]}/${ctRatio[2]}`;
    }
    // Range: 55-65A or 23–32A
    if (!item.rated_current) {
      const range = combined.match(/(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)\s*A\b/i);
      if (range) item.rated_current = `${range[1]}-${range[2]} A`;
    }
    // Simple: 250A
    if (!item.rated_current) {
      const simple = combined.match(/\b(\d+\.?\d*)\s*A\b(?!\s*CLASS)/i);
      if (simple) item.rated_current = `${simple[1]} A`;
    }
  }

  // Extract poles if missing
  if (!item.poles) {
    if (/\bTPN\b/.test(combined)) item.poles = '3P+N';
    else if (/\bSPN\b/.test(combined)) item.poles = '1P+N';
    else if (/\bFP\b/.test(combined)) item.poles = '4P';
    else {
      const pMatch = combined.match(/\b(\d)\s*P(?:OLE|OLES?)?\b/i);
      if (pMatch) item.poles = `${pMatch[1]}P`;
    }
  }

  // Extract breaking capacity if missing
  if (!item.breaking_capacity) {
    const ka = combined.match(/(\d+\.?\d*)\s*KA\b/i);
    if (ka) item.breaking_capacity = `${ka[1]} kA`;
  }

  // Extract voltage if missing
  if (!item.rated_voltage) {
    // Transformer voltage: 415/230V
    const txV = combined.match(/(\d+)\s*\/\s*(\d+)\s*V/i);
    if (txV) {
      item.rated_voltage = `${txV[1]}/${txV[2]} V`;
    } else {
      const vMatch = combined.match(/(\d+\.?\d*)\s*V\s*(AC|DC)?/i);
      if (vMatch) item.rated_voltage = `${vMatch[1]} V${vMatch[2] ? ` ${vMatch[2].toUpperCase()}` : ''}`;
    }
  }

  // Extract power rating if missing
  if (!item.power_rating) {
    const kva = combined.match(/(\d+\.?\d*)\s*KVA\b/i);
    if (kva) { item.power_rating = `${kva[1]} kVA`; }
    else {
      const kw = combined.match(/(\d+\.?\d*)\s*KW\b/i);
      if (kw) { item.power_rating = `${kw[1]} kW`; }
      else {
        const hp = combined.match(/(\d+\.?\d*)\s*HP\b/i);
        if (hp) item.power_rating = `${hp[1]} HP`;
      }
    }
  }

  // Extract CT accuracy class if missing
  if (!item.accuracy_class) {
    const acc = combined.match(/CLASS\s*([\d.]+)/i);
    if (acc) item.accuracy_class = `Class ${acc[1]}`;
  }

  // Extract coil voltage for contactors/relays
  if (!item.coil_voltage) {
    const coilMatch = combined.match(/COIL\s*(\d+)\s*V\s*(AC|DC)?/i);
    if (coilMatch) item.coil_voltage = `${coilMatch[1]} V${coilMatch[2] ? ` ${coilMatch[2].toUpperCase()}` : ''}`;
  }

  return item;
}

// ============================================================
// Quantity normalization — handle "3 Nos", "1 Set", "50 m", etc.
// ============================================================
function normalizeQuantity(item: Record<string, unknown>): number {
  const qty = item.quantity;
  if (typeof qty === 'number' && qty > 0) return Math.round(qty);
  if (typeof qty === 'string') {
    const parsed = parseInt(qty, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  // Try to extract from description/raw_text
  const raw = ((item.raw_text as string) || '') + ' ' + ((item.description as string) || '');
  const qtyPatterns = [
    /QTY\s*[:=]?\s*(\d+)/i,
    /(\d+)\s*(?:NOS?|SETS?|LOTS?|PCS?|PIECES?|UNITS?|NRS?)\b/i,
    /(\d+)\s*(?:METERS?|MTR|M)\b/i,
  ];
  for (const pat of qtyPatterns) {
    const m = raw.match(pat);
    if (m) return Math.max(1, parseInt(m[1], 10));
  }
  return 1;
}

// ============================================================
// Component classification — map to category_slug
// ============================================================
const categoryMapping: Record<string, string> = {
  MCCB: 'low-voltage-switchgears',
  MCB: 'low-voltage-switchgears',
  ACB: 'low-voltage-switchgears',
  RCCB: 'low-voltage-switchgears',
  RCBO: 'low-voltage-switchgears',
  'Switch Fuse Unit': 'low-voltage-switchgears',
  Isolator: 'low-voltage-switchgears',
  SPD: 'low-voltage-switchgears',
  Contactor: 'controlling-gear-signalling-devices',
  'Overload Relay': 'controlling-gear-signalling-devices',
  'DOL Starter': 'controlling-gear-signalling-devices',
  'Star Delta Starter': 'controlling-gear-signalling-devices',
  'Push Button': 'controlling-gear-signalling-devices',
  'Indicator Light': 'controlling-gear-signalling-devices',
  'Selector Switch': 'controlling-gear-signalling-devices',
  Relay: 'relays',
  'Timer Relay': 'relays',
  Timer: 'relays',
  CT: 'meters',
  Meter: 'meters',
  'Energy Meter': 'meters',
  'Ammeter': 'meters',
  'Voltmeter': 'meters',
  VFD: 'industrial-automation',
  'Soft Starter': 'industrial-automation',
  PLC: 'industrial-automation',
  HMI: 'industrial-automation',
  SMPS: 'industrial-automation',
  'Power Supply': 'industrial-automation',
  'Control Transformer': 'industrial-automation',
  Capacitor: 'capacitors-reactors',
  Reactor: 'capacitors-reactors',
  Cable: 'wires-cables',
  Wire: 'wires-cables',
  Busbar: 'wires-cables',
};

function classifyComponent(componentType: string | null): string {
  if (!componentType) return 'low-voltage-switchgears';
  const ct = componentType.trim();
  if (categoryMapping[ct]) return categoryMapping[ct];
  const key = Object.keys(categoryMapping).find(k => k.toLowerCase() === ct.toLowerCase());
  if (key) return categoryMapping[key];
  // Fuzzy matching for common abbreviations
  const upper = ct.toUpperCase();
  if (upper.includes('MCCB') || upper.includes('MCB') || upper.includes('ACB')) return 'low-voltage-switchgears';
  if (upper.includes('CONTACTOR') || upper.includes('OLR') || upper.includes('OVERLOAD')) return 'controlling-gear-signalling-devices';
  if (upper.includes('RELAY') || upper.includes('TIMER')) return 'relays';
  if (upper.includes('CT') || upper.includes('METER') || upper.includes('AMMETER')) return 'meters';
  if (upper.includes('VFD') || upper.includes('PLC') || upper.includes('HMI') || upper.includes('SMPS')) return 'industrial-automation';
  if (upper.includes('CABLE') || upper.includes('WIRE') || upper.includes('BUSBAR')) return 'wires-cables';
  if (upper.includes('CAPACITOR') || upper.includes('REACTOR')) return 'capacitors-reactors';
  return 'low-voltage-switchgears';
}

// ============================================================
// Confidence scoring — weighted multi-factor
// ============================================================
function calculateConfidence(item: Record<string, unknown>): number {
  let score = 0;
  const rule = getRule(item.component_type as string);
  const optionalFields = ['rated_current', 'rated_voltage', 'poles', 'breaking_capacity', 'power_rating'];

  if (rule) {
    const filled = rule.filter(f => {
      const v = item[f];
      return v !== null && v !== undefined && (typeof v !== 'string' || v.trim() !== '');
    }).length;
    score += 0.4 * (rule.length > 0 ? filled / rule.length : 1);
  } else {
    score += item.component_type ? 0.2 : 0;
  }

  if (item.category_slug) score += 0.2;

  const optFilled = optionalFields.filter(f => {
    const v = item[f];
    return v !== null && v !== undefined && (typeof v !== 'string' || v.trim() !== '');
  }).length;
  score += 0.2 * (optFilled / optionalFields.length);

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

    console.log(`[parse-bom] AI returned ${aiResult.length} components`);

    // Normalize, enrich, score, and validate each item
    const bomItems = aiResult.map((item: any) => {
      // Step 1: Normalize raw AI values
      let normalized: Record<string, unknown> = {
        ...item,
        rated_current: normCurrent(item.rated_current || null),
        rated_voltage: normVoltage(item.rated_voltage || null),
        poles: normPoles(item.poles || null),
        breaking_capacity: normBreaking(item.breaking_capacity || null),
        power_rating: normPower(item.power_rating || null),
        coil_voltage: normVoltage(item.coil_voltage || null),
      };

      // Step 2: Re-extract specs from description if AI missed them
      normalized = extractSpecsFromDescription(normalized);

      // Step 3: Classify component into category
      const categorySlug = normalized.category_slug || classifyComponent(normalized.component_type as string);

      // Step 4: Normalize quantity
      const quantity = normalizeQuantity(normalized);

      // Step 5: Calculate confidence and validation
      const withCategory = { ...normalized, category_slug: categorySlug };
      const confidence = calculateConfidence(withCategory);
      const validationStatus = determineValidationStatus(withCategory);

      return {
        project_id: projectId,
        component_type: normalized.component_type || null,
        description: normalized.description || "Unknown component",
        quantity,
        rated_current: normalized.rated_current || null,
        rated_voltage: normalized.rated_voltage || null,
        poles: normalized.poles || null,
        breaking_capacity: normalized.breaking_capacity || null,
        power_rating: normalized.power_rating || null,
        brand: normalized.brand || null,
        model_number: normalized.model_number || null,
        category_slug: categorySlug,
        coil_voltage: normalized.coil_voltage || null,
        ct_ratio: normalized.ct_ratio || null,
        accuracy_class: normalized.accuracy_class || null,
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

// ============================================================
// AI Prompt — domain-specific electrical BOM extraction
// ============================================================
async function parseWithAI(text: string): Promise<any[]> {
  const prompt = `You are an expert electrical engineer specializing in control panel design, switchgear BOMs, and industrial electrical systems.

Extract ALL electrical components from the following text and return a JSON array. Each item represents one distinct component/line item.

## CRITICAL RULES
- Return EVERY component you find. A typical panel BOM has 10-50 line items.
- Each row in a table, each numbered item, or each bullet point is likely a separate component.
- Extract the quantity SEPARATELY from the specification. Do NOT embed quantity inside the description.
- IGNORE non-BOM text: drawing titles, section headers, project metadata, title blocks, revision history, engineering notes, company names, drawing numbers, and general annotations.

## COMPONENT PATTERN RECOGNITION

Recognize these common electrical component formats:

**MCCB (Moulded Case Circuit Breaker):**
- "MCCB 250A 4P 36kA" → component_type: "MCCB", rated_current: "250A", poles: "4P", breaking_capacity: "36kA"
- "250A 4P MCCB" → same extraction, different word order
- "MCCB 125A TPN" → component_type: "MCCB", rated_current: "125A", poles: "TPN" (means 3P+N)

**MCB (Miniature Circuit Breaker):**
- "MCB 63A 3P 10kA" → component_type: "MCB", rated_current: "63A", poles: "3P", breaking_capacity: "10kA"
- "MCB 16A SP C Curve" → component_type: "MCB", rated_current: "16A", poles: "SP"

**ACB (Air Circuit Breaker):**
- "ACB 1600A 4P 65kA" → component_type: "ACB", rated_current: "1600A", poles: "4P", breaking_capacity: "65kA"

**Contactor:**
- "Contactor 65A AC-3 415V Coil" → component_type: "Contactor", rated_current: "65A", coil_voltage: "415V"
- "MNX 65 Contactor" → component_type: "Contactor", rated_current: "65A", model_number: "MNX 65"

**Overload Relay (OLR / Thermal Overload):**
- "OLR 55-65A" → component_type: "Overload Relay", rated_current: "55-65A"
- "Thermal Overload Relay 23-32A" → component_type: "Overload Relay", rated_current: "23-32A"

**CT (Current Transformer):**
- "CT 200/5A Class 1" → component_type: "CT", rated_current: "200/5A", accuracy_class: "Class 1"
- "Current Transformer 100/5A" → component_type: "CT", rated_current: "100/5A"

**SMPS (Switched Mode Power Supply):**
- "SMPS 24V DC 10A" → component_type: "SMPS", rated_voltage: "24V DC", rated_current: "10A"

**Control Transformer:**
- "Control Transformer 415/230V 1kVA" → component_type: "Control Transformer", rated_voltage: "415/230V", power_rating: "1kVA"

**VFD (Variable Frequency Drive):**
- "VFD 15kW 415V" → component_type: "VFD", power_rating: "15kW", rated_voltage: "415V"

**Starters:**
- "DOL Starter 7.5kW" → component_type: "DOL Starter", power_rating: "7.5kW"
- "Star Delta Starter 30kW" → component_type: "Star Delta Starter", power_rating: "30kW"

**Signalling:**
- "Push Button Green NO" → component_type: "Push Button"
- "Indicator Lamp Red 230V" → component_type: "Indicator Light", rated_voltage: "230V"

## QUANTITY PATTERNS
Recognize these quantity formats — extract as a NUMBER:
- "Qty: 3" or "Qty-3" → quantity: 3
- "3 Nos" or "3 No" or "3 nos." → quantity: 3
- "1 Set" or "2 Sets" → quantity: 1 or 2
- "1 Lot" → quantity: 1
- "50 m" or "100 meters" or "50 Mtrs" → quantity: 50 (for cables)
- If quantity appears in a separate column, still capture it

## POLE ABBREVIATIONS
- TPN = 3 Pole + Neutral (3P+N)
- TP = 3 Pole (3P)
- SPN = Single Pole + Neutral (1P+N)
- SP = Single Pole (1P)
- FP = 4 Pole (4P)

## CATEGORY CLASSIFICATION
Map each component to one of these category_slug values:
- MCCB, MCB, ACB, RCCB, RCBO, Isolator, Switch Fuse Unit, SPD → "low-voltage-switchgears"
- Contactor, Overload Relay, DOL Starter, Star Delta Starter, Push Button, Indicator Light, Selector Switch → "controlling-gear-signalling-devices"
- Relay, Timer, Timer Relay → "relays"
- CT, Meter, Energy Meter, Ammeter, Voltmeter → "meters"
- VFD, Soft Starter, PLC, HMI, SMPS, Power Supply, Control Transformer → "industrial-automation"
- Capacitor, Reactor → "capacitors-reactors"
- Cable, Wire, Busbar → "wires-cables"

## OUTPUT FORMAT
Each JSON object must have these fields:
- component_type (string): e.g. "MCCB", "Contactor", "CT"
- description (string): full description including all specs mentioned
- quantity (number): count of this item, default 1
- rated_current (string or null): e.g. "250A", "55-65A", "200/5A"
- rated_voltage (string or null): e.g. "415V", "24V DC", "415/230V"
- poles (string or null): e.g. "4P", "TPN", "3P"
- breaking_capacity (string or null): e.g. "36kA"
- power_rating (string or null): e.g. "15kW", "1kVA"
- coil_voltage (string or null): for contactors/relays
- brand (string or null): e.g. "Schneider", "ABB", "Siemens", "L&T", "Havells"
- model_number (string or null): if mentioned
- ct_ratio (string or null): for CTs, e.g. "200/5"
- accuracy_class (string or null): for CTs/meters, e.g. "Class 1"
- category_slug (string): from the classification above
- raw_text (string): the original text segment for this component

Return ONLY a valid JSON array. No markdown, no explanation, no extra text.

Text to parse:
${text.substring(0, 12000)}`;

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
          { role: "system", content: "You extract structured data from electrical engineering documents. Always return a valid JSON array with ALL components found. Never return a single object when multiple components exist. Never include non-component text like headers, titles, or notes." },
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
