import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Indian state codes
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

function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if (num === 0) return 'Zero';
  
  const convertLessThanThousand = (n: number): string => {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertLessThanThousand(n % 100) : '');
  };
  
  const convert = (n: number): string => {
    if (n < 1000) return convertLessThanThousand(n);
    if (n < 100000) return convertLessThanThousand(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convertLessThanThousand(n % 1000) : '');
    if (n < 10000000) return convertLessThanThousand(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convertLessThanThousand(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  };
  
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  
  let result = convert(rupees) + ' Rupees';
  if (paise > 0) {
    result += ' and ' + convert(paise) + ' Paise';
  }
  result += ' Only';
  
  return result;
}

function formatDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

interface InvoiceItem {
  description: string;
  hsn_code: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount: number;
  taxable_value: number;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  igst_rate: number;
  igst_amount: number;
  total: number;
}

interface InvoiceData {
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  seller: {
    name: string;
    gstin: string;
    address: string;
    state: string;
    state_code: string;
    pan?: string;
    email?: string;
    phone?: string;
  };
  buyer: {
    name: string;
    gstin?: string;
    address: string;
    state: string;
    state_code: string;
    email?: string;
    phone?: string;
  };
  items: InvoiceItem[];
  place_of_supply: string;
  is_inter_state: boolean;
  reverse_charge: boolean;
  summary: {
    total_taxable_value: number;
    total_cgst: number;
    total_sgst: number;
    total_igst: number;
    total_tax: number;
    grand_total: number;
  };
  irn?: string;
  qr_code?: string;
  notes?: string;
}

function generateInvoiceHTML(data: InvoiceData): string {
  const totalInWords = numberToWords(data.summary.grand_total);
  
  const itemRows = data.items.map((item, index) => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${index + 1}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.description}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.hsn_code}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.quantity} ${item.unit}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${item.unit_price.toFixed(2)}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${item.discount.toFixed(2)}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${item.taxable_value.toFixed(2)}</td>
      ${data.is_inter_state ? `
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.igst_rate}%</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${item.igst_amount.toFixed(2)}</td>
      ` : `
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.cgst_rate}%</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${item.cgst_amount.toFixed(2)}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.sgst_rate}%</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${item.sgst_amount.toFixed(2)}</td>
      `}
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">₹${item.total.toFixed(2)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; font-size: 12px; }
    .invoice-container { max-width: 800px; margin: 0 auto; border: 2px solid #333; }
    .header { background: #f5f5f5; padding: 20px; border-bottom: 2px solid #333; }
    .title { font-size: 24px; font-weight: bold; text-align: center; margin-bottom: 10px; }
    .subtitle { text-align: center; font-size: 14px; color: #666; }
    .section { padding: 15px; border-bottom: 1px solid #ddd; }
    .two-col { display: flex; justify-content: space-between; }
    .col { width: 48%; }
    .label { font-weight: bold; color: #333; margin-bottom: 5px; }
    .value { margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th { background: #f0f0f0; border: 1px solid #ddd; padding: 10px; text-align: center; font-weight: bold; }
    .summary-table { width: 50%; margin-left: auto; }
    .summary-table td { padding: 8px; border: 1px solid #ddd; }
    .grand-total { font-size: 16px; font-weight: bold; background: #f0f0f0; }
    .amount-words { background: #f9f9f9; padding: 10px; margin: 10px 0; border: 1px solid #ddd; font-style: italic; }
    .footer { padding: 20px; text-align: right; }
    .signature-box { border-top: 1px solid #333; padding-top: 10px; margin-top: 50px; display: inline-block; }
    .irn-section { background: #e8f5e9; padding: 10px; margin: 10px 0; border: 1px solid #4caf50; }
    @media print { body { margin: 0; } .invoice-container { border: none; } }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="title">TAX INVOICE</div>
      <div class="subtitle">${data.reverse_charge ? 'Subject to Reverse Charge' : 'Original for Recipient'}</div>
    </div>

    <div class="section">
      <div class="two-col">
        <div class="col">
          <div class="label">Seller Details</div>
          <div class="value"><strong>${data.seller.name}</strong></div>
          <div class="value">${data.seller.address}</div>
          <div class="value">State: ${data.seller.state} (${data.seller.state_code})</div>
          <div class="value"><strong>GSTIN:</strong> ${data.seller.gstin}</div>
          ${data.seller.pan ? `<div class="value"><strong>PAN:</strong> ${data.seller.pan}</div>` : ''}
          ${data.seller.email ? `<div class="value">Email: ${data.seller.email}</div>` : ''}
          ${data.seller.phone ? `<div class="value">Phone: ${data.seller.phone}</div>` : ''}
        </div>
        <div class="col" style="text-align: right;">
          <div class="value"><strong>Invoice No:</strong> ${data.invoice_number}</div>
          <div class="value"><strong>Invoice Date:</strong> ${data.invoice_date}</div>
          ${data.due_date ? `<div class="value"><strong>Due Date:</strong> ${data.due_date}</div>` : ''}
          <div class="value"><strong>Place of Supply:</strong> ${data.place_of_supply}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="label">Buyer Details</div>
      <div class="value"><strong>${data.buyer.name}</strong></div>
      <div class="value">${data.buyer.address}</div>
      <div class="value">State: ${data.buyer.state} (${data.buyer.state_code})</div>
      ${data.buyer.gstin ? `<div class="value"><strong>GSTIN:</strong> ${data.buyer.gstin}</div>` : '<div class="value"><em>Unregistered</em></div>'}
      ${data.buyer.email ? `<div class="value">Email: ${data.buyer.email}</div>` : ''}
    </div>

    <div class="section">
      <table>
        <thead>
          <tr>
            <th style="width: 5%;">S.No</th>
            <th style="width: 25%;">Description</th>
            <th style="width: 8%;">HSN</th>
            <th style="width: 8%;">Qty</th>
            <th style="width: 10%;">Rate</th>
            <th style="width: 8%;">Discount</th>
            <th style="width: 10%;">Taxable</th>
            ${data.is_inter_state ? `
              <th style="width: 6%;">IGST%</th>
              <th style="width: 10%;">IGST</th>
            ` : `
              <th style="width: 5%;">CGST%</th>
              <th style="width: 8%;">CGST</th>
              <th style="width: 5%;">SGST%</th>
              <th style="width: 8%;">SGST</th>
            `}
            <th style="width: 10%;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="two-col">
        <div class="col">
          <div class="amount-words">
            <strong>Amount in Words:</strong><br>
            ${totalInWords}
          </div>
          ${data.notes ? `<div class="value"><strong>Notes:</strong> ${data.notes}</div>` : ''}
        </div>
        <div class="col">
          <table class="summary-table">
            <tr>
              <td><strong>Taxable Value</strong></td>
              <td style="text-align: right;">₹${data.summary.total_taxable_value.toFixed(2)}</td>
            </tr>
            ${data.is_inter_state ? `
              <tr>
                <td>IGST</td>
                <td style="text-align: right;">₹${data.summary.total_igst.toFixed(2)}</td>
              </tr>
            ` : `
              <tr>
                <td>CGST</td>
                <td style="text-align: right;">₹${data.summary.total_cgst.toFixed(2)}</td>
              </tr>
              <tr>
                <td>SGST</td>
                <td style="text-align: right;">₹${data.summary.total_sgst.toFixed(2)}</td>
              </tr>
            `}
            <tr>
              <td><strong>Total Tax</strong></td>
              <td style="text-align: right;">₹${data.summary.total_tax.toFixed(2)}</td>
            </tr>
            <tr class="grand-total">
              <td><strong>Grand Total</strong></td>
              <td style="text-align: right;"><strong>₹${data.summary.grand_total.toFixed(2)}</strong></td>
            </tr>
          </table>
        </div>
      </div>
    </div>

    ${data.irn ? `
      <div class="irn-section">
        <strong>IRN:</strong> ${data.irn}<br>
        <small>This is a system generated e-invoice</small>
      </div>
    ` : ''}

    <div class="footer">
      <div>For <strong>${data.seller.name}</strong></div>
      <div class="signature-box">Authorized Signatory</div>
    </div>

    <div class="section" style="text-align: center; font-size: 10px; color: #666;">
      This is a computer generated invoice and does not require a physical signature.
    </div>
  </div>
</body>
</html>
  `;
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

    const body = await req.json();
    const { invoice_id, action } = body;

    if (!invoice_id) {
      return new Response(
        JSON.stringify({ error: "invoice_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch invoice with items
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from("invoices")
      .select(`
        *,
        invoice_items (*)
      `)
      .eq("id", invoice_id)
      .single();

    if (invoiceError || !invoice) {
      return new Response(
        JSON.stringify({ error: "Invoice not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user has access (seller or buyer)
    if (invoice.seller_id !== user.id && invoice.buyer_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sellerAddress = invoice.seller_address || {};
    const buyerAddress = invoice.buyer_address || {};
    const isInterState = (sellerAddress.state_code || '') !== (buyerAddress.state_code || '');

    const invoiceData: InvoiceData = {
      invoice_number: invoice.invoice_number,
      invoice_date: formatDate(new Date(invoice.created_at)),
      due_date: invoice.due_date ? formatDate(new Date(invoice.due_date)) : undefined,
      seller: {
        name: invoice.seller_name || 'Seller',
        gstin: invoice.seller_gstin || 'N/A',
        address: [sellerAddress.street, sellerAddress.city, sellerAddress.state, sellerAddress.zip_code].filter(Boolean).join(', '),
        state: STATE_CODES[sellerAddress.state_code] || sellerAddress.state || '',
        state_code: sellerAddress.state_code || '',
        pan: invoice.seller_gstin?.substring(2, 12),
      },
      buyer: {
        name: invoice.buyer_name || 'Buyer',
        gstin: invoice.buyer_gstin,
        address: [buyerAddress.street, buyerAddress.city, buyerAddress.state, buyerAddress.zip_code].filter(Boolean).join(', '),
        state: STATE_CODES[buyerAddress.state_code] || buyerAddress.state || '',
        state_code: buyerAddress.state_code || '',
      },
      items: (invoice.invoice_items || []).map((item: any) => ({
        description: item.description,
        hsn_code: item.hsn_code || '',
        quantity: Number(item.quantity),
        unit: item.unit || 'NOS',
        unit_price: Number(item.unit_price),
        discount: Number(item.discount) || 0,
        taxable_value: Number(item.taxable_value),
        cgst_rate: Number(item.cgst_rate) || 0,
        cgst_amount: Number(item.cgst_amount) || 0,
        sgst_rate: Number(item.sgst_rate) || 0,
        sgst_amount: Number(item.sgst_amount) || 0,
        igst_rate: Number(item.igst_rate) || 0,
        igst_amount: Number(item.igst_amount) || 0,
        total: Number(item.total),
      })),
      place_of_supply: STATE_CODES[invoice.place_of_supply] || invoice.place_of_supply || '',
      is_inter_state: isInterState,
      reverse_charge: invoice.reverse_charge || false,
      summary: {
        total_taxable_value: Number(invoice.amount) || 0,
        total_cgst: Number(invoice.cgst_amount) || 0,
        total_sgst: Number(invoice.sgst_amount) || 0,
        total_igst: Number(invoice.igst_amount) || 0,
        total_tax: Number(invoice.tax_amount) || 0,
        grand_total: Number(invoice.total_amount) || 0,
      },
      irn: invoice.irn,
      notes: invoice.notes,
    };

    const html = generateInvoiceHTML(invoiceData);

    console.log("Generated invoice PDF HTML for:", invoice.invoice_number);

    // Return HTML (can be converted to PDF client-side or by a PDF service)
    if (action === "html") {
      return new Response(html, {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/html" },
      });
    }

    // Return JSON with HTML for client to handle
    return new Response(
      JSON.stringify({
        invoice_number: invoice.invoice_number,
        html: html,
        data: invoiceData,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate invoice" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
