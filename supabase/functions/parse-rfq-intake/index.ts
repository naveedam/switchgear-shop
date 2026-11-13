import { errorResponse, requireUser } from "../_shared/guard.ts";
// Parse RFQ intake message / file into structured line items via OpenAI GPT-4o
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;

const SYSTEM_PROMPT = `You are an industrial procurement assistant for SwitchgearShop.in.
Extract every distinct product line item from the user's RFQ enquiry (WhatsApp message, email, PDF, Excel sheet, scan, or photo of a BOM).

For EACH line item return:
- manufacturer (e.g. "ABB", "Siemens", "Schneider Electric", "L&T", "Havells", "Polycab"). Use null if unknown.
- product_family (e.g. "Tmax MCCB", "Simatic S7-1500 PLC", "ACS580 Drive", "Sentron"). Null if unclear.
- part_number (the exact catalogue / order code if mentioned, e.g. "PP865", "6ES7515-2AM02-0AB0"). Null if not mentioned.
- description (free-text description of the item).
- quantity (positive integer; default 1 if not specified).
- unit (one of: "nos", "set", "mtr", "kg", "lot"). Default "nos".

Also extract any customer contact info you see (name, company, email, phone). Be conservative — leave fields null when not stated.

Respond ONLY with valid JSON of shape:
{
  "customer": { "name": string|null, "company": string|null, "email": string|null, "phone": string|null },
  "items": [ { "manufacturer": ..., "product_family": ..., "part_number": ..., "description": ..., "quantity": ..., "unit": ... } ]
}`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // --- access guard ---
  try {
    await requireUser(req, ["admin"]);
  } catch (e) {
    return errorResponse(e);
  }

  try {
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');

    const body = await req.json();
    const { text, fileBase64, mimeType } = body as {
      text?: string;
      fileBase64?: string;
      mimeType?: string;
    };

    if (!text && !fileBase64) {
      return new Response(JSON.stringify({ error: 'text or fileBase64 required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build the user message content
    const userContent: any[] = [];
    if (text) {
      userContent.push({ type: 'text', text: `RFQ enquiry:\n\n${text}` });
    }
    if (fileBase64 && mimeType) {
      if (mimeType.startsWith('image/')) {
        userContent.push({
          type: 'image_url',
          image_url: { url: `data:${mimeType};base64,${fileBase64}` },
        });
      } else if (mimeType === 'application/pdf') {
        // OpenAI gpt-4o accepts PDFs as input_file in Responses API; for chat completions we use file
        userContent.push({
          type: 'file',
          file: { filename: 'rfq.pdf', file_data: `data:application/pdf;base64,${fileBase64}` },
        });
      } else {
        userContent.push({
          type: 'text',
          text: `(Attached file of type ${mimeType}, base64 omitted — extract from text only.)`,
        });
      }
      if (!text) userContent.unshift({ type: 'text', text: 'Extract all line items from the attached RFQ document.' });
    }

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('OpenAI error:', resp.status, errText);
      return new Response(JSON.stringify({ error: 'AI extraction failed', detail: errText }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content ?? '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { customer: {}, items: [] };
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('parse-rfq-intake error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
