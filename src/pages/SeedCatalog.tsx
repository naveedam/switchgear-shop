import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const VENDOR_ID = "14c1b96b-52e0-4d74-ae89-4e87e3cdeceb";
const BRANDS = {
  ABB: "4b442eb3-87ca-4e3f-bb4b-99550c0775cb",
  IndoAsian: "4a63e203-8a13-4bc7-bbde-71cb95786b60",
  HPL: "4d33392e-b8fa-4969-adc2-74a29d69abca",
  Wipro: "49c95a1d-4229-471d-afc8-1cdb44a8d36b",
};

const SUBCATEGORIES = [
  { name: "MCB - Single Pole", category: "low_voltage_switchgear", sort_order: 1 },
  { name: "MCB - Double Pole", category: "low_voltage_switchgear", sort_order: 2 },
  { name: "MCB - Triple Pole", category: "low_voltage_switchgear", sort_order: 3 },
  { name: "MCB - 4 Pole", category: "low_voltage_switchgear", sort_order: 4 },
  { name: "RCCB - 2 Pole", category: "low_voltage_switchgear", sort_order: 5 },
  { name: "RCCB - 4 Pole", category: "low_voltage_switchgear", sort_order: 6 },
  { name: "Contactor", category: "starters_and_switches", sort_order: 7 },
  { name: "MCCB", category: "low_voltage_switchgear", sort_order: 8 },
];

const poleSubName = (p: number) =>
  ({ 1: "MCB - Single Pole", 2: "MCB - Double Pole", 3: "MCB - Triple Pole", 4: "MCB - 4 Pole" } as Record<number, string>)[p];
const poleAbbr = (p: number) => ({ 1: "SP", 2: "DP", 3: "TP", 4: "4P" } as Record<number, string>)[p];
const voltageFor = (p: number, indo = false) =>
  indo ? (p === 1 ? "240V AC" : "415V AC") : p === 1 ? "230V AC" : p === 2 ? "400V AC" : "415V AC";

const DEFAULTS = {
  vendor_id: VENDOR_ID,
  status: "active",
  currency: "INR",
  tax_rate: 18.0,
  min_order_quantity: 1,
  stock_quantity: 0,
  warranty_period: "12 months",
  mounting_type: "DIN Rail 35mm",
  rated_frequency: "50 Hz",
  hsn_code: "85362010",
};

function buildProducts(subMap: Record<string, string>) {
  const products: any[] = [];

  // ABB S200
  for (const poles of [1, 2, 3, 4]) {
    const basePrice = { 1: 180, 2: 350, 3: 620, 4: 850 }[poles]!;
    for (const curve of ["B", "C"]) {
      for (const amps of [6, 10, 16, 20, 25, 32, 40, 50, 63]) {
        const price = Math.round(basePrice * (1 + amps / 200));
        products.push({
          ...DEFAULTS,
          sku: `ABB-S200-${poles}P-${curve}${amps}`,
          name: `ABB S200 MCB ${poles}P ${curve}${amps}A`,
          brand_id: BRANDS.ABB,
          subcategory_id: subMap[poleSubName(poles)],
          category: "low_voltage_switchgear",
          price,
          series_name: "S200",
          rated_frequency: "50/60 Hz",
          pole_count: poles,
          rated_current: amps,
          rated_voltage: voltageFor(poles),
          tripping_characteristic: `Curve ${curve}`,
          breaking_capacity: "6kA",
          breaking_capacity_icu: "6kA at 415V AC",
          rated_insulation_voltage: "500V",
          impulse_withstand_voltage: "4kV",
          width_per_pole: "17.5mm",
          mechanical_life_cycles: "20,000",
          electrical_life_cycles: "10,000",
          iec_standards_compliance: ["IS/IEC 60898-1", "IS/IEC 60947-2"],
          ce_marked: true,
          rohs_compliant: true,
        });
      }
    }
  }

  // ABB S200M
  for (const poles of [1, 2, 3]) {
    const basePrice = { 1: 180, 2: 350, 3: 620 }[poles]!;
    for (const curve of ["B", "C"]) {
      for (const amps of [6, 10, 16, 20, 25, 32, 40, 63]) {
        const price = Math.round(basePrice * (1 + amps / 200) * 1.35);
        products.push({
          ...DEFAULTS,
          sku: `ABB-S200M-${poles}P-${curve}${amps}`,
          name: `ABB S200M MCB ${poles}P ${curve}${amps}A`,
          brand_id: BRANDS.ABB,
          subcategory_id: subMap[poleSubName(poles)],
          category: "low_voltage_switchgear",
          price,
          series_name: "S200M",
          rated_frequency: "50/60 Hz",
          pole_count: poles,
          rated_current: amps,
          rated_voltage: voltageFor(poles),
          tripping_characteristic: `Curve ${curve}`,
          breaking_capacity: "10kA",
          breaking_capacity_icu: "10kA at 415V AC",
          rated_insulation_voltage: "500V",
          impulse_withstand_voltage: "4kV",
          width_per_pole: "17.5mm",
          mechanical_life_cycles: "20,000",
          electrical_life_cycles: "10,000",
          iec_standards_compliance: ["IS/IEC 60898-1", "IS/IEC 60947-2"],
          ce_marked: true,
          rohs_compliant: true,
        });
      }
    }
  }

  // ABB F200 RCCB
  for (const poles of [2, 4]) {
    const basePrice = poles === 2 ? 900 : 1800;
    const subName = poles === 2 ? "RCCB - 2 Pole" : "RCCB - 4 Pole";
    for (const amps of [25, 40, 63, 100]) {
      for (const sens of ["30mA", "100mA", "300mA"]) {
        let price = basePrice * (amps / 25);
        if (sens === "30mA") price *= 1.2;
        products.push({
          ...DEFAULTS,
          sku: `ABB-F200-${poles}P-${amps}A-${sens}`,
          name: `ABB F200 RCCB ${poles}P ${amps}A ${sens}`,
          brand_id: BRANDS.ABB,
          subcategory_id: subMap[subName],
          category: "low_voltage_switchgear",
          price: Math.round(price),
          series_name: "F200",
          pole_count: poles,
          rated_current: amps,
          rated_voltage: "415V AC",
          residual_current_type: "AC",
          rated_residual_current: sens,
          iec_standards_compliance: ["IS/IEC 61008-1"],
          hsn_code: "85363010",
          ce_marked: true,
          rohs_compliant: true,
        });
      }
    }
  }

  // ABB A-line Contactors
  const frames: [string, number, number, number][] = [
    ["A9", 9, 4, 950], ["A12", 12, 5.5, 1050], ["A16", 16, 7.5, 1150],
    ["A26", 26, 11, 1400], ["A30", 30, 15, 1650], ["A40", 40, 18.5, 1950],
    ["A50", 50, 22, 2350], ["A63", 63, 30, 2800], ["A75", 75, 37, 3300],
    ["A95", 95, 45, 4000],
  ];
  for (const [frame, amps, kw, price] of frames) {
    products.push({
      ...DEFAULTS,
      sku: `ABB-${frame}-30-10`,
      name: `ABB ${frame} Contactor ${amps}A ${kw}kW`,
      brand_id: BRANDS.ABB,
      subcategory_id: subMap["Contactor"],
      category: "starters_and_switches",
      price,
      pole_count: 3,
      rated_current: amps,
      rated_voltage: "415V AC",
      utilization_category: "AC-3",
      frame_size: frame,
      power_rating_kw: kw,
      hsn_code: "85364900",
      iec_standards_compliance: ["IS/IEC 60947-4-1", "IS/IEC 60947-1"],
      ce_marked: true,
      rohs_compliant: true,
    });
  }

  // Indo Asian MCB
  for (const poles of [1, 2, 3, 4]) {
    const basePrice = { 1: 115, 2: 240, 3: 440, 4: 670 }[poles]!;
    for (const curve of ["B", "C"]) {
      for (const amps of [6, 10, 16, 20, 25, 32, 40, 63]) {
        const price = Math.round(basePrice * (1 + amps / 300));
        products.push({
          ...DEFAULTS,
          sku: `IA-FG-${poleAbbr(poles)}-${curve}${amps}`,
          name: `Indo Asian Fuse Guard MCB ${poles}P ${curve}${amps}A`,
          brand_id: BRANDS.IndoAsian,
          subcategory_id: subMap[poleSubName(poles)],
          category: "low_voltage_switchgear",
          price,
          series_name: "Fuse Guard",
          pole_count: poles,
          rated_current: amps,
          rated_voltage: voltageFor(poles, true),
          tripping_characteristic: `Curve ${curve}`,
          breaking_capacity: "10kA",
          iec_standards_compliance: ["IS/IEC 60898-1"],
          ce_marked: false,
          rohs_compliant: true,
        });
      }
    }
  }

  // HPL MCB
  for (const poles of [1, 2, 3, 4]) {
    const basePrice = { 1: 105, 2: 220, 3: 410, 4: 630 }[poles]!;
    for (const curve of ["B", "C"]) {
      for (const amps of [6, 10, 16, 20, 25, 32, 40, 63]) {
        const price = Math.round(basePrice * (1 + amps / 300));
        products.push({
          ...DEFAULTS,
          sku: `HPL-MCB-${poleAbbr(poles)}-${curve}${amps}`,
          name: `HPL MCB ${poles}P ${curve}${amps}A`,
          brand_id: BRANDS.HPL,
          subcategory_id: subMap[poleSubName(poles)],
          category: "low_voltage_switchgear",
          price,
          pole_count: poles,
          rated_current: amps,
          rated_voltage: voltageFor(poles, true),
          tripping_characteristic: `Curve ${curve}`,
          breaking_capacity: "10kA",
          iec_standards_compliance: ["IS/IEC 60898-1"],
          rohs_compliant: true,
        });
      }
    }
  }

  // Wipro MCB (1, 2, 4)
  for (const poles of [1, 2, 4]) {
    const basePrice = { 1: 110, 2: 230, 4: 650 }[poles]!;
    for (const curve of ["B", "C"]) {
      for (const amps of [6, 10, 16, 20, 25, 32, 40, 63]) {
        const price = Math.round(basePrice * (1 + amps / 300));
        products.push({
          ...DEFAULTS,
          sku: `WIPRO-MCB-${poleAbbr(poles)}-${curve}${amps}`,
          name: `Wipro MCB ${poles}P ${curve}${amps}A`,
          brand_id: BRANDS.Wipro,
          subcategory_id: subMap[poleSubName(poles)],
          category: "low_voltage_switchgear",
          price,
          pole_count: poles,
          rated_current: amps,
          rated_voltage: voltageFor(poles, true),
          tripping_characteristic: `Curve ${curve}`,
          breaking_capacity: "6kA",
          iec_standards_compliance: ["IS/IEC 60898-1"],
          rohs_compliant: true,
        });
      }
    }
  }

  return products;
}

export default function SeedCatalog() {
  const [status, setStatus] = useState("Initializing...");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ brand: string; category: string; count: number }[]>([]);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      try {
        // Step 1: subcategories
        setStatus("Seeding subcategories...");
        const { data: existing } = await supabase
          .from("product_subcategories")
          .select("id, name");
        const existingNames = new Set((existing ?? []).map((s: any) => s.name));
        const toInsert = SUBCATEGORIES.filter((s) => !existingNames.has(s.name)).map((s) => ({
          ...s,
          status: "active",
        }));
        if (toInsert.length > 0) {
          const { error: subErr } = await supabase
            .from("product_subcategories")
            .insert(toInsert as any);
          if (subErr) throw subErr;
        }

        // Step 2: fetch all subcategory ids by name
        const { data: allSubs, error: fetchErr } = await supabase
          .from("product_subcategories")
          .select("id, name");
        if (fetchErr) throw fetchErr;
        const subMap: Record<string, string> = {};
        (allSubs ?? []).forEach((s: any) => (subMap[s.name] = s.id));

        // Step 3: build & upsert products
        const products = buildProducts(subMap);
        setProgress({ done: 0, total: products.length });
        setStatus(`Seeding products... 0 / ${products.length}`);

        const chunkSize = 50;
        let done = 0;
        const counts: Record<string, number> = {};
        const brandNameById: Record<string, string> = {
          [BRANDS.ABB]: "ABB",
          [BRANDS.IndoAsian]: "Indo Asian",
          [BRANDS.HPL]: "HPL",
          [BRANDS.Wipro]: "Wipro",
        };

        for (let i = 0; i < products.length; i += chunkSize) {
          const chunk = products.slice(i, i + chunkSize);
          const { error: upErr } = await supabase
            .from("products")
            .upsert(chunk as any, { onConflict: "sku" });
          if (upErr) throw upErr;
          for (const p of chunk) {
            const key = `${brandNameById[p.brand_id]}|${p.category}`;
            counts[key] = (counts[key] ?? 0) + 1;
          }
          done += chunk.length;
          setProgress({ done, total: products.length });
          setStatus(`Seeding products... ${done} / ${products.length}`);
        }

        setSummary(
          Object.entries(counts)
            .map(([k, count]) => {
              const [brand, category] = k.split("|");
              return { brand, category, count };
            })
            .sort((a, b) => a.brand.localeCompare(b.brand))
        );
        setStatus(`Done! ${done} products inserted.`);
      } catch (e: any) {
        console.error("Seeding error:", e);
        setError(e?.message ?? String(e));
      }
    })();
  }, []);

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Catalog Seeder</h1>
      <p className="mb-2">{status}</p>
      {progress.total > 0 && (
        <div className="w-full bg-muted h-2 rounded mb-4">
          <div
            className="bg-primary h-2 rounded transition-all"
            style={{ width: `${(progress.done / progress.total) * 100}%` }}
          />
        </div>
      )}
      {error && (
        <p className="text-destructive font-medium mt-4">Error: {error}</p>
      )}
      {summary.length > 0 && (
        <table className="mt-6 w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Brand</th>
              <th className="text-left p-2">Category</th>
              <th className="text-right p-2">Count</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((row, i) => (
              <tr key={i} className="border-b">
                <td className="p-2">{row.brand}</td>
                <td className="p-2">{row.category}</td>
                <td className="p-2 text-right">{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
