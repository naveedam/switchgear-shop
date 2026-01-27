import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Indian state codes for GST
const STATE_CODES: Record<string, string> = {
  "01": "Jammu & Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "26": "Dadra and Nagar Haveli and Daman and Diu",
  "27": "Maharashtra",
  "28": "Andhra Pradesh (Old)",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman and Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "38": "Ladakh",
};

// Common HSN codes and their GST rates for electrical/switchgear products
const HSN_TAX_RATES: Record<string, number> = {
  // Circuit breakers, switches, fuses
  "8536": 18,
  "85361": 18,
  "85362": 18,
  "85363": 18,
  "85364": 18,
  "85365": 18,
  "85366": 18,
  "85367": 18,
  "85369": 18,
  // Electrical panels and boards
  "8537": 18,
  // Wires and cables
  "8544": 18,
  "85441": 18,
  "85442": 18,
  "85443": 18,
  "85444": 18,
  // Transformers
  "8504": 18,
  // Capacitors
  "8532": 18,
  // Resistors
  "8533": 18,
  // Meters and instruments
  "9030": 18,
  "9028": 18,
  // Motors
  "8501": 18,
  // Generators
  "8502": 18,
  // Default rate for electrical goods
  "default": 18,
};

interface GSTItem {
  description: string;
  hsn_code: string;
  quantity: number;
  unit_price: number;
  discount?: number;
}

interface GSTRequest {
  seller_state_code: string;
  buyer_state_code: string;
  items: GSTItem[];
  is_export?: boolean;
  is_sez?: boolean;
}

interface TaxBreakdown {
  description: string;
  hsn_code: string;
  quantity: number;
  unit_price: number;
  discount: number;
  taxable_value: number;
  tax_rate: number;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  igst_rate: number;
  igst_amount: number;
  total: number;
}

interface GSTResponse {
  is_inter_state: boolean;
  seller_state: string;
  buyer_state: string;
  invoice_type: string;
  items: TaxBreakdown[];
  summary: {
    total_taxable_value: number;
    total_cgst: number;
    total_sgst: number;
    total_igst: number;
    total_tax: number;
    grand_total: number;
  };
  hsn_summary: Record<string, {
    hsn_code: string;
    description: string;
    quantity: number;
    taxable_value: number;
    cgst: number;
    sgst: number;
    igst: number;
    total_tax: number;
  }>;
}

function getTaxRate(hsnCode: string): number {
  // Try exact match first
  if (HSN_TAX_RATES[hsnCode]) {
    return HSN_TAX_RATES[hsnCode];
  }
  
  // Try progressively shorter prefixes
  for (let i = hsnCode.length - 1; i >= 4; i--) {
    const prefix = hsnCode.substring(0, i);
    if (HSN_TAX_RATES[prefix]) {
      return HSN_TAX_RATES[prefix];
    }
  }
  
  return HSN_TAX_RATES["default"];
}

function calculateGST(request: GSTRequest): GSTResponse {
  const { seller_state_code, buyer_state_code, items, is_export, is_sez } = request;
  
  const isInterState = seller_state_code !== buyer_state_code;
  const sellerState = STATE_CODES[seller_state_code] || seller_state_code;
  const buyerState = STATE_CODES[buyer_state_code] || buyer_state_code;
  
  // Determine invoice type
  let invoiceType = "B2C";
  if (is_export) {
    invoiceType = "EXPORT";
  } else if (is_sez) {
    invoiceType = "SEZ";
  } else if (isInterState) {
    invoiceType = "B2B"; // Will be refined based on buyer GSTIN
  }
  
  const taxBreakdowns: TaxBreakdown[] = [];
  const hsnSummary: GSTResponse["hsn_summary"] = {};
  
  let totalTaxableValue = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;
  
  for (const item of items) {
    const discount = item.discount || 0;
    const taxableValue = (item.unit_price * item.quantity) - discount;
    const taxRate = getTaxRate(item.hsn_code);
    
    let cgstRate = 0;
    let cgstAmount = 0;
    let sgstRate = 0;
    let sgstAmount = 0;
    let igstRate = 0;
    let igstAmount = 0;
    
    if (is_export || is_sez) {
      // Zero-rated for exports and SEZ
    } else if (isInterState) {
      // IGST for inter-state
      igstRate = taxRate;
      igstAmount = (taxableValue * igstRate) / 100;
    } else {
      // CGST + SGST for intra-state (split 50-50)
      cgstRate = taxRate / 2;
      sgstRate = taxRate / 2;
      cgstAmount = (taxableValue * cgstRate) / 100;
      sgstAmount = (taxableValue * sgstRate) / 100;
    }
    
    const totalTax = cgstAmount + sgstAmount + igstAmount;
    const total = taxableValue + totalTax;
    
    taxBreakdowns.push({
      description: item.description,
      hsn_code: item.hsn_code,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount,
      taxable_value: Math.round(taxableValue * 100) / 100,
      tax_rate: taxRate,
      cgst_rate: cgstRate,
      cgst_amount: Math.round(cgstAmount * 100) / 100,
      sgst_rate: sgstRate,
      sgst_amount: Math.round(sgstAmount * 100) / 100,
      igst_rate: igstRate,
      igst_amount: Math.round(igstAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
    });
    
    totalTaxableValue += taxableValue;
    totalCGST += cgstAmount;
    totalSGST += sgstAmount;
    totalIGST += igstAmount;
    
    // Build HSN summary
    if (!hsnSummary[item.hsn_code]) {
      hsnSummary[item.hsn_code] = {
        hsn_code: item.hsn_code,
        description: item.description,
        quantity: 0,
        taxable_value: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        total_tax: 0,
      };
    }
    hsnSummary[item.hsn_code].quantity += item.quantity;
    hsnSummary[item.hsn_code].taxable_value += taxableValue;
    hsnSummary[item.hsn_code].cgst += cgstAmount;
    hsnSummary[item.hsn_code].sgst += sgstAmount;
    hsnSummary[item.hsn_code].igst += igstAmount;
    hsnSummary[item.hsn_code].total_tax += totalTax;
  }
  
  const totalTax = totalCGST + totalSGST + totalIGST;
  
  return {
    is_inter_state: isInterState,
    seller_state: sellerState,
    buyer_state: buyerState,
    invoice_type: invoiceType,
    items: taxBreakdowns,
    summary: {
      total_taxable_value: Math.round(totalTaxableValue * 100) / 100,
      total_cgst: Math.round(totalCGST * 100) / 100,
      total_sgst: Math.round(totalSGST * 100) / 100,
      total_igst: Math.round(totalIGST * 100) / 100,
      total_tax: Math.round(totalTax * 100) / 100,
      grand_total: Math.round((totalTaxableValue + totalTax) * 100) / 100,
    },
    hsn_summary: hsnSummary,
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization") ?? "" },
        },
      }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: GSTRequest = await req.json();
    
    // Validate required fields
    if (!body.seller_state_code || !body.buyer_state_code || !body.items || body.items.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required fields: seller_state_code, buyer_state_code, items" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Calculating GST for:", {
      seller_state: body.seller_state_code,
      buyer_state: body.buyer_state_code,
      items_count: body.items.length,
    });

    const result = calculateGST(body);

    console.log("GST calculation complete:", {
      is_inter_state: result.is_inter_state,
      invoice_type: result.invoice_type,
      grand_total: result.summary.grand_total,
    });

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error calculating GST:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to calculate GST" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
