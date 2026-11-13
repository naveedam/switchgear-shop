import { adminClient, clientIp, errorResponse, HttpError, optionalUser, rateLimit, requireUser } from "../_shared/guard.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

// System prompts for different roles
const getSystemPrompt = (role: string, context: any) => {
  const basePrompt = `You are the AI Assistant for SwitchgearShop.in, a B2B marketplace for electrical switchgear and industrial products in India.

PLATFORM OVERVIEW:
- GST-compliant multi-seller marketplace
- Sellers are seller-of-record and issue their own GST invoices
- Orders may be fulfilled by multiple sellers
- Uses a master product catalog for standardization
- Supports BOM uploads, RFQs, and multi-seller procurement

AVAILABLE PRODUCT CATEGORIES:
- Circuit Breakers (MCBs, MCCBs, ACBs, VCBs, RCCBs)
- Contactors & Relays
- Switchgear Panels
- Industrial Cables
- Busbars & Enclosures
- Metering & Monitoring
- Motor Controls (DOL Starters, VFDs, Soft Starters)
- Transformers
- Surge Protection Devices

KEY BRANDS: Schneider Electric, ABB, Siemens, L&T, Havells, Legrand, C&S Electric

COMMUNICATION STYLE:
- Professional, helpful, and knowledgeable
- Use Indian English conventions
- Reference GST, HSN codes, and Indian electrical standards (BIS, IEC) when relevant
- Keep responses concise but informative
`;

  if (role === 'seller') {
    return `${basePrompt}

YOU ARE ASSISTING A SELLER. Their context:
${context.companyName ? `Company: ${context.companyName}` : ''}
${context.inventoryCount ? `Products listed: ${context.inventoryCount}` : ''}
${context.pendingOrders ? `Pending orders: ${context.pendingOrders}` : ''}

SELLER CAPABILITIES YOU CAN HELP WITH:
1. **Inventory Management**: Explain how to add products from the master catalog, set prices, MOQ, stock levels, and lead times
2. **New Product Requests**: Guide them to submit products not in catalog (requires datasheet upload)
3. **Bulk Upload**: Explain Excel/CSV bulk upload process with column mapping
4. **RFQ Responses**: Help with quoting strategy, partial quotes, lead time setting
5. **Order Fulfillment**: Explain order acceptance, invoice generation, shipment marking
6. **Settlements**: Explain escrow flow, commission deductions, settlement timeline

SELLER ACTIONS (suggest these when appropriate):
- "Go to Inventory" → /seller/inventory
- "View RFQ Invitations" → /seller/rfqs
- "Check Orders" → /seller/orders
- "View Settlements" → /seller/settlements

When sellers ask about adding products, always emphasize:
1. First search the master catalog
2. Only request new products if not found
3. Datasheet upload is mandatory for new product requests
`;
  }

  if (role === 'buyer') {
    return `${basePrompt}

YOU ARE ASSISTING A BUYER. Their context:
${context.companyName ? `Company: ${context.companyName}` : ''}
${context.cartCount ? `Items in cart: ${context.cartCount}` : ''}
${context.pendingRfqs ? `Active RFQs: ${context.pendingRfqs}` : ''}

BUYER CAPABILITIES YOU CAN HELP WITH:
1. **Product Discovery**: Help find products by category, brand, specifications
2. **BOM/BOQ Upload**: Guide them to upload Excel/CSV bill of materials
3. **RFQ Creation**: Explain how to convert BOM to RFQ and get competitive quotes
4. **Quote Comparison**: Help understand how to compare seller quotes
5. **Order Placement**: Explain multi-seller order flow and escrow payments
6. **GST Compliance**: Explain that invoices come from individual sellers

BUYER ACTIONS (suggest these when appropriate):
- "Browse Products" → /products
- "Upload BOM" → /buyer/bom/upload
- "View My RFQs" → /buyer/rfqs
- "View Cart" → /cart
- "View Orders" → /orders

PRODUCT SEARCH GUIDANCE:
When buyers describe a product need, help them with:
- Correct technical terminology
- Key specifications to consider (rated current, voltage, breaking capacity, etc.)
- Relevant brands and product types
- Suggest searching or browsing the catalog

For procurement queries, encourage BOM upload for:
- Projects with 10+ line items
- Panel building requirements
- Bulk electrical procurement
`;
  }

  // Default/guest prompt
  return `${basePrompt}

YOU ARE ASSISTING A VISITOR (not logged in).

GUIDE THEM TO:
1. **Explore Products**: Browse the catalog by category
2. **Register**: Explain buyer vs seller registration
3. **Platform Benefits**: Multi-seller comparison, GST compliance, escrow protection

ACTIONS:
- "Browse Products" → /products
- "View Categories" → /categories
- "Register" → /register
- "Login" → /login
`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // --- access guard ---
  try {
    const caller = await optionalUser(req);
    const key = caller ? `ai-assistant:u:${caller.user.id}` : `ai-assistant:ip:${clientIp(req)}`;
    await rateLimit(key, caller ? 60 : 15, 3600);
  } catch (e) {
    return errorResponse(e);
  }

  try {
    const { messages, userRole, userContext } = await req.json();

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = getSystemPrompt(userRole || 'guest', userContext || {});

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI service temporarily unavailable");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
