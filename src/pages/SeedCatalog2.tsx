import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const BRANDS = {
  havells:   { brand_id: "8f88abf7-db43-423d-92b3-ffdbdc1c3446", vendor_id: "9d6f0dcf-7b1e-4ea8-96d8-513506b8e418" },
  schneider: { brand_id: "633815cb-b043-42ac-bd72-b803c6bce1b6", vendor_id: "5f0d38d6-5590-47b1-9274-bcebbb061f79" },
  lt:        { brand_id: "c6775030-5d53-4e57-9151-a5be09ed1294", vendor_id: "d0ecc503-2154-4bdc-9820-a474544c9c06" },
  siemens:   { brand_id: "f03caea4-145e-4207-89d0-907dc0ede710", vendor_id: "0198f9a3-6ec8-4bb5-b680-248a834904c5" },
  legrand:   { brand_id: "d4e1bb5c-d795-4c59-ad4e-677dffbb6a20", vendor_id: "14c1b96b-52e0-4d74-ae89-4e87e3cdeceb" },
  hager:     { brand_id: "6061c3df-0de5-4164-a0a2-26c6557db6c2", vendor_id: "14c1b96b-52e0-4d74-ae89-4e87e3cdeceb" },
};

const MCB_SUBCAT_BY_POLE: Record<number, string> = {
  1: "MCB - Single Pole",
  2: "MCB - Double Pole",
  3: "MCB - Triple Pole",
  4: "MCB - 4 Pole",
};
const RCCB_SUBCAT_BY_POLE: Record<number, string> = {
  2: "RCCB - 2 Pole",
  4: "RCCB - 4 Pole",
};

const POLE_LABEL: Record<number, string> = { 1: "1P", 2: "2P", 3: "3P", 4: "4P" };
const POLE_LABEL_HAV: Record<number, string> = { 1: "SP", 2: "DP", 3: "TP", 4: "4P" };

const COMMON = {
  status: "active",
  currency: "INR",
  hsn_code: "85362010",
  tax_rate: 18.0,
  min_order_quantity: 1,
  stock_quantity: 0,
  warranty_period: "12 months",
  mounting_type: "DIN Rail 35mm",
  rated_frequency: "50 Hz",
  Images: "[]",
  category: "low_voltage_switchgear",
};

function mcbVoltage(brand: string, p: number) {
  if (brand === "havells" || brand === "lt") return p === 1 ? "240V AC" : "415V AC";
  if (p === 1) return "230V AC";
  if (p === 2) return "400V AC";
  return "415V AC";
}

function buildProducts(subMap: Record<string, string>) {
  const products: any[] = [];
  const curves = ["B", "C"];

  // Havells MCB
  {
    const basePrice: Record<number, number> = { 1: 130, 2: 270, 3: 490, 4: 750 };
    for (const p of [1, 2, 3, 4]) for (const c of curves) for (const a of [6,10,16,20,25,32,40,63]) {
      const sub = subMap[MCB_SUBCAT_BY_POLE[p]];
      const sku = `HAV-DHMG-${POLE_LABEL_HAV[p]}-${c}${a}`;
      products.push({
        ...COMMON, ...BRANDS.havells,
        subcategory_id: sub,
        name: `Havells DHMG ${POLE_LABEL[p]} ${c}-Curve ${a}A MCB`,
        sku,
        description: `Havells DHMG series ${POLE_LABEL[p]} ${a}A ${c}-curve MCB, 10kA breaking capacity`,
        price: Math.round(basePrice[p] * (1 + a/200)),
        rated_voltage: mcbVoltage("havells", p),
        rated_current: `${a}A`,
        breaking_capacity: "10kA",
        breaking_capacity_icu: "10kA at 415V AC",
        tripping_characteristic: `Curve ${c}`,
        pole_count: p, number_of_poles: p,
        rated_insulation_voltage: "500V",
        width_per_pole: "17.5mm",
        mechanical_life_cycles: "20,000",
        electrical_life_cycles: "10,000",
        series_name: "DHMG",
        model_number: sku,
        iec_standards_compliance: ["IS/IEC 60898-1"],
        ce_marked: false, rohs_compliant: true,
      });
    }
  }

  // Havells RCCB
  {
    const basePrice: Record<number, number> = { 2: 950, 4: 1900 };
    for (const p of [2, 4]) for (const a of [25,40,63,100]) for (const s of ["30mA","100mA","300mA"]) {
      const sub = subMap[RCCB_SUBCAT_BY_POLE[p]];
      const sku = `HAV-DHRB-${POLE_LABEL[p]}-${a}A-${s}`;
      let price = basePrice[p] * (a/25);
      if (s === "30mA") price *= 1.2;
      products.push({
        ...COMMON, ...BRANDS.havells,
        hsn_code: "85363010",
        subcategory_id: sub,
        name: `Havells DHRB ${POLE_LABEL[p]} ${a}A ${s} RCCB`,
        sku,
        description: `Havells DHRB series ${POLE_LABEL[p]} ${a}A ${s} sensitivity RCCB`,
        price: Math.round(price),
        rated_voltage: "415V AC",
        rated_current: `${a}A`,
        residual_current_rating: s,
        residual_current_type: "AC",
        pole_count: p, number_of_poles: p,
        series_name: "DHRB",
        model_number: sku,
        iec_standards_compliance: ["IS/IEC 61008-1"],
        ce_marked: false, rohs_compliant: true,
      });
    }
  }

  // Helper for standard MCB series
  const addMcbSeries = (opts: {
    brandKey: keyof typeof BRANDS;
    skuPrefix: string;
    seriesName: string;
    nameLabel: string;
    poles: number[];
    basePrice: Record<number, number>;
    priceMult?: number;
    breakingCapacity: string;
    breakingIcu: string;
    iec: string[];
    ce: boolean;
    impulse?: string;
    poleLabelMap?: Record<number, string>;
  }) => {
    const pl = opts.poleLabelMap || POLE_LABEL;
    for (const p of opts.poles) for (const c of curves) for (const a of [6,10,16,20,25,32,40,50,63]) {
      const sub = subMap[MCB_SUBCAT_BY_POLE[p]];
      const sku = `${opts.skuPrefix}-${pl[p]}-${c}${a}`;
      const price = Math.round(opts.basePrice[p] * (1 + a/200) * (opts.priceMult || 1));
      const prod: any = {
        ...COMMON, ...BRANDS[opts.brandKey],
        subcategory_id: sub,
        name: `${opts.nameLabel} ${POLE_LABEL[p]} ${c}-Curve ${a}A MCB`,
        sku,
        description: `${opts.nameLabel} ${POLE_LABEL[p]} ${a}A ${c}-curve MCB, ${opts.breakingCapacity} breaking capacity`,
        price,
        rated_voltage: mcbVoltage(opts.brandKey, p),
        rated_current: `${a}A`,
        breaking_capacity: opts.breakingCapacity,
        breaking_capacity_icu: opts.breakingIcu,
        tripping_characteristic: `Curve ${c}`,
        pole_count: p, number_of_poles: p,
        rated_insulation_voltage: "500V",
        width_per_pole: "17.5mm",
        mechanical_life_cycles: "20,000",
        electrical_life_cycles: "10,000",
        series_name: opts.seriesName,
        model_number: sku,
        iec_standards_compliance: opts.iec,
        ce_marked: opts.ce, rohs_compliant: true,
      };
      if (opts.impulse) prod.impulse_withstand_voltage = opts.impulse;
      products.push(prod);
    }
  };

  // Schneider iC60N (8 currents only per spec; spec says 6..63 with 50 included)
  addMcbSeries({
    brandKey: "schneider", skuPrefix: "SE-IC60N", seriesName: "Acti9 iC60N",
    nameLabel: "Schneider Acti9 iC60N", poles: [1,2,3,4],
    basePrice: { 1:160, 2:320, 3:580, 4:820 },
    breakingCapacity: "6kA", breakingIcu: "6kA at 415V AC",
    iec: ["IS/IEC 60898-1","IS/IEC 60947-2"], ce: true, impulse: "4kV",
  });

  // Schneider iC60H (poles 1,2,3 only)
  addMcbSeries({
    brandKey: "schneider", skuPrefix: "SE-IC60H", seriesName: "Acti9 iC60H",
    nameLabel: "Schneider Acti9 iC60H", poles: [1,2,3],
    basePrice: { 1:160, 2:320, 3:580, 4:820 }, priceMult: 1.3,
    breakingCapacity: "10kA", breakingIcu: "10kA at 415V AC",
    iec: ["IS/IEC 60898-1","IS/IEC 60947-2"], ce: true, impulse: "4kV",
  });

  // L&T Betagamma — currents per spec [6..63 without 50]
  {
    const basePrice: Record<number, number> = { 1:125, 2:260, 3:470, 4:720 };
    for (const p of [1,2,3,4]) for (const c of curves) for (const a of [6,10,16,20,25,32,40,63]) {
      const sub = subMap[MCB_SUBCAT_BY_POLE[p]];
      const sku = `LT-BG-${POLE_LABEL_HAV[p]}-${c}${a}`;
      products.push({
        ...COMMON, ...BRANDS.lt,
        subcategory_id: sub,
        name: `L&T Betagamma ${POLE_LABEL[p]} ${c}-Curve ${a}A MCB`,
        sku,
        description: `L&T Betagamma ${POLE_LABEL[p]} ${a}A ${c}-curve MCB, 10kA breaking capacity`,
        price: Math.round(basePrice[p] * (1 + a/200)),
        rated_voltage: mcbVoltage("lt", p),
        rated_current: `${a}A`,
        breaking_capacity: "10kA",
        breaking_capacity_icu: "10kA at 415V AC",
        tripping_characteristic: `Curve ${c}`,
        pole_count: p, number_of_poles: p,
        rated_insulation_voltage: "500V",
        width_per_pole: "17.5mm",
        mechanical_life_cycles: "20,000",
        electrical_life_cycles: "10,000",
        series_name: "Betagamma",
        model_number: sku,
        iec_standards_compliance: ["IS/IEC 60898-1"],
        ce_marked: false, rohs_compliant: true,
      });
    }
  }

  // Siemens 5SL — currents [6..63 without 50]
  {
    const basePrice: Record<number, number> = { 1:155, 2:310, 3:560, 4:800 };
    for (const p of [1,2,3,4]) for (const c of curves) for (const a of [6,10,16,20,25,32,40,63]) {
      const sub = subMap[MCB_SUBCAT_BY_POLE[p]];
      const sku = `SIE-5SL-${POLE_LABEL[p]}-${c}${a}`;
      products.push({
        ...COMMON, ...BRANDS.siemens,
        subcategory_id: sub,
        name: `Siemens 5SL ${POLE_LABEL[p]} ${c}-Curve ${a}A MCB`,
        sku,
        description: `Siemens 5SL ${POLE_LABEL[p]} ${a}A ${c}-curve MCB, 6kA breaking capacity`,
        price: Math.round(basePrice[p] * (1 + a/200)),
        rated_voltage: mcbVoltage("siemens", p),
        rated_current: `${a}A`,
        breaking_capacity: "6kA",
        breaking_capacity_icu: "6kA at 415V AC",
        tripping_characteristic: `Curve ${c}`,
        pole_count: p, number_of_poles: p,
        rated_insulation_voltage: "500V",
        impulse_withstand_voltage: "4kV",
        width_per_pole: "17.5mm",
        mechanical_life_cycles: "20,000",
        electrical_life_cycles: "10,000",
        series_name: "5SL",
        model_number: sku,
        iec_standards_compliance: ["IS/IEC 60898-1","IS/IEC 60947-2"],
        ce_marked: true, rohs_compliant: true,
      });
    }
  }

  // Legrand DX3
  {
    const basePrice: Record<number, number> = { 1:170, 2:340, 3:600, 4:840 };
    for (const p of [1,2,3,4]) for (const c of curves) for (const a of [6,10,16,20,25,32,40,63]) {
      const sub = subMap[MCB_SUBCAT_BY_POLE[p]];
      const sku = `LEG-DX3-${POLE_LABEL[p]}-${c}${a}`;
      products.push({
        ...COMMON, ...BRANDS.legrand,
        subcategory_id: sub,
        name: `Legrand DX3 ${POLE_LABEL[p]} ${c}-Curve ${a}A MCB`,
        sku,
        description: `Legrand DX3 ${POLE_LABEL[p]} ${a}A ${c}-curve MCB, 6kA breaking capacity`,
        price: Math.round(basePrice[p] * (1 + a/200)),
        rated_voltage: mcbVoltage("legrand", p),
        rated_current: `${a}A`,
        breaking_capacity: "6kA",
        breaking_capacity_icu: "6kA at 415V AC",
        tripping_characteristic: `Curve ${c}`,
        pole_count: p, number_of_poles: p,
        rated_insulation_voltage: "500V",
        impulse_withstand_voltage: "4kV",
        width_per_pole: "17.5mm",
        mechanical_life_cycles: "20,000",
        electrical_life_cycles: "10,000",
        series_name: "DX3",
        model_number: sku,
        iec_standards_compliance: ["IS/IEC 60898-1"],
        ce_marked: true, rohs_compliant: true,
      });
    }
  }

  // Hager MCN
  {
    const basePrice: Record<number, number> = { 1:165, 2:330, 3:590, 4:830 };
    for (const p of [1,2,3,4]) for (const c of curves) for (const a of [6,10,16,20,25,32,40,63]) {
      const sub = subMap[MCB_SUBCAT_BY_POLE[p]];
      const sku = `HAG-MCN-${POLE_LABEL[p]}-${c}${a}`;
      products.push({
        ...COMMON, ...BRANDS.hager,
        subcategory_id: sub,
        name: `Hager MCN ${POLE_LABEL[p]} ${c}-Curve ${a}A MCB`,
        sku,
        description: `Hager MCN ${POLE_LABEL[p]} ${a}A ${c}-curve MCB, 6kA breaking capacity`,
        price: Math.round(basePrice[p] * (1 + a/200)),
        rated_voltage: mcbVoltage("hager", p),
        rated_current: `${a}A`,
        breaking_capacity: "6kA",
        breaking_capacity_icu: "6kA at 415V AC",
        tripping_characteristic: `Curve ${c}`,
        pole_count: p, number_of_poles: p,
        rated_insulation_voltage: "500V",
        width_per_pole: "17.5mm",
        mechanical_life_cycles: "20,000",
        electrical_life_cycles: "10,000",
        series_name: "MCN",
        model_number: sku,
        iec_standards_compliance: ["IS/IEC 60898-1"],
        ce_marked: true, rohs_compliant: true,
      });
    }
  }

  return products;
}

const BRAND_NAME_BY_ID: Record<string, string> = {
  [BRANDS.havells.brand_id]: "Havells",
  [BRANDS.schneider.brand_id]: "Schneider",
  [BRANDS.lt.brand_id]: "L&T",
  [BRANDS.siemens.brand_id]: "Siemens",
  [BRANDS.legrand.brand_id]: "Legrand",
  [BRANDS.hager.brand_id]: "Hager",
};

export default function SeedCatalog2() {
  const [status, setStatus] = useState("Starting...");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [summary, setSummary] = useState<{ brand: string; category: string; count: number }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setStatus("Fetching subcategories...");
        const neededNames = [
          ...Object.values(MCB_SUBCAT_BY_POLE),
          ...Object.values(RCCB_SUBCAT_BY_POLE),
        ];
        const { data: subs, error: subErr } = await supabase
          .from("product_subcategories")
          .select("id, name")
          .in("name", neededNames);
        if (subErr) throw subErr;
        const subMap: Record<string, string> = {};
        (subs || []).forEach((s: any) => { subMap[s.name] = s.id; });

        const missing = neededNames.filter(n => !subMap[n]);
        if (missing.length) throw new Error(`Missing subcategories: ${missing.join(", ")}`);

        const products = buildProducts(subMap);
        const total = products.length;
        const batchSize = 50;
        let inserted = 0;

        for (let i = 0; i < products.length; i += batchSize) {
          const batch = products.slice(i, i + batchSize);
          const { error: upErr } = await supabase
            .from("products")
            .upsert(batch, { onConflict: "sku" });
          if (upErr) throw upErr;
          inserted += batch.length;
          setStatus(`Seeding products... ${inserted} / ${total}`);
        }

        // Summary
        const counts: Record<string, number> = {};
        for (const p of products) {
          const key = `${BRAND_NAME_BY_ID[p.brand_id]}||${p.category}`;
          counts[key] = (counts[key] || 0) + 1;
        }
        setSummary(
          Object.entries(counts).map(([k, count]) => {
            const [brand, category] = k.split("||");
            return { brand, category, count };
          })
        );
        setStatus(`Done! ${inserted} products inserted.`);
        setDone(true);
      } catch (e: any) {
        console.error(e);
        setError(e.message || String(e));
      }
    })();
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>Seed Catalog 2</h1>
      <p>{status}</p>
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {done && (
        <table border={1} cellPadding={8} style={{ marginTop: 16, borderCollapse: "collapse" }}>
          <thead><tr><th>Brand</th><th>Category</th><th>Count</th></tr></thead>
          <tbody>
            {summary.map((r, i) => (
              <tr key={i}><td>{r.brand}</td><td>{r.category}</td><td>{r.count}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
