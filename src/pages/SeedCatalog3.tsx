import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const BRANDS = {
  havells: { brand_id: "8f88abf7-db43-423d-92b3-ffdbdc1c3446", vendor_id: "9d6f0dcf-7b1e-4ea8-96d8-513506b8e418" },
  schneider: { brand_id: "633815cb-b043-42ac-bd72-b803c6bce1b6", vendor_id: "5f0d38d6-5590-47b1-9274-bcebbb061f79" },
  lt: { brand_id: "c6775030-5d53-4e57-9151-a5be09ed1294", vendor_id: "d0ecc503-2154-4bdc-9820-a474544c9c06" },
  gm: { brand_id: "158001ba-0bb8-493c-b85b-9592ebfa1670", vendor_id: "d52919d6-d8a0-464c-b541-26d25aa2f349" },
  mastech: { brand_id: "06f86bb3-cf76-4d84-b9bc-e2f072e49747", vendor_id: "45e632fb-b4ff-4718-92f5-b00e6094b829" },
  orbit: { brand_id: "4cd9ff74-e60e-444a-afc5-db700bbba4c2", vendor_id: "5967fd04-283e-4c79-91c4-ae3ffd30e5e7" },
  polycab: { brand_id: "261386b4-bb50-47e3-a3ab-8ec17819ee8c", vendor_id: "2e872110-e38f-42d3-b778-5e4478029683" },
};

const POLE_LABEL: Record<number, string> = { 1: "SP", 2: "DP", 3: "TP", 4: "4P" };
const POLE_TAG: Record<number, string> = { 1: "1P", 2: "2P", 3: "3P", 4: "4P" };

const SUBCAT_NAMES = [
  "MCB - Single Pole",
  "MCB - Double Pole",
  "MCB - Triple Pole",
  "MCB - 4 Pole",
  "RCCB - 2 Pole",
  "RCCB - 4 Pole",
  "MCCB",
];

const mcbSubcatFor = (poles: number) =>
  poles === 1 ? "MCB - Single Pole"
  : poles === 2 ? "MCB - Double Pole"
  : poles === 3 ? "MCB - Triple Pole"
  : "MCB - 4 Pole";

const rccbSubcatFor = (poles: number) => poles === 2 ? "RCCB - 2 Pole" : "RCCB - 4 Pole";

export default function SeedCatalog3() {
  const [status, setStatus] = useState("Initializing...");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setStatus("Fetching subcategories...");
        const { data: subs, error: subErr } = await supabase
          .from("product_subcategories")
          .select("id,name")
          .in("name", SUBCAT_NAMES);
        if (subErr) throw subErr;
        const subMap: Record<string, string> = {};
        (subs || []).forEach((s: any) => { subMap[s.name] = s.id; });

        const products: any[] = [];
        const tally: Record<string, number> = {};
        const bump = (k: string) => { tally[k] = (tally[k] || 0) + 1; };

        // HAVELLS MCCB
        {
          const currents = [16, 32, 63, 100, 125, 160, 200, 250, 400, 630];
          const poles = [3, 4];
          for (const p of poles) for (const c of currents) {
            const basePrice = p === 3 ? 2200 : 3100;
            const price = Math.round(basePrice * (1 + c / 400));
            const sku = `HAV-ISOBAR-${POLE_TAG[p]}-${c}A`;
            products.push({
              vendor_id: BRANDS.havells.vendor_id,
              brand_id: BRANDS.havells.brand_id,
              subcategory_id: subMap["MCCB"],
              category: "low_voltage_switchgear",
              name: `Havells Isobar MCCB ${POLE_TAG[p]} ${c}A 25kA`,
              sku,
              description: "Havells Isobar MCCB with thermal magnetic protection. IS/IEC 60947-2 compliant. BIS certified. Suitable for industrial power distribution and motor protection.",
              price,
              min_order_quantity: 1,
              stock_quantity: 0,
              status: "active",
              currency: "INR",
              Images: "[]",
              rated_voltage: "415V AC",
              rated_current: `${c}A`,
              rated_frequency: "50 Hz",
              breaking_capacity: "25kA",
              breaking_capacity_icu: "25kA at 415V AC",
              breaking_capacity_ics: "50% Icu",
              rated_insulation_voltage: "660V",
              tripping_characteristic: "Thermal Magnetic",
              pole_count: p,
              number_of_poles: p,
              mounting_type: "DIN Rail 35mm",
              series_name: "Isobar",
              model_number: sku,
              warranty_period: "12 months",
              iec_standards_compliance: ["IS/IEC 60947-2"],
              ce_marked: false,
              rohs_compliant: true,
              hsn_code: "85362090",
              tax_rate: 18.0,
            });
            bump("Havells MCCB");
          }
        }

        // HAVELLS RCCB
        {
          const poles = [2, 4];
          const currents = [25, 40, 63, 100];
          const sensitivities = ["30mA", "100mA", "300mA"];
          for (const p of poles) for (const c of currents) for (const s of sensitivities) {
            const basePrice = p === 2 ? 950 : 1900;
            let price = Math.round(basePrice * (c / 25));
            if (s === "30mA") price = Math.round(price * 1.2);
            const sku = `HAV-DHRB-${POLE_TAG[p]}-${c}A-${s}`;
            products.push({
              vendor_id: BRANDS.havells.vendor_id,
              brand_id: BRANDS.havells.brand_id,
              subcategory_id: subMap[rccbSubcatFor(p)],
              category: "low_voltage_switchgear",
              name: `Havells DHRB RCCB ${POLE_TAG[p]} ${c}A ${s}`,
              sku,
              description: "Havells DHRB series RCCB providing earth fault and shock protection. IS/IEC 61008-1 compliant. BIS certified.",
              price,
              min_order_quantity: 1,
              stock_quantity: 0,
              status: "active",
              currency: "INR",
              Images: "[]",
              rated_voltage: "415V AC",
              rated_current: `${c}A`,
              rated_frequency: "50 Hz",
              residual_current_rating: s,
              residual_current_type: "AC",
              pole_count: p,
              number_of_poles: p,
              mounting_type: "DIN Rail 35mm",
              series_name: "DHRB",
              model_number: sku,
              warranty_period: "12 months",
              iec_standards_compliance: ["IS/IEC 61008-1"],
              ce_marked: false,
              rohs_compliant: true,
              hsn_code: "85363010",
              tax_rate: 18.0,
            });
            bump("Havells RCCB");
          }
        }

        // SCHNEIDER RCCB
        {
          const poles = [2, 4];
          const currents = [25, 40, 63, 100];
          const sensitivities = ["30mA", "100mA", "300mA"];
          for (const p of poles) for (const c of currents) for (const s of sensitivities) {
            const basePrice = p === 2 ? 1100 : 2100;
            let price = Math.round(basePrice * (c / 25));
            if (s === "30mA") price = Math.round(price * 1.2);
            const sku = `SE-RCCB-IC60N-${POLE_TAG[p]}-${c}A-${s}`;
            products.push({
              vendor_id: BRANDS.schneider.vendor_id,
              brand_id: BRANDS.schneider.brand_id,
              subcategory_id: subMap[rccbSubcatFor(p)],
              category: "low_voltage_switchgear",
              name: `Schneider Acti9 iC60N RCCB ${POLE_TAG[p]} ${c}A ${s}`,
              sku,
              description: "Schneider Acti9 iC60N RCCB for earth fault protection. IS/IEC 61008-1 compliant. CE marked.",
              price,
              min_order_quantity: 1,
              stock_quantity: 0,
              status: "active",
              currency: "INR",
              Images: "[]",
              rated_voltage: "415V AC",
              rated_current: `${c}A`,
              rated_frequency: "50 Hz",
              residual_current_rating: s,
              residual_current_type: "AC",
              pole_count: p,
              number_of_poles: p,
              mounting_type: "DIN Rail 35mm",
              series_name: "Acti9 iC60N RCCB",
              model_number: sku,
              warranty_period: "12 months",
              iec_standards_compliance: ["IS/IEC 61008-1"],
              ce_marked: true,
              rohs_compliant: true,
              hsn_code: "85363010",
              tax_rate: 18.0,
            });
            bump("Schneider RCCB");
          }
        }

        // SCHNEIDER MCCB
        {
          const currents = [16, 32, 63, 100, 160, 250];
          const poles = [3, 4];
          for (const p of poles) for (const c of currents) {
            const basePrice = p === 3 ? 2800 : 3800;
            const price = Math.round(basePrice * (1 + c / 400));
            const sku = `SE-EZC-${POLE_TAG[p]}-${c}A`;
            products.push({
              vendor_id: BRANDS.schneider.vendor_id,
              brand_id: BRANDS.schneider.brand_id,
              subcategory_id: subMap["MCCB"],
              category: "low_voltage_switchgear",
              name: `Schneider EasyPact EZC MCCB ${POLE_TAG[p]} ${c}A 36kA`,
              sku,
              description: "Schneider EasyPact EZC MCCB with 36kA breaking capacity. IS/IEC 60947-2 compliant. CE marked. Suitable for industrial applications.",
              price,
              min_order_quantity: 1,
              stock_quantity: 0,
              status: "active",
              currency: "INR",
              Images: "[]",
              rated_voltage: "415V AC",
              rated_current: `${c}A`,
              rated_frequency: "50 Hz",
              breaking_capacity: "36kA",
              breaking_capacity_icu: "36kA at 415V AC",
              breaking_capacity_ics: "50% Icu",
              rated_insulation_voltage: "660V",
              tripping_characteristic: "Thermal Magnetic",
              pole_count: p,
              number_of_poles: p,
              mounting_type: "DIN Rail 35mm",
              series_name: "EasyPact EZC",
              model_number: sku,
              warranty_period: "12 months",
              iec_standards_compliance: ["IS/IEC 60947-2"],
              ce_marked: true,
              rohs_compliant: true,
              hsn_code: "85362090",
              tax_rate: 18.0,
            });
            bump("Schneider MCCB");
          }
        }

        // L&T MCCB
        {
          const currents = [16, 32, 63, 100, 125, 160, 200, 250];
          const poles = [3, 4];
          for (const p of poles) for (const c of currents) {
            const basePrice = p === 3 ? 2400 : 3300;
            const price = Math.round(basePrice * (1 + c / 400));
            const sku = `LT-MCCB-BG-${POLE_TAG[p]}-${c}A`;
            products.push({
              vendor_id: BRANDS.lt.vendor_id,
              brand_id: BRANDS.lt.brand_id,
              subcategory_id: subMap["MCCB"],
              category: "low_voltage_switchgear",
              name: `L&T Betagamma MCCB ${POLE_TAG[p]} ${c}A 25kA`,
              sku,
              description: "L&T Betagamma MCCB for industrial power distribution. IS/IEC 60947-2 compliant. BIS certified. Made in India.",
              price,
              min_order_quantity: 1,
              stock_quantity: 0,
              status: "active",
              currency: "INR",
              Images: "[]",
              rated_voltage: "415V AC",
              rated_current: `${c}A`,
              rated_frequency: "50 Hz",
              breaking_capacity: "25kA",
              breaking_capacity_icu: "25kA at 415V AC",
              breaking_capacity_ics: "50% Icu",
              rated_insulation_voltage: "660V",
              tripping_characteristic: "Thermal Magnetic",
              pole_count: p,
              number_of_poles: p,
              mounting_type: "DIN Rail 35mm",
              series_name: "Betagamma MCCB",
              model_number: sku,
              warranty_period: "12 months",
              iec_standards_compliance: ["IS/IEC 60947-2"],
              ce_marked: false,
              rohs_compliant: true,
              hsn_code: "85362090",
              tax_rate: 18.0,
            });
            bump("L&T MCCB");
          }
        }

        // GM MODULAR MCB
        {
          const poles = [1, 2, 3, 4];
          const curves = ["B", "C"];
          const currents = [6, 10, 16, 20, 25, 32, 40, 63];
          const baseByPole: Record<number, number> = { 1: 120, 2: 250, 3: 460, 4: 700 };
          for (const p of poles) for (const cv of curves) for (const a of currents) {
            const price = Math.round(baseByPole[p] * (1 + a / 300));
            const sku = `GM-MCB-${POLE_LABEL[p]}-${cv}${a}`;
            products.push({
              vendor_id: BRANDS.gm.vendor_id,
              brand_id: BRANDS.gm.brand_id,
              subcategory_id: subMap[mcbSubcatFor(p)],
              category: "low_voltage_switchgear",
              name: `GM Modular MCB ${POLE_LABEL[p]} ${cv}${a}A 10kA`,
              sku,
              description: "GM Modular Miniature Circuit Breaker. IS/IEC 60898-1 compliant. BIS certified. Made in India.",
              price,
              min_order_quantity: 1,
              stock_quantity: 0,
              status: "active",
              currency: "INR",
              Images: "[]",
              rated_voltage: p === 1 ? "240V AC" : "415V AC",
              rated_current: `${a}A`,
              rated_frequency: "50 Hz",
              breaking_capacity: "10kA",
              breaking_capacity_icu: "10kA",
              rated_insulation_voltage: "500V",
              tripping_characteristic: `Curve ${cv}`,
              pole_count: p,
              number_of_poles: p,
              width_per_pole: "17.5mm",
              mounting_type: "DIN Rail 35mm",
              series_name: "GM MCB",
              model_number: sku,
              warranty_period: "12 months",
              iec_standards_compliance: ["IS/IEC 60898-1"],
              ce_marked: false,
              rohs_compliant: true,
              hsn_code: "85362010",
              tax_rate: 18.0,
            });
            bump("GM Modular MCB");
          }
        }

        // POLYCAB MCB
        {
          const poles = [1, 2, 3, 4];
          const curves = ["B", "C"];
          const currents = [6, 10, 16, 20, 25, 32, 40, 63];
          const baseByPole: Record<number, number> = { 1: 115, 2: 240, 3: 450, 4: 680 };
          for (const p of poles) for (const cv of curves) for (const a of currents) {
            const price = Math.round(baseByPole[p] * (1 + a / 300));
            const sku = `POL-MCB-${POLE_LABEL[p]}-${cv}${a}`;
            products.push({
              vendor_id: BRANDS.polycab.vendor_id,
              brand_id: BRANDS.polycab.brand_id,
              subcategory_id: subMap[mcbSubcatFor(p)],
              category: "low_voltage_switchgear",
              name: `Polycab MCB ${POLE_LABEL[p]} ${cv}${a}A 10kA`,
              sku,
              description: "Polycab Miniature Circuit Breaker. IS/IEC 60898-1 compliant. BIS certified. Made in India.",
              price,
              min_order_quantity: 1,
              stock_quantity: 0,
              status: "active",
              currency: "INR",
              Images: "[]",
              rated_voltage: p === 1 ? "240V AC" : "415V AC",
              rated_current: `${a}A`,
              rated_frequency: "50 Hz",
              breaking_capacity: "10kA",
              breaking_capacity_icu: "10kA",
              rated_insulation_voltage: "500V",
              tripping_characteristic: `Curve ${cv}`,
              pole_count: p,
              number_of_poles: p,
              width_per_pole: "17.5mm",
              mounting_type: "DIN Rail 35mm",
              series_name: "Polycab MCB",
              model_number: sku,
              warranty_period: "12 months",
              iec_standards_compliance: ["IS/IEC 60898-1"],
              ce_marked: false,
              rohs_compliant: true,
              hsn_code: "85362010",
              tax_rate: 18.0,
            });
            bump("Polycab MCB");
          }
        }

        // ORBIT MCB
        {
          const poles = [1, 2, 3];
          const curves = ["B", "C"];
          const currents = [6, 10, 16, 20, 25, 32, 40, 63];
          const baseByPole: Record<number, number> = { 1: 100, 2: 210, 3: 400 };
          for (const p of poles) for (const cv of curves) for (const a of currents) {
            const price = Math.round(baseByPole[p] * (1 + a / 300));
            const sku = `ORB-MCB-${POLE_LABEL[p]}-${cv}${a}`;
            products.push({
              vendor_id: BRANDS.orbit.vendor_id,
              brand_id: BRANDS.orbit.brand_id,
              subcategory_id: subMap[mcbSubcatFor(p)],
              category: "low_voltage_switchgear",
              name: `Orbit MCB ${POLE_LABEL[p]} ${cv}${a}A 6kA`,
              sku,
              description: "Orbit Miniature Circuit Breaker. IS/IEC 60898-1 compliant. BIS certified.",
              price,
              min_order_quantity: 1,
              stock_quantity: 0,
              status: "active",
              currency: "INR",
              Images: "[]",
              rated_voltage: p === 1 ? "240V AC" : "415V AC",
              rated_current: `${a}A`,
              rated_frequency: "50 Hz",
              breaking_capacity: "6kA",
              breaking_capacity_icu: "6kA",
              rated_insulation_voltage: "500V",
              tripping_characteristic: `Curve ${cv}`,
              pole_count: p,
              number_of_poles: p,
              width_per_pole: "17.5mm",
              mounting_type: "DIN Rail 35mm",
              series_name: "Orbit MCB",
              model_number: sku,
              warranty_period: "12 months",
              iec_standards_compliance: ["IS/IEC 60898-1"],
              ce_marked: false,
              rohs_compliant: true,
              hsn_code: "85362010",
              tax_rate: 18.0,
            });
            bump("Orbit MCB");
          }
        }

        // MASTECH multimeters
        {
          const models = [
            { name: "MS8268", price: 1850, description: "Auto-ranging digital multimeter, AC/DC voltage, current, resistance, capacitance, frequency" },
            { name: "MS8229", price: 2200, description: "5-in-1 multimeter with temperature, humidity, lux and sound level measurement" },
            { name: "MS2108A", price: 3200, description: "AC/DC clamp meter 1000A with True RMS measurement" },
            { name: "MS2115B", price: 4500, description: "True RMS digital clamp meter 1000A AC/DC with Inrush current" },
            { name: "MS6818", price: 5800, description: "Wire tracker and cable finder, detects buried cables up to 1m depth" },
            { name: "MS5910", price: 3800, description: "RCD/GFCI circuit breaker tester for testing residual current devices" },
          ];
          for (const m of models) {
            const sku = `MASTECH-${m.name}`;
            products.push({
              vendor_id: BRANDS.mastech.vendor_id,
              brand_id: BRANDS.mastech.brand_id,
              subcategory_id: null,
              category: "testing_and_measuring_instruments",
              name: `Mastech ${m.name}`,
              sku,
              description: m.description,
              price: m.price,
              min_order_quantity: 1,
              stock_quantity: 0,
              status: "active",
              currency: "INR",
              Images: "[]",
              rated_frequency: "50 Hz",
              mounting_type: "Handheld",
              series_name: "Mastech",
              model_number: m.name,
              warranty_period: "12 months",
              iec_standards_compliance: ["IEC 61010-1"],
              ce_marked: true,
              rohs_compliant: true,
              hsn_code: "90303300",
              tax_rate: 18.0,
            });
            bump("Mastech Instruments");
          }
        }

        setProgress({ done: 0, total: products.length });
        setStatus(`Upserting ${products.length} products...`);

        const BATCH = 50;
        for (let i = 0; i < products.length; i += BATCH) {
          const batch = products.slice(i, i + BATCH);
          const { error: upErr } = await supabase
            .from("products")
            .upsert(batch as any, { onConflict: "sku" });
          if (upErr) throw upErr;
          setProgress({ done: Math.min(i + BATCH, products.length), total: products.length });
        }

        setSummary(tally);
        setStatus("Done!");
        setFinished(true);
      } catch (e: any) {
        console.error(e);
        setError(e.message || String(e));
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-2">Seed Catalog 3</h1>
        <p className="text-sm text-gray-500 mb-4">
          Reminder: disable RLS on the <code>products</code> table before running, or run as a super admin.
        </p>
        <div className="mb-4">
          <div className="font-medium">{status}</div>
          {progress.total > 0 && (
            <>
              <div className="text-sm text-gray-600">
                {progress.done} / {progress.total}
              </div>
              <div className="w-full bg-gray-200 rounded h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded"
                  style={{ width: `${(progress.done / progress.total) * 100}%` }}
                />
              </div>
            </>
          )}
        </div>
        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 p-3 rounded mb-4">
            Error: {error}
          </div>
        )}
        {finished && (
          <table className="w-full text-sm border-t">
            <thead>
              <tr className="text-left">
                <th className="py-2">Brand / Category</th>
                <th className="py-2 text-right">Count</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(summary).map(([k, v]) => (
                <tr key={k} className="border-t">
                  <td className="py-2">{k}</td>
                  <td className="py-2 text-right">{v}</td>
                </tr>
              ))}
              <tr className="border-t font-bold">
                <td className="py-2">Total</td>
                <td className="py-2 text-right">
                  {Object.values(summary).reduce((a, b) => a + b, 0)}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
