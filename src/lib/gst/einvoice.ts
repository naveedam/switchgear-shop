/**
 * GST e-invoice (IRP, NIC schema v1.1) and e-way bill (bulk JSON) builders.
 *
 * Sellers download these JSON files and upload them on
 *   - einvoice1.gst.gov.in  → Bulk Upload (e-invoice; returns IRN + signed QR)
 *   - ewaybillgst.gov.in    → e-Way Bill → Generate Bulk
 * then paste the IRN / e-way bill number back into SwitchgearShop.
 *
 * Pure functions: no network, fully unit-tested in einvoice.test.ts.
 */

export interface Party {
  gstin: string | null;
  legalName: string;
  tradeName?: string | null;
  addr1: string;
  addr2?: string | null;
  location: string; // city / town
  pincode: string; // 6 digits
  stateCode: string; // 2 digits, e.g. "29" for Karnataka
  phone?: string | null;
  email?: string | null;
}

export interface InvoiceLine {
  description: string;
  hsn: string;
  quantity: number;
  unit?: string | null;
  unitPrice: number;
  discount?: number;
  taxableValue: number;
  gstRate: number; // total GST %, e.g. 18
  cgst: number;
  sgst: number;
  igst: number;
}

export interface InvoiceForGst {
  number: string;
  date: Date | string;
  seller: Party;
  buyer: Party;
  placeOfSupply: string; // state code
  reverseCharge?: boolean;
  lines: InvoiceLine[];
  /** GSTIN of the e-commerce operator, if it collects TCS (Sec 52). */
  ecomGstin?: string | null;
}

export interface Transport {
  distanceKm: number;
  transporterId?: string | null; // transporter GSTIN / TRANSIN
  transporterName?: string | null;
  vehicleNo?: string | null;
  transDocNo?: string | null;
  transDocDate?: Date | string | null;
  mode?: "road" | "rail" | "air" | "ship";
}

export const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

/** Map free-text units to GST UQC codes. Unknown -> OTH. */
export function toUqc(unit?: string | null): string {
  const u = (unit ?? "").trim().toUpperCase().replace(/\.$/, "");
  const map: Record<string, string> = {
    "": "NOS", NO: "NOS", NOS: "NOS", NUMBER: "NOS", NUMBERS: "NOS", EA: "NOS", EACH: "NOS", UNIT: "UNT", UNITS: "UNT",
    PC: "PCS", PCS: "PCS", PIECE: "PCS", PIECES: "PCS",
    SET: "SET", SETS: "SET", PAIR: "PRS", PAIRS: "PRS", PRS: "PRS",
    M: "MTR", MTR: "MTR", MTRS: "MTR", METER: "MTR", METRE: "MTR", METERS: "MTR", METRES: "MTR",
    KM: "KME", KG: "KGS", KGS: "KGS", G: "GMS", GM: "GMS", GMS: "GMS",
    BOX: "BOX", BOXES: "BOX", ROLL: "ROL", ROLLS: "ROL", COIL: "ROL", COILS: "ROL", BUNDLE: "BDL", BDL: "BDL",
    PKT: "PAC", PACK: "PAC", PACKET: "PAC", L: "LTR", LTR: "LTR", LITRE: "LTR",
  };
  return map[u] ?? "OTH";
}

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function formatGstDate(d: Date | string): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${dt.getFullYear()}`;
}

/** Best-effort split of a free-text Indian address into line, city and PIN. */
export function parseIndianAddress(text: string | null | undefined): { addr1: string; location: string; pincode: string } {
  const s = (text ?? "").replace(/\s+/g, " ").trim();
  const pin = s.match(/\b([1-9][0-9]{2})\s?([0-9]{3})\b(?!.*\b[1-9][0-9]{2}\s?[0-9]{3}\b)/);
  const pincode = pin ? pin[1] + pin[2] : "";
  const beforePin = pin ? s.slice(0, pin.index).replace(/[-,\s]+$/, "") : s;
  const parts = beforePin.split(",").map((p) => p.trim()).filter(Boolean);
  // City is usually the last part that isn't a state name.
  const STATES = /^(karnataka|tamil nadu|kerala|maharashtra|telangana|andhra pradesh|gujarat|delhi|new delhi|uttar pradesh|west bengal|rajasthan|haryana|punjab|goa|madhya pradesh|odisha|bihar|india)$/i;
  const candidates = parts.filter((p) => !STATES.test(p));
  const location = (candidates[candidates.length - 1] ?? "").replace(/\s*-\s*$/, "");
  const addr1 = (candidates.length > 1 ? candidates.slice(0, -1).join(", ") : parts.join(", ")) || s;
  return { addr1: addr1.slice(0, 100), location: location.slice(0, 50), pincode };
}

export interface ValidationIssue {
  field: string;
  message: string;
}

export function validateForEInvoice(inv: InvoiceForGst): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const party = (who: "seller" | "buyer", p: Party) => {
    if (!p.gstin || !GSTIN_RE.test(p.gstin)) issues.push({ field: `${who}.gstin`, message: `${who === "seller" ? "Your" : "Buyer"} GSTIN is missing or invalid` });
    if (!p.legalName?.trim()) issues.push({ field: `${who}.legalName`, message: `${who} legal name is required` });
    if (!p.addr1 || p.addr1.trim().length < 3) issues.push({ field: `${who}.addr1`, message: `${who} address is required` });
    if (!p.location || p.location.trim().length < 3) issues.push({ field: `${who}.location`, message: `${who} city is required` });
    if (!/^[1-9][0-9]{5}$/.test(p.pincode)) issues.push({ field: `${who}.pincode`, message: `${who} PIN code must be 6 digits` });
    if (!/^[0-9]{2}$/.test(p.stateCode)) issues.push({ field: `${who}.stateCode`, message: `${who} state code is required` });
    if (p.gstin && GSTIN_RE.test(p.gstin) && p.gstin.slice(0, 2) !== p.stateCode)
      issues.push({ field: `${who}.stateCode`, message: `${who} state code doesn't match GSTIN (${p.gstin.slice(0, 2)})` });
  };
  party("seller", inv.seller);
  party("buyer", inv.buyer);
  if (!inv.number || inv.number.length > 16 || !/^[A-Za-z1-9][A-Za-z0-9/-]*$/.test(inv.number))
    issues.push({ field: "number", message: "Invoice number must be 1–16 characters (letters, digits, / and -), not starting with 0" });
  if (!inv.lines.length) issues.push({ field: "lines", message: "Invoice has no items" });
  inv.lines.forEach((l, i) => {
    if (!/^[0-9]{4}([0-9]{2}){0,2}$/.test(l.hsn ?? "")) issues.push({ field: `lines.${i}.hsn`, message: `Item ${i + 1}: HSN must be 4, 6 or 8 digits` });
  });
  const intra = inv.seller.stateCode === inv.placeOfSupply;
  inv.lines.forEach((l, i) => {
    if (intra && l.igst > 0) issues.push({ field: `lines.${i}.igst`, message: `Item ${i + 1}: intra-state sale should have CGST+SGST, not IGST` });
    if (!intra && (l.cgst > 0 || l.sgst > 0)) issues.push({ field: `lines.${i}.cgst`, message: `Item ${i + 1}: inter-state sale should have IGST` });
  });
  return issues;
}

/** NIC e-invoice JSON (schema 1.1) for one invoice. Upload an array of these. */
export function buildEInvoiceJson(inv: InvoiceForGst, transport?: Transport) {
  const items = inv.lines.map((l, i) => {
    const gross = r2(l.unitPrice * l.quantity);
    const discount = r2(l.discount ?? Math.max(0, gross - l.taxableValue));
    const tot = r2(l.taxableValue + l.cgst + l.sgst + l.igst);
    return {
      SlNo: String(i + 1),
      PrdDesc: l.description.slice(0, 300),
      IsServc: "N",
      HsnCd: l.hsn,
      Qty: r2(l.quantity),
      Unit: toUqc(l.unit),
      UnitPrice: r2(l.unitPrice),
      TotAmt: gross,
      Discount: discount,
      AssAmt: r2(l.taxableValue),
      GstRt: l.gstRate,
      IgstAmt: r2(l.igst),
      CgstAmt: r2(l.cgst),
      SgstAmt: r2(l.sgst),
      CesRt: 0, CesAmt: 0, CesNonAdvlAmt: 0, StateCesRt: 0, StateCesAmt: 0, StateCesNonAdvlAmt: 0,
      OthChrg: 0,
      TotItemVal: tot,
    };
  });
  const sum = (k: "AssAmt" | "CgstAmt" | "SgstAmt" | "IgstAmt" | "TotItemVal") => r2(items.reduce((s, it) => s + it[k], 0));
  const totExact = sum("TotItemVal");
  const totRounded = Math.round(totExact);

  const party = (p: Party) => ({
    Gstin: p.gstin,
    LglNm: p.legalName.slice(0, 100),
    TrdNm: (p.tradeName || p.legalName).slice(0, 100),
    Addr1: p.addr1.slice(0, 100),
    ...(p.addr2 ? { Addr2: p.addr2.slice(0, 100) } : {}),
    Loc: p.location.slice(0, 50),
    Pin: Number(p.pincode),
    Stcd: p.stateCode,
    ...(p.phone ? { Ph: p.phone.replace(/\D/g, "").slice(-12) } : {}),
    ...(p.email ? { Em: p.email } : {}),
  });

  return {
    Version: "1.1",
    TranDtls: {
      TaxSch: "GST",
      SupTyp: "B2B",
      RegRev: inv.reverseCharge ? "Y" : "N",
      EcmGstin: inv.ecomGstin || null,
      IgstOnIntra: "N",
    },
    DocDtls: { Typ: "INV", No: inv.number, Dt: formatGstDate(inv.date) },
    SellerDtls: party(inv.seller),
    BuyerDtls: { ...party(inv.buyer), Pos: inv.placeOfSupply },
    ItemList: items,
    ValDtls: {
      AssVal: sum("AssAmt"),
      CgstVal: sum("CgstAmt"),
      SgstVal: sum("SgstAmt"),
      IgstVal: sum("IgstAmt"),
      CesVal: 0, StCesVal: 0, Discount: 0, OthChrg: 0,
      RndOffAmt: r2(totRounded - totExact),
      TotInvVal: totRounded,
    },
    ...(transport && transport.distanceKm >= 0
      ? {
          EwbDtls: {
            ...(transport.transporterId ? { TransId: transport.transporterId } : {}),
            ...(transport.transporterName ? { TransName: transport.transporterName } : {}),
            Distance: Math.round(transport.distanceKm),
            ...(transport.vehicleNo
              ? { TransMode: modeCode(transport.mode), VehNo: normaliseVehicle(transport.vehicleNo), VehType: "R" }
              : {}),
            ...(transport.transDocNo ? { TransDocNo: transport.transDocNo } : {}),
            ...(transport.transDocDate ? { TransDocDt: formatGstDate(transport.transDocDate) } : {}),
          },
        }
      : {}),
  };
}

const modeCode = (m?: Transport["mode"]) => ({ road: "1", rail: "2", air: "3", ship: "4" })[m ?? "road"];
export const normaliseVehicle = (v: string) => v.toUpperCase().replace(/[^A-Z0-9]/g, "");

/**
 * E-way bill bulk-generation JSON (for invoices where e-invoicing doesn't apply,
 * or when generating the EWB separately). Required when consignment value > ₹50,000.
 */
export function buildEwayBillJson(inv: InvoiceForGst, transport: Transport) {
  const lines = inv.lines;
  const assVal = r2(lines.reduce((s, l) => s + l.taxableValue, 0));
  const cgst = r2(lines.reduce((s, l) => s + l.cgst, 0));
  const sgst = r2(lines.reduce((s, l) => s + l.sgst, 0));
  const igst = r2(lines.reduce((s, l) => s + l.igst, 0));
  const mainHsn = [...lines].sort((a, b) => b.taxableValue - a.taxableValue)[0]?.hsn ?? "";
  const intra = inv.seller.stateCode === inv.placeOfSupply;

  return {
    version: "1.0.0621",
    billLists: [
      {
        userGstin: inv.seller.gstin,
        supplyType: "O",
        subSupplyType: 1,
        subSupplyDesc: "",
        docType: "INV",
        docNo: inv.number,
        docDate: formatGstDate(inv.date),
        fromGstin: inv.seller.gstin,
        fromTrdName: inv.seller.tradeName || inv.seller.legalName,
        fromAddr1: inv.seller.addr1,
        fromAddr2: inv.seller.addr2 ?? "",
        fromPlace: inv.seller.location,
        fromPincode: Number(inv.seller.pincode),
        fromStateCode: Number(inv.seller.stateCode),
        actFromStateCode: Number(inv.seller.stateCode),
        toGstin: inv.buyer.gstin || "URP",
        toTrdName: inv.buyer.tradeName || inv.buyer.legalName,
        toAddr1: inv.buyer.addr1,
        toAddr2: inv.buyer.addr2 ?? "",
        toPlace: inv.buyer.location,
        toPincode: Number(inv.buyer.pincode),
        toStateCode: Number(inv.placeOfSupply),
        actToStateCode: Number(inv.buyer.stateCode),
        transactionType: 1,
        dispatchFromGSTIN: "",
        dispatchFromTradeName: "",
        shipToGSTIN: "",
        shipToTradeName: "",
        totalValue: assVal,
        cgstValue: cgst,
        sgstValue: sgst,
        igstValue: igst,
        cessValue: 0,
        cessNonAdvolValue: 0,
        OthValue: 0,
        totInvValue: Math.round(assVal + cgst + sgst + igst),
        transMode: Number(modeCode(transport.mode)),
        transDistance: String(Math.round(transport.distanceKm)),
        transporterName: transport.transporterName ?? "",
        transporterId: transport.transporterId ?? "",
        transDocNo: transport.transDocNo ?? "",
        transDocDate: transport.transDocDate ? formatGstDate(transport.transDocDate) : "",
        vehicleNo: transport.vehicleNo ? normaliseVehicle(transport.vehicleNo) : "",
        vehicleType: "R",
        mainHsnCode: Number(mainHsn),
        itemList: lines.map((l, i) => ({
          itemNo: i + 1,
          productName: l.description.slice(0, 100),
          productDesc: l.description.slice(0, 100),
          hsnCode: Number(l.hsn),
          quantity: r2(l.quantity),
          qtyUnit: toUqc(l.unit),
          taxableAmount: r2(l.taxableValue),
          sgstRate: intra ? l.gstRate / 2 : 0,
          cgstRate: intra ? l.gstRate / 2 : 0,
          igstRate: intra ? 0 : l.gstRate,
          cessRate: 0,
          cessNonAdvol: 0,
        })),
      },
    ],
  };
}

export function validateTransport(t: Transport, invoiceValue: number): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!(t.distanceKm >= 0 && t.distanceKm <= 4000)) issues.push({ field: "distance", message: "Distance must be 0–4000 km" });
  if (!t.vehicleNo && !t.transporterId) issues.push({ field: "vehicleNo", message: "Enter a vehicle number or a transporter ID" });
  if (t.vehicleNo && !/^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/.test(normaliseVehicle(t.vehicleNo)))
    issues.push({ field: "vehicleNo", message: "Vehicle number looks wrong (e.g. KA01AB1234)" });
  if (invoiceValue <= 50000)
    issues.push({ field: "value", message: "E-way bill is optional for consignments up to ₹50,000 (check your state's rule)" });
  return issues;
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
