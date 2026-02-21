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

// Component type patterns for electrical switchgear
const COMPONENT_PATTERNS = [
  { pattern: /\bMCCB\b/i, type: "MCCB", category: "low-voltage-switchgears" },
  { pattern: /\bMCB\b/i, type: "MCB", category: "low-voltage-switchgears" },
  { pattern: /\bACB\b/i, type: "ACB", category: "low-voltage-switchgears" },
  { pattern: /\bRCCB\b/i, type: "RCCB", category: "low-voltage-switchgears" },
  { pattern: /\bRCBO\b/i, type: "RCBO", category: "low-voltage-switchgears" },
  { pattern: /\bIsolator\b/i, type: "Isolator", category: "low-voltage-switchgears" },
  { pattern: /\bContactor\b/i, type: "Contactor", category: "controlling-gear-signalling-devices" },
  { pattern: /\bOverload\s*Relay\b/i, type: "Overload Relay", category: "relays" },
  { pattern: /\bRelay\b/i, type: "Relay", category: "relays" },
  { pattern: /\bTimer\b/i, type: "Timer", category: "controlling-gear-signalling-devices" },
  { pattern: /\bVFD\b/i, type: "VFD", category: "industrial-automation" },
  { pattern: /\bVariable\s*Frequency\s*Drive\b/i, type: "VFD", category: "industrial-automation" },
  { pattern: /\bSoft\s*Starter\b/i, type: "Soft Starter", category: "industrial-automation" },
  { pattern: /\bDOL\s*Starter\b/i, type: "DOL Starter", category: "controlling-gear-signalling-devices" },
  { pattern: /\bStar\s*Delta\b/i, type: "Star Delta Starter", category: "controlling-gear-signalling-devices" },
  { pattern: /\bPSU\b|Power\s*Supply/i, type: "Power Supply", category: "industrial-automation" },
  { pattern: /\bPLC\b/i, type: "PLC", category: "industrial-automation" },
  { pattern: /\bHMI\b/i, type: "HMI", category: "industrial-automation" },
  { pattern: /\bMeter\b|Energy\s*Meter/i, type: "Meter", category: "meters" },
  { pattern: /\bCT\b.*\bRatio\b/i, type: "CT", category: "meters" },
  { pattern: /\bCapacitor\b/i, type: "Capacitor", category: "capacitors-reactors" },
  { pattern: /\bCable\b/i, type: "Cable", category: "wires-cables" },
  { pattern: /\bBusbar\b/i, type: "Busbar", category: "low-voltage-switchgears" },
  { pattern: /\bEnclosure\b|\bPanel\s*Board\b/i, type: "Enclosure", category: "low-voltage-switchgears" },
  { pattern: /\bSwitch\b.*\bFuse\b|\bSFU\b/i, type: "Switch Fuse Unit", category: "low-voltage-switchgears" },
  { pattern: /\bPush\s*Button\b/i, type: "Push Button", category: "controlling-gear-signalling-devices" },
  { pattern: /\bIndicator\b|Pilot\s*Light/i, type: "Indicator Light", category: "controlling-gear-signalling-devices" },
  { pattern: /\bSelector\s*Switch\b/i, type: "Selector Switch", category: "controlling-gear-signalling-devices" },
  { pattern: /\bSPD\b|Surge\s*Protection/i, type: "SPD", category: "low-voltage-switchgears" },
];

// Spec patterns
const SPEC_PATTERNS = {
  rated_current: /(\d+(?:\.\d+)?)\s*(?:A|Amp|Amps)\b/i,
  rated_voltage: /(\d+(?:\.\d+)?)\s*(?:V|Volt|Volts)\b/i,
  breaking_capacity: /(\d+(?:\.\d+)?)\s*(?:kA)\b/i,
  power_rating_kw: /(\d+(?:\.\d+)?)\s*(?:kW)\b/i,
  power_rating_hp: /(\d+(?:\.\d+)?)\s*(?:HP)\b/i,
  poles: /(\d)\s*(?:P|Pole|Poles)\b/i,
};

const BRAND_PATTERNS = [
  /\bSchneider\b/i, /\bABB\b/i, /\bSiemens\b/i, /\bL&T\b|\bL\s*&\s*T\b/i,
  /\bHavells\b/i, /\bLegrand\b/i, /\bC&S\b|\bC\s*&\s*S\b/i, /\bHPL\b/i,
  /\bBCH\b/i, /\bGE\b/i, /\bEaton\b/i, /\bMitsubishi\b/i, /\bFuji\b/i,
  /\bSelec\b/i, /\bRishabh\b/i, /\bPolycab\b/i, /\bFinolex\b/i,
];

function detectComponentType(text: string): { type: string; category: string } | null {
  for (const cp of COMPONENT_PATTERNS) {
    if (cp.pattern.test(text)) {
      return { type: cp.type, category: cp.category };
    }
  }
  return null;
}

function extractSpecs(text: string) {
  const specs: Record<string, string> = {};
  
  const currentMatch = text.match(SPEC_PATTERNS.rated_current);
  if (currentMatch) specs.rated_current = currentMatch[1] + " A";

  const voltageMatch = text.match(SPEC_PATTERNS.rated_voltage);
  if (voltageMatch) specs.rated_voltage = voltageMatch[1] + " V";

  const breakingMatch = text.match(SPEC_PATTERNS.breaking_capacity);
  if (breakingMatch) specs.breaking_capacity = breakingMatch[1] + " kA";

  const kwMatch = text.match(SPEC_PATTERNS.power_rating_kw);
  if (kwMatch) specs.power_rating = kwMatch[1] + " kW";
  else {
    const hpMatch = text.match(SPEC_PATTERNS.power_rating_hp);
    if (hpMatch) specs.power_rating = hpMatch[1] + " HP";
  }

  const polesMatch = text.match(SPEC_PATTERNS.poles);
  if (polesMatch) specs.poles = polesMatch[1] + "P";

  return specs;
}

function detectBrand(text: string): string | null {
  for (const bp of BRAND_PATTERNS) {
    const match = text.match(bp);
    if (match) return match[0];
  }
  return null;
}

// Split raw text into candidate component lines
function extractCandidateLines(rawText: string): string[] {
  const lines = rawText.split(/\n/).map(l => l.trim()).filter(l => l.length > 3);
  const candidates: string[] = [];

  for (const line of lines) {
    // Check if line contains any component or spec pattern
    const hasComponent = COMPONENT_PATTERNS.some(cp => cp.pattern.test(line));
    const hasSpec = Object.values(SPEC_PATTERNS).some(sp => sp.test(line));
    
    if (hasComponent || hasSpec) {
      candidates.push(line);
    }
  }

  return candidates;
}

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

    // Step 1: Pattern-based extraction of candidate lines
    const candidateLines = extractCandidateLines(rawText);

    if (candidateLines.length === 0) {
      // Try AI-only approach for the whole text
      const aiResult = await parseWithAI(rawText);
      
      if (documentId) {
        await supabase.from("project_documents").update({ processing_status: "completed" }).eq("id", documentId);
      }

      // Save AI-parsed items
      if (aiResult.length > 0) {
        const bomItems = aiResult.map((item: any, idx: number) => ({
          project_id: projectId,
          component_type: item.component_type || null,
          description: item.description || "Unknown component",
          quantity: item.quantity || 1,
          rated_current: item.rated_current || null,
          rated_voltage: item.rated_voltage || null,
          poles: item.poles || null,
          breaking_capacity: item.breaking_capacity || null,
          power_rating: item.power_rating || null,
          brand: item.brand || null,
          model_number: item.model_number || null,
          category_slug: item.category_slug || null,
          confidence_score: item.confidence_score || 0.3,
          validation_status: item.confidence_score >= 0.7 ? "complete" : "needs_review",
          source_document_id: documentId || null,
          raw_text: item.raw_text || null,
        }));

        await supabase.from("project_bom_items").insert(bomItems);
      }

      return new Response(
        JSON.stringify({ success: true, items_found: aiResult.length, method: "ai_only" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: For each candidate, do pattern extraction + AI enhancement
    const bomItems = [];

    for (const line of candidateLines) {
      const component = detectComponentType(line);
      const specs = extractSpecs(line);
      const brand = detectBrand(line);

      // Calculate confidence
      let fieldsFound = 0;
      if (component) fieldsFound++;
      if (specs.rated_current) fieldsFound++;
      if (specs.rated_voltage) fieldsFound++;
      if (specs.poles) fieldsFound++;
      if (specs.breaking_capacity) fieldsFound++;
      if (specs.power_rating) fieldsFound++;
      if (brand) fieldsFound++;

      const confidence = Math.min(fieldsFound / 5, 1.0);

      bomItems.push({
        project_id: projectId,
        component_type: component?.type || null,
        description: line.substring(0, 500),
        quantity: extractQuantity(line),
        rated_current: specs.rated_current || null,
        rated_voltage: specs.rated_voltage || null,
        poles: specs.poles || null,
        breaking_capacity: specs.breaking_capacity || null,
        power_rating: specs.power_rating || null,
        brand: brand || null,
        category_slug: component?.category || null,
        confidence_score: confidence,
        validation_status: confidence >= 0.7 ? "complete" : confidence >= 0.4 ? "missing_fields" : "needs_review",
        source_document_id: documentId || null,
        raw_text: line,
      });
    }

    // Step 3: Use AI to enhance low-confidence items
    const lowConfidenceItems = bomItems.filter(b => b.confidence_score < 0.6);
    if (lowConfidenceItems.length > 0 && lowConfidenceItems.length <= 30) {
      const textBlock = lowConfidenceItems.map((item, i) => `Line ${i + 1}: ${item.raw_text}`).join("\n");
      const aiEnhancements = await parseWithAI(textBlock);

      for (let i = 0; i < Math.min(aiEnhancements.length, lowConfidenceItems.length); i++) {
        const ai = aiEnhancements[i];
        const item = lowConfidenceItems[i];
        // Merge AI data into item (only fill blanks)
        if (!item.component_type && ai.component_type) item.component_type = ai.component_type;
        if (!item.rated_current && ai.rated_current) item.rated_current = ai.rated_current;
        if (!item.rated_voltage && ai.rated_voltage) item.rated_voltage = ai.rated_voltage;
        if (!item.poles && ai.poles) item.poles = ai.poles;
        if (!item.breaking_capacity && ai.breaking_capacity) item.breaking_capacity = ai.breaking_capacity;
        if (!item.power_rating && ai.power_rating) item.power_rating = ai.power_rating;
        if (!item.brand && ai.brand) item.brand = ai.brand;
        if (!item.category_slug && ai.category_slug) item.category_slug = ai.category_slug;
        if (ai.model_number) item.model_number = ai.model_number;
        // Recalculate confidence
        let fields = 0;
        if (item.component_type) fields++;
        if (item.rated_current) fields++;
        if (item.rated_voltage) fields++;
        if (item.poles) fields++;
        if (item.breaking_capacity || item.power_rating) fields++;
        if (item.brand) fields++;
        item.confidence_score = Math.min(fields / 5, 1.0);
        item.validation_status = item.confidence_score >= 0.7 ? "complete" : item.confidence_score >= 0.4 ? "missing_fields" : "needs_review";
      }
    }

    // Save to database
    if (bomItems.length > 0) {
      const { error: insertError } = await supabase.from("project_bom_items").insert(bomItems);
      if (insertError) {
        console.error("Error inserting BOM items:", insertError);
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
        method: "pattern_and_ai",
        confidence_summary: {
          high: bomItems.filter(b => b.confidence_score >= 0.7).length,
          medium: bomItems.filter(b => b.confidence_score >= 0.4 && b.confidence_score < 0.7).length,
          low: bomItems.filter(b => b.confidence_score < 0.4).length,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in parse-bom-document:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function extractQuantity(text: string): number {
  // Look for patterns like "x 2", "Qty: 3", "2 Nos", etc.
  const qtyPatterns = [
    /(?:qty|quantity)\s*[:=]?\s*(\d+)/i,
    /(\d+)\s*(?:Nos|nos|pcs|pieces|units|sets)/i,
    /x\s*(\d+)\b/i,
  ];
  for (const p of qtyPatterns) {
    const match = text.match(p);
    if (match) return parseInt(match[1], 10);
  }
  return 1;
}

async function parseWithAI(text: string): Promise<any[]> {
  const prompt = `You are an expert electrical engineer. Extract structured electrical component data from the following text.
For each component found, return a JSON object with these fields:
- component_type (e.g., MCCB, MCB, Contactor, Relay, VFD, Cable, etc.)
- description (brief description)
- quantity (number, default 1)
- rated_current (e.g., "63 A")
- rated_voltage (e.g., "415 V")
- poles (e.g., "3P" or "4P")
- breaking_capacity (e.g., "25 kA")
- power_rating (e.g., "15 kW" or "20 HP")
- brand (if detected)
- model_number (if detected)
- category_slug (one of: low-voltage-switchgears, controlling-gear-signalling-devices, relays, meters, capacitors-reactors, wires-cables, industrial-automation)
- confidence_score (0-1, based on how many fields you extracted)
- raw_text (the original text for this component)

Return ONLY a valid JSON array. No extra text.

Text to parse:
${text.substring(0, 4000)}`;

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
          { role: "system", content: "You extract structured data from electrical engineering documents. Always return valid JSON arrays." },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.error("AI parsing failed:", response.status);
      return [];
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error("AI parsing error:", err);
    return [];
  }
}
