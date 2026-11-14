import { describe, expect, it } from "vitest";
import {
  buildEInvoiceJson,
  buildEwayBillJson,
  formatGstDate,
  parseIndianAddress,
  toUqc,
  validateForEInvoice,
  validateTransport,
  type InvoiceForGst,
} from "./einvoice";

const base = (): InvoiceForGst => ({
  number: "INV/25-26/0042",
  date: new Date(2026, 10, 13),
  seller: {
    gstin: "29AABCU9603R1ZM", legalName: "Ultra Electricals Pvt Ltd", addr1: "12 SP Road",
    location: "Bengaluru", pincode: "560002", stateCode: "29",
  },
  buyer: {
    gstin: "29AAACR5055K1Z5", legalName: "Panel Works LLP", addr1: "Plot 4, Peenya Industrial Area",
    location: "Bengaluru", pincode: "560058", stateCode: "29",
  },
  placeOfSupply: "29",
  lines: [
    { description: "MCCB 250A 4P 36kA", hsn: "853620", quantity: 10, unit: "Nos", unitPrice: 900,
      taxableValue: 9000, gstRate: 18, cgst: 810, sgst: 810, igst: 0 },
    { description: "Contactor 32A", hsn: "853649", quantity: 3, unit: "pcs", unitPrice: 500.335,
      taxableValue: 1501, gstRate: 18, cgst: 135.09, sgst: 135.09, igst: 0 },
  ],
});

describe("helpers", () => {
  it("formats dates dd/mm/yyyy", () => expect(formatGstDate(new Date(2026, 0, 5))).toBe("05/01/2026"));
  it("maps units to UQC", () => {
    expect(toUqc("Nos")).toBe("NOS");
    expect(toUqc("pcs")).toBe("PCS");
    expect(toUqc("Mtrs")).toBe("MTR");
    expect(toUqc(null)).toBe("NOS");
    expect(toUqc("drum")).toBe("OTH");
  });
  it("parses Indian addresses", () => {
    expect(parseIndianAddress("No 12, 3rd Cross, SP Road, Bengaluru, Karnataka - 560002")).toEqual({
      addr1: "No 12, 3rd Cross, SP Road", location: "Bengaluru", pincode: "560002",
    });
    expect(parseIndianAddress("Peenya 2nd Stage, Bangalore 560 058").pincode).toBe("560058");
    expect(parseIndianAddress("").pincode).toBe("");
  });
});

describe("validateForEInvoice", () => {
  it("accepts a correct intra-state invoice", () => expect(validateForEInvoice(base())).toEqual([]));
  it("flags bad GSTIN, PIN, HSN and wrong tax head", () => {
    const inv = base();
    inv.buyer.gstin = "29XXXX";
    inv.seller.pincode = "56002";
    inv.lines[0].hsn = "85";
    inv.lines[1].igst = 270;
    const fields = validateForEInvoice(inv).map((i) => i.field);
    expect(fields).toEqual(expect.arrayContaining(["buyer.gstin", "seller.pincode", "lines.0.hsn", "lines.1.igst"]));
  });
  it("flags state code / GSTIN mismatch", () => {
    const inv = base();
    inv.seller.stateCode = "33";
    expect(validateForEInvoice(inv).some((i) => i.message.includes("doesn't match GSTIN"))).toBe(true);
  });
  it("rejects invoice numbers longer than 16 chars or starting with 0", () => {
    const inv = base();
    inv.number = "INV/2025-26/000001";
    expect(validateForEInvoice(inv).some((i) => i.field === "number")).toBe(true);
    inv.number = "0123";
    expect(validateForEInvoice(inv).some((i) => i.field === "number")).toBe(true);
  });
});

describe("buildEInvoiceJson", () => {
  it("produces NIC schema 1.1 with consistent totals", () => {
    const j = buildEInvoiceJson(base());
    expect(j.Version).toBe("1.1");
    expect(j.DocDtls).toEqual({ Typ: "INV", No: "INV/25-26/0042", Dt: "13/11/2026" });
    expect(j.BuyerDtls.Pos).toBe("29");
    expect(j.SellerDtls.Pin).toBe(560002);
    expect(j.ItemList[0]).toMatchObject({ SlNo: "1", HsnCd: "853620", Unit: "NOS", AssAmt: 9000, TotItemVal: 10620 });
    expect(j.ItemList[1].Unit).toBe("PCS");
    expect(j.ValDtls.AssVal).toBe(10501);
    expect(j.ValDtls.CgstVal).toBe(945.09);
    // 10501 + 945.09*2 = 12391.18 -> rounds to 12391
    expect(j.ValDtls.TotInvVal).toBe(12391);
    expect(j.ValDtls.RndOffAmt).toBe(-0.18);
    expect(j).not.toHaveProperty("EwbDtls");
  });
  it("adds EWB details when transport is given", () => {
    const j = buildEInvoiceJson(base(), { distanceKm: 18.4, vehicleNo: "ka 01 ab 1234" });
    expect(j.EwbDtls).toEqual({ Distance: 18, TransMode: "1", VehNo: "KA01AB1234", VehType: "R" });
  });
  it("includes e-commerce operator GSTIN when provided", () => {
    const inv = base();
    inv.ecomGstin = "29AAGCS1234F1Z5";
    expect(buildEInvoiceJson(inv).TranDtls.EcmGstin).toBe("29AAGCS1234F1Z5");
  });
});

describe("e-way bill", () => {
  it("builds bulk JSON with split CGST/SGST rates for intra-state", () => {
    const j = buildEwayBillJson(base(), { distanceKm: 20, vehicleNo: "KA01AB1234" });
    const b = j.billLists[0];
    expect(b.mainHsnCode).toBe(853620);
    expect(b.itemList[0]).toMatchObject({ cgstRate: 9, sgstRate: 9, igstRate: 0, qtyUnit: "NOS" });
    expect(b.totInvValue).toBe(12391);
    expect(b.vehicleNo).toBe("KA01AB1234");
  });
  it("uses IGST for inter-state", () => {
    const inv = base();
    inv.placeOfSupply = "33";
    inv.buyer.stateCode = "33";
    inv.buyer.gstin = "33AAACR5055K1Z1";
    const b = buildEwayBillJson(inv, { distanceKm: 350, vehicleNo: "KA01AB1234" }).billLists[0];
    expect(b.itemList[0]).toMatchObject({ igstRate: 18, cgstRate: 0 });
  });
  it("validates transport", () => {
    expect(validateTransport({ distanceKm: 20, vehicleNo: "KA01AB1234" }, 80000)).toEqual([]);
    expect(validateTransport({ distanceKm: 20 }, 80000).map((i) => i.field)).toContain("vehicleNo");
    expect(validateTransport({ distanceKm: 20, vehicleNo: "XYZ" }, 80000).map((i) => i.field)).toContain("vehicleNo");
  });
});
