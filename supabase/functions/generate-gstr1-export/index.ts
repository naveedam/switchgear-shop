import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STATE_CODES: Record<string, string> = {
  "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab",
  "04": "Chandigarh", "05": "Uttarakhand", "06": "Haryana", "07": "Delhi",
  "08": "Rajasthan", "09": "Uttar Pradesh", "10": "Bihar", "11": "Sikkim",
  "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur", "15": "Mizoram",
  "16": "Tripura", "17": "Meghalaya", "18": "Assam", "19": "West Bengal",
  "20": "Jharkhand", "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh",
  "24": "Gujarat", "26": "Dadra and Nagar Haveli and Daman and Diu",
  "27": "Maharashtra", "28": "Andhra Pradesh (Old)", "29": "Karnataka",
  "30": "Goa", "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu",
  "34": "Puducherry", "35": "Andaman and Nicobar Islands", "36": "Telangana",
  "37": "Andhra Pradesh", "38": "Ladakh",
};

interface GSTR1ExportRequest {
  financial_year: string;
  month?: number; // 1-12 for monthly, undefined for quarterly
  quarter?: number; // 1-4 for quarterly
  format?: "json" | "excel";
}

interface B2BInvoice {
  ctin: string; // Recipient GSTIN
  inv: Array<{
    inum: string; // Invoice number
    idt: string; // Invoice date (dd-mmm-yyyy)
    val: number; // Invoice value
    pos: string; // Place of supply (state code)
    rchrg: string; // Reverse charge (Y/N)
    inv_typ: string; // Invoice type (R/SEZWP/SEZWOP/DE/EXP)
    itms: Array<{
      num: number;
      itm_det: {
        rt: number; // Tax rate
        txval: number; // Taxable value
        iamt?: number; // IGST amount
        camt?: number; // CGST amount
        samt?: number; // SGST amount
        csamt?: number; // Cess amount
      };
    }>;
  }>;
}

interface B2CLInvoice {
  pos: string;
  inv: Array<{
    inum: string;
    idt: string;
    val: number;
    itms: Array<{
      num: number;
      itm_det: {
        rt: number;
        txval: number;
        iamt: number;
        csamt?: number;
      };
    }>;
  }>;
}

interface HSNSummaryRow {
  hsn_sc: string;
  desc: string;
  uqc: string;
  qty: number;
  val: number;
  txval: number;
  iamt: number;
  camt: number;
  samt: number;
  csamt: number;
}

function formatDateForGSTR(dateStr: string): string {
  const date = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getDate().toString().padStart(2, '0')}-${months[date.getMonth()]}-${date.getFullYear()}`;
}

function getDateRange(financialYear: string, month?: number, quarter?: number): { start: Date; end: Date } {
  const [startYear, endYear] = financialYear.split('-').map((y, i) => {
    const year = parseInt(y);
    return year < 100 ? (i === 0 ? 2000 + year : 2000 + year) : year;
  });

  if (month) {
    // Month 1 = April, Month 12 = March
    const year = month <= 9 ? startYear : endYear;
    const actualMonth = month <= 9 ? month + 3 : month - 9; // Convert FY month to calendar month
    const start = new Date(year, actualMonth - 1, 1);
    const end = new Date(year, actualMonth, 0);
    return { start, end };
  }

  if (quarter) {
    // Q1 = Apr-Jun, Q2 = Jul-Sep, Q3 = Oct-Dec, Q4 = Jan-Mar
    const quarters = [
      { start: new Date(startYear, 3, 1), end: new Date(startYear, 5, 30) },
      { start: new Date(startYear, 6, 1), end: new Date(startYear, 8, 30) },
      { start: new Date(startYear, 9, 1), end: new Date(startYear, 11, 31) },
      { start: new Date(endYear, 0, 1), end: new Date(endYear, 2, 31) },
    ];
    return quarters[quarter - 1];
  }

  // Full year
  return {
    start: new Date(startYear, 3, 1), // April 1
    end: new Date(endYear, 2, 31), // March 31
  };
}

serve(async (req) => {
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

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: GSTR1ExportRequest = await req.json();
    const { financial_year, month, quarter, format = "json" } = body;

    if (!financial_year) {
      return new Response(
        JSON.stringify({ error: "financial_year is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get seller's company info
    const { data: company, error: companyError } = await supabaseClient
      .from("companies")
      .select("*")
      .eq("id", user.id)
      .single();

    if (companyError || !company?.gstin) {
      return new Response(
        JSON.stringify({ error: "Seller GSTIN not configured. Please update your company profile." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const dateRange = getDateRange(financial_year, month, quarter);

    // Fetch invoices for the period
    const { data: invoices, error: invoicesError } = await supabaseClient
      .from("invoices")
      .select(`
        *,
        invoice_items (*)
      `)
      .eq("seller_id", user.id)
      .gte("created_at", dateRange.start.toISOString())
      .lte("created_at", dateRange.end.toISOString())
      .order("created_at", { ascending: true });

    if (invoicesError) {
      throw invoicesError;
    }

    // Categorize invoices
    const b2bInvoices: Record<string, B2BInvoice["inv"]> = {};
    const b2clInvoices: Record<string, B2CLInvoice["inv"]> = {};
    const b2csData: Record<string, { txval: number; camt: number; samt: number }> = {};
    const hsnSummary: Record<string, HSNSummaryRow> = {};

    for (const invoice of invoices || []) {
      const isB2B = !!invoice.buyer_gstin;
      const isInterState = invoice.igst_amount > 0;
      const isB2CL = !isB2B && isInterState && invoice.total_amount >= 250000;
      
      const buyerAddress = invoice.buyer_address || {};

      // Process items for HSN summary
      for (const item of invoice.invoice_items || []) {
        const hsnCode = item.hsn_code || "0000";
        if (!hsnSummary[hsnCode]) {
          hsnSummary[hsnCode] = {
            hsn_sc: hsnCode,
            desc: item.description,
            uqc: item.unit || "NOS",
            qty: 0,
            val: 0,
            txval: 0,
            iamt: 0,
            camt: 0,
            samt: 0,
            csamt: 0,
          };
        }
        hsnSummary[hsnCode].qty += Number(item.quantity);
        hsnSummary[hsnCode].val += Number(item.total);
        hsnSummary[hsnCode].txval += Number(item.taxable_value);
        hsnSummary[hsnCode].iamt += Number(item.igst_amount) || 0;
        hsnSummary[hsnCode].camt += Number(item.cgst_amount) || 0;
        hsnSummary[hsnCode].samt += Number(item.sgst_amount) || 0;
      }

      // B2B Invoices (Table 4A, 4B)
      if (isB2B) {
        const ctin = invoice.buyer_gstin;
        if (!b2bInvoices[ctin]) {
          b2bInvoices[ctin] = [];
        }
        
        const taxRate = invoice.igst_rate || (invoice.cgst_rate + invoice.sgst_rate) || 18;
        
        b2bInvoices[ctin].push({
          inum: invoice.invoice_number,
          idt: formatDateForGSTR(invoice.created_at),
          val: Number(invoice.total_amount),
          pos: invoice.place_of_supply || buyerAddress.state_code || "",
          rchrg: invoice.reverse_charge ? "Y" : "N",
          inv_typ: "R", // Regular
          itms: [{
            num: 1,
            itm_det: {
              rt: taxRate,
              txval: Number(invoice.amount),
              iamt: Number(invoice.igst_amount) || undefined,
              camt: Number(invoice.cgst_amount) || undefined,
              samt: Number(invoice.sgst_amount) || undefined,
            },
          }],
        });
      }
      // B2C Large (Table 5A) - Inter-state > ₹2.5 lakh
      else if (isB2CL) {
        const pos = invoice.place_of_supply || buyerAddress.state_code || "";
        if (!b2clInvoices[pos]) {
          b2clInvoices[pos] = [];
        }
        
        b2clInvoices[pos].push({
          inum: invoice.invoice_number,
          idt: formatDateForGSTR(invoice.created_at),
          val: Number(invoice.total_amount),
          itms: [{
            num: 1,
            itm_det: {
              rt: Number(invoice.igst_rate) || 18,
              txval: Number(invoice.amount),
              iamt: Number(invoice.igst_amount),
            },
          }],
        });
      }
      // B2C Small (Table 7) - Consolidated by state
      else if (!isB2B && !isInterState) {
        const pos = invoice.place_of_supply || buyerAddress.state_code || company.state_code || "";
        if (!b2csData[pos]) {
          b2csData[pos] = { txval: 0, camt: 0, samt: 0 };
        }
        b2csData[pos].txval += Number(invoice.amount);
        b2csData[pos].camt += Number(invoice.cgst_amount) || 0;
        b2csData[pos].samt += Number(invoice.sgst_amount) || 0;
      }
    }

    // Build GSTR-1 JSON structure
    const gstr1Data = {
      gstin: company.gstin,
      fp: month 
        ? `${(month <= 9 ? month + 3 : month - 9).toString().padStart(2, '0')}${month <= 9 ? financial_year.split('-')[0] : financial_year.split('-')[1]}`
        : `${financial_year}`,
      version: "GST3.0.4",
      hash: "na",
      
      // B2B invoices (Table 4)
      b2b: Object.entries(b2bInvoices).map(([ctin, inv]) => ({
        ctin,
        inv,
      })),
      
      // B2CL invoices (Table 5)
      b2cl: Object.entries(b2clInvoices).map(([pos, inv]) => ({
        pos,
        inv,
      })),
      
      // B2CS summary (Table 7)
      b2cs: Object.entries(b2csData).map(([pos, data]) => ({
        sply_ty: "INTRA",
        pos,
        typ: "OE", // OE = Outward taxable
        rt: 18, // Assuming 18% - should be calculated per rate
        txval: Math.round(data.txval * 100) / 100,
        camt: Math.round(data.camt * 100) / 100,
        samt: Math.round(data.samt * 100) / 100,
        csamt: 0,
      })),
      
      // HSN Summary (Table 12)
      hsn: {
        data: Object.values(hsnSummary).map(row => ({
          ...row,
          qty: Math.round(row.qty * 1000) / 1000,
          val: Math.round(row.val * 100) / 100,
          txval: Math.round(row.txval * 100) / 100,
          iamt: Math.round(row.iamt * 100) / 100,
          camt: Math.round(row.camt * 100) / 100,
          samt: Math.round(row.samt * 100) / 100,
        })),
      },
    };

    // Summary statistics
    const summary = {
      period: month 
        ? `Month ${month} of FY ${financial_year}`
        : quarter 
          ? `Q${quarter} of FY ${financial_year}`
          : `FY ${financial_year}`,
      total_invoices: invoices?.length || 0,
      b2b_count: Object.values(b2bInvoices).flat().length,
      b2cl_count: Object.values(b2clInvoices).flat().length,
      b2cs_states: Object.keys(b2csData).length,
      hsn_codes: Object.keys(hsnSummary).length,
      total_taxable_value: Object.values(hsnSummary).reduce((sum, row) => sum + row.txval, 0),
      total_igst: Object.values(hsnSummary).reduce((sum, row) => sum + row.iamt, 0),
      total_cgst: Object.values(hsnSummary).reduce((sum, row) => sum + row.camt, 0),
      total_sgst: Object.values(hsnSummary).reduce((sum, row) => sum + row.samt, 0),
    };

    console.log("Generated GSTR-1 export:", {
      gstin: company.gstin,
      period: summary.period,
      invoices: summary.total_invoices,
    });

    return new Response(
      JSON.stringify({
        gstr1: gstr1Data,
        summary,
        generated_at: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error generating GSTR-1 export:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate GSTR-1 export" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
