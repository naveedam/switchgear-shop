import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const VENDOR_ID = '458d0e72-c507-4682-9b92-210f9c13dbd2';

const BRANDS = {
  polycab: '261386b4-bb50-47e3-a3ab-8ec17819ee8c',
  havells: '8f88abf7-db43-423d-92b3-ffdbdc1c3446',
  finolex: '64003e09-36c4-493f-ad73-c224204a9fb9',
  legrand: 'd4e1bb5c-d795-4c59-ad4e-677dffbb6a20',
  gm: '158001ba-0bb8-493c-b85b-9592ebfa1670',
  anchor: '835593eb-fd11-4d9a-8383-ad7b7f42d754',
  omron: '264475fb-db91-4e99-a4cf-a2db6d2c910d',
  schneider: '633815cb-b043-42ac-bd72-b803c6bce1b6',
};

const sizeToken = (s: number) => {
  if (Number.isInteger(s)) return `${s}SQ`;
  return `${String(s).replace('.', 'P')}SQ`;
};

const baseProduct = (overrides: any) => ({
  vendor_id: VENDOR_ID,
  status: 'active',
  currency: 'INR',
  tax_rate: 18.0,
  min_order_quantity: 1,
  stock_quantity: 0,
  warranty_period: '12 months',
  Images: '[]',
  subcategory_id: null,
  ...overrides,
});

function buildWires() {
  const products: any[] = [];

  // Polycab FR House Wire
  const polycabFRPrice: Record<string, number> = {
    '1': 680, '1.5': 980, '2.5': 1550, '4': 2400, '6': 3500, '10': 5800,
  };
  const polycabSizes = [1.0, 1.5, 2.5, 4.0, 6.0, 10.0];
  const colors = ['Red', 'Blue', 'Yellow', 'Green', 'Black'];
  for (const size of polycabSizes) {
    for (const color of colors) {
      products.push(baseProduct({
        sku: `POL-FR-${sizeToken(size)}-${color}`,
        name: `Polycab FR House Wire ${size} sqmm ${color}`,
        brand_id: BRANDS.polycab,
        category: 'wires_and_cables',
        hsn_code: '85444999',
        price: polycabFRPrice[String(size)],
        rated_voltage: '1100V',
        series_name: 'FR',
        model_number: `FR-${size}-${color}`,
        description: `Polycab FR (Flame Retardant) house wire, IS 694 compliant. Electrolytic grade copper conductor, PVC insulation. Suitable for internal house wiring. 90m coil.`,
        iec_standards_compliance: ['IS 694'],
        ce_marked: false,
        rohs_compliant: true,
        mounting_type: null,
        sort_order: Math.round(size * 100),
      }));
    }
  }

  // Polycab FRLS Cable
  const frlsPrice: Record<string, number> = {
    '2-1.5': 45, '2-2.5': 68,
    '3-1.5': 62, '3-2.5': 95, '3-4': 148, '3-6': 215, '3-10': 348, '3-16': 540, '3-25': 820,
    '4-2.5': 118, '4-4': 182, '4-6': 268, '4-10': 425, '4-16': 660,
  };
  for (const key of Object.keys(frlsPrice)) {
    const [cores, sizeStr] = key.split('-');
    const size = parseFloat(sizeStr);
    products.push(baseProduct({
      sku: `POL-FRLS-${cores}C-${sizeToken(size)}`,
      name: `Polycab FRLS Cable ${cores} Core ${size} sqmm`,
      brand_id: BRANDS.polycab,
      category: 'wires_and_cables',
      hsn_code: '85444999',
      price: frlsPrice[key],
      rated_voltage: '1100V',
      series_name: 'FRLS',
      model_number: `FRLS-${cores}C-${size}`,
      description: 'Polycab FRLS (Flame Retardant Low Smoke) armoured cable. IS 1554 compliant. Suitable for industrial and commercial installations. Price per meter.',
      iec_standards_compliance: ['IS 1554'],
      min_order_quantity: 10,
      ce_marked: false,
      rohs_compliant: true,
      mounting_type: null,
      sort_order: Math.round(size * 100) + parseInt(cores) * 10,
    }));
  }

  // Havells HRFR Wire
  const havellsPrice: Record<string, number> = {
    '1': 720, '1.5': 1050, '2.5': 1650, '4': 2600, '6': 3800,
  };
  for (const size of [1.0, 1.5, 2.5, 4.0, 6.0]) {
    for (const color of colors) {
      products.push(baseProduct({
        sku: `HAV-HRFR-${sizeToken(size)}-${color}`,
        name: `Havells HRFR Wire ${size} sqmm ${color}`,
        brand_id: BRANDS.havells,
        category: 'wires_and_cables',
        hsn_code: '85444999',
        price: havellsPrice[String(size)],
        rated_voltage: '1100V',
        series_name: 'HRFR',
        model_number: `HRFR-${size}-${color}`,
        description: 'Havells HRFR (Heat Resistant Flame Retardant) house wire. IS 694 compliant. BIS certified. 90m coil.',
        iec_standards_compliance: ['IS 694'],
        ce_marked: false,
        rohs_compliant: true,
        mounting_type: null,
        sort_order: Math.round(size * 100),
      }));
    }
  }

  // Finolex FR Wire
  const finolexPrice: Record<string, number> = {
    '1': 660, '1.5': 950, '2.5': 1500, '4': 2350, '6': 3400,
  };
  for (const size of [1.0, 1.5, 2.5, 4.0, 6.0]) {
    for (const color of colors) {
      products.push(baseProduct({
        sku: `FIN-FR-${sizeToken(size)}-${color}`,
        name: `Finolex FR Wire ${size} sqmm ${color}`,
        brand_id: BRANDS.finolex,
        category: 'wires_and_cables',
        hsn_code: '85444999',
        price: finolexPrice[String(size)],
        rated_voltage: '1100V',
        series_name: 'FR',
        model_number: `FR-${size}-${color}`,
        description: 'Finolex FR (Flame Retardant) house wire. IS 694 compliant. BIS certified. Electrolytic grade copper. 90m coil.',
        iec_standards_compliance: ['IS 694'],
        ce_marked: false,
        rohs_compliant: true,
        mounting_type: null,
        sort_order: Math.round(size * 100),
      }));
    }
  }

  return products;
}

function buildRelays() {
  const omronModels = [
    { sku: 'OMR-H3CR-A8', name: 'Omron H3CR-A8 Multi-function Timer Relay', price: 2850, description: 'Omron H3CR-A8 multi-function timer relay, 100-240V AC/DC. 8 operating modes. DIN rail or surface mount. Output: 1 SPDT relay.', series: 'H3CR', model: 'H3CR-A8', rated_voltage: '100-240V AC/DC' },
    { sku: 'OMR-H3CR-F8', name: 'Omron H3CR-F8 Floatless Level Switch', price: 3200, description: 'Omron H3CR-F8 floatless level controller relay. 100-240V AC. For water level control in tanks and sumps.', series: 'H3CR', model: 'H3CR-F8', rated_voltage: '100-240V AC' },
    { sku: 'OMR-MY2N-24DC', name: 'Omron MY2N General Purpose Relay 24V DC', price: 385, description: 'Omron MY2N 2-pole general purpose relay. 24V DC coil. 5A contact rating. Octal socket mount.', series: 'MY2N', model: 'MY2N-24DC', rated_voltage: '24V DC' },
    { sku: 'OMR-MY2N-230AC', name: 'Omron MY2N General Purpose Relay 230V AC', price: 420, description: 'Omron MY2N 2-pole general purpose relay. 230V AC coil. 5A contact rating. Octal socket mount.', series: 'MY2N', model: 'MY2N-230AC', rated_voltage: '230V AC' },
    { sku: 'OMR-MY4N-24DC', name: 'Omron MY4N 4-pole Relay 24V DC', price: 485, description: 'Omron MY4N 4-pole general purpose relay. 24V DC coil. 3A contact rating. Octal socket mount.', series: 'MY4N', model: 'MY4N-24DC', rated_voltage: '24V DC' },
    { sku: 'OMR-MY4N-230AC', name: 'Omron MY4N 4-pole Relay 230V AC', price: 520, description: 'Omron MY4N 4-pole general purpose relay. 230V AC coil. 3A contact rating. Octal socket mount.', series: 'MY4N', model: 'MY4N-230AC', rated_voltage: '230V AC' },
    { sku: 'OMR-G2R-1-24DC', name: 'Omron G2R-1 PCB Relay 24V DC', price: 185, description: 'Omron G2R-1 single pole PCB relay. 24V DC coil. 10A contact. Slim profile for PCB mounting.', series: 'G2R', model: 'G2R-1-24DC', rated_voltage: '24V DC' },
    { sku: 'OMR-G2R-2-24DC', name: 'Omron G2R-2 PCB Relay 24V DC', price: 210, description: 'Omron G2R-2 double pole PCB relay. 24V DC coil. 5A contact. Slim profile for PCB mounting.', series: 'G2R', model: 'G2R-2-24DC', rated_voltage: '24V DC' },
    { sku: 'OMR-LY2-24DC', name: 'Omron LY2 Power Relay 24V DC', price: 650, description: 'Omron LY2 2-pole power relay. 24V DC coil. 10A contact rating. For power switching applications.', series: 'LY2', model: 'LY2-24DC', rated_voltage: '24V DC' },
    { sku: 'OMR-LY4-24DC', name: 'Omron LY4 4-pole Power Relay 24V DC', price: 720, description: 'Omron LY4 4-pole power relay. 24V DC coil. 5A contact rating. Suitable for control panels.', series: 'LY4', model: 'LY4-24DC', rated_voltage: '24V DC' },
  ];

  const schneiderModels = [
    { sku: 'SE-RXM2LB2BD', name: 'Schneider RXM2LB2BD Miniature Relay 24V DC', price: 485, description: 'Schneider Electric RXM2 series 2-pole miniature relay. 24V DC coil. 8A contact. For control panel applications.', series: 'RXM2', model: 'RXM2LB2BD', rated_voltage: '24V DC' },
    { sku: 'SE-RXM2LB2P7', name: 'Schneider RXM2LB2P7 Miniature Relay 230V AC', price: 520, description: 'Schneider Electric RXM2 series 2-pole miniature relay. 230V AC coil. 8A contact. For control panel applications.', series: 'RXM2', model: 'RXM2LB2P7', rated_voltage: '230V AC' },
    { sku: 'SE-RXM4LB2BD', name: 'Schneider RXM4LB2BD 4-pole Relay 24V DC', price: 580, description: 'Schneider Electric RXM4 series 4-pole miniature relay. 24V DC coil. 6A contact. For control panel applications.', series: 'RXM4', model: 'RXM4LB2BD', rated_voltage: '24V DC' },
    { sku: 'SE-RE17RAMU', name: 'Schneider RE17RAMU Timer Relay', price: 3200, description: 'Schneider Electric RE17 multi-function timing relay. 24-240V AC/DC. 10 timing functions. 2 SPDT outputs.', series: 'RE17', model: 'RE17RAMU', rated_voltage: '24-240V AC/DC' },
  ];

  const products: any[] = [];
  for (const m of omronModels) {
    products.push(baseProduct({
      sku: m.sku, name: m.name, brand_id: BRANDS.omron,
      category: 'relays', hsn_code: '85364900', price: m.price,
      description: m.description, series_name: m.series, model_number: m.model,
      rated_voltage: m.rated_voltage,
      iec_standards_compliance: ['IEC 61810-1'],
      ce_marked: true, rohs_compliant: true,
      mounting_type: 'DIN Rail / Socket',
    }));
  }
  for (const m of schneiderModels) {
    products.push(baseProduct({
      sku: m.sku, name: m.name, brand_id: BRANDS.schneider,
      category: 'relays', hsn_code: '85364900', price: m.price,
      description: m.description, series_name: m.series, model_number: m.model,
      rated_voltage: m.rated_voltage,
      iec_standards_compliance: ['IEC 61810-1'],
      ce_marked: true, rohs_compliant: true,
      mounting_type: 'DIN Rail / Socket',
    }));
  }
  return products;
}

function buildSwitches() {
  const legrand = [
    { sku: 'LEG-MYR-1M-6A-SW', name: 'Legrand Myrius 1M 6A Switch', price: 185, description: 'Legrand Myrius series 1 module 6A switch. IS 3854 compliant. Suitable for residential and commercial wiring.' },
    { sku: 'LEG-MYR-1M-16A-SW', name: 'Legrand Myrius 1M 16A Switch', price: 210, description: 'Legrand Myrius series 1 module 16A switch. IS 3854 compliant. Heavy duty for AC and geyser points.' },
    { sku: 'LEG-MYR-2M-6A-2W', name: 'Legrand Myrius 2M 6A 2-Way Switch', price: 245, description: 'Legrand Myrius 2 module 6A two-way switch. IS 3854 compliant. For staircase and corridor lighting.' },
    { sku: 'LEG-MYR-3M-5A-SKT', name: 'Legrand Myrius 3M 5A Socket', price: 320, description: 'Legrand Myrius 3 module 5A socket outlet with shutter. IS 1293 compliant. Child safe shutters.' },
    { sku: 'LEG-MYR-3M-16A-SKT', name: 'Legrand Myrius 3M 16A Socket', price: 380, description: 'Legrand Myrius 3 module 16A socket outlet. IS 1293 compliant. For AC and heavy appliance points.' },
    { sku: 'LEG-MYR-6M-PLATE', name: 'Legrand Myrius 6M Cover Plate', price: 145, description: 'Legrand Myrius series 6 module cover plate. White. Suitable for 6 module grid frame.' },
    { sku: 'LEG-MYR-8M-PLATE', name: 'Legrand Myrius 8M Cover Plate', price: 185, description: 'Legrand Myrius series 8 module cover plate. White.' },
    { sku: 'LEG-MYR-USB-CHG', name: 'Legrand Myrius USB Charger Module', price: 650, description: 'Legrand Myrius USB charger 2.1A. Dual USB ports. For modular plate installation.' },
  ];
  const gm = [
    { sku: 'GM-NEO-1M-6A-SW', name: 'GM Modular Neo 1M 6A Switch', price: 155, description: 'GM Modular Neo series 1 module 6A switch. IS 3854 compliant. BIS certified. Made in India.' },
    { sku: 'GM-NEO-1M-16A-SW', name: 'GM Modular Neo 1M 16A Switch', price: 175, description: 'GM Modular Neo series 1 module 16A switch. IS 3854 compliant. For heavy load points.' },
    { sku: 'GM-NEO-3M-5A-SKT', name: 'GM Modular Neo 3M 5A Socket', price: 268, description: 'GM Modular Neo 3 module 5A socket with shutter. IS 1293 compliant. Child safe.' },
    { sku: 'GM-NEO-3M-16A-SKT', name: 'GM Modular Neo 3M 16A Socket', price: 320, description: 'GM Modular Neo 3 module 16A socket. IS 1293 compliant. For AC points.' },
    { sku: 'GM-NEO-1M-BELL', name: 'GM Modular Neo 1M Bell Push', price: 135, description: 'GM Modular Neo series bell push switch. IS 3854 compliant.' },
    { sku: 'GM-NEO-2M-2W', name: 'GM Modular Neo 2M 2-Way Switch', price: 198, description: 'GM Modular Neo 2 module two-way switch 6A. IS 3854 compliant.' },
  ];
  const anchor = [
    { sku: 'ANC-ROMA-6A-1W', name: 'Anchor Roma 6A 1-Way Switch', price: 42, description: 'Anchor Roma 6A one-way switch. IS 3854 compliant. BIS certified. Economy range for residential wiring.' },
    { sku: 'ANC-ROMA-16A-1W', name: 'Anchor Roma 16A Switch', price: 58, description: 'Anchor Roma 16A switch. IS 3854 compliant. For heavy load points like geysers and ACs.' },
    { sku: 'ANC-ROMA-6A-2W', name: 'Anchor Roma 6A 2-Way Switch', price: 65, description: 'Anchor Roma 6A two-way switch. IS 3854 compliant. For staircase wiring.' },
    { sku: 'ANC-ROMA-5A-SKT', name: 'Anchor Roma 5A Socket', price: 78, description: 'Anchor Roma 5A socket outlet. IS 1293 compliant. 3 pin socket with shutter.' },
    { sku: 'ANC-ROMA-16A-SKT', name: 'Anchor Roma 16A Socket', price: 95, description: 'Anchor Roma 16A socket. IS 1293 compliant. For AC and heavy appliance points.' },
    { sku: 'ANC-ROMA-BELL', name: 'Anchor Roma Bell Push', price: 35, description: 'Anchor Roma bell push switch. IS 3854 compliant.' },
    { sku: 'ANC-ROMA-6P-PLATE', name: 'Anchor Roma 6 Pin Cover Plate', price: 28, description: 'Anchor Roma 6 pin cover plate. White.' },
    { sku: 'ANC-ROMA-8P-PLATE', name: 'Anchor Roma 8 Pin Cover Plate', price: 35, description: 'Anchor Roma 8 pin cover plate. White.' },
  ];

  const out: any[] = [];
  const common = {
    category: 'switches_and_sockets',
    hsn_code: '85364190',
    rated_voltage: '240V AC',
    rohs_compliant: true,
  };
  for (const p of legrand) out.push(baseProduct({ ...common, ...p, brand_id: BRANDS.legrand, iec_standards_compliance: ['IS 3854', 'IS 1293'], ce_marked: true }));
  for (const p of gm) out.push(baseProduct({ ...common, ...p, brand_id: BRANDS.gm, iec_standards_compliance: ['IS 3854', 'IS 1293'], ce_marked: false }));
  for (const p of anchor) out.push(baseProduct({ ...common, ...p, brand_id: BRANDS.anchor, iec_standards_compliance: ['IS 3854', 'IS 1293'], ce_marked: false }));
  return out;
}

export default function SeedCatalog4() {
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('Preparing...');
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      const all = [...buildWires(), ...buildRelays(), ...buildSwitches()];
      setTotal(all.length);
      setStatus(`Seeding ${all.length} products...`);

      const sum: Record<string, number> = {};
      for (const p of all) {
        const key = `${p.brand_id}|${p.category}`;
        sum[key] = (sum[key] || 0) + 1;
      }
      setSummary(sum);

      const batchSize = 50;
      const errs: string[] = [];
      let inserted = 0;
      for (let i = 0; i < all.length; i += batchSize) {
        const batch = all.slice(i, i + batchSize);
        const { error } = await supabase
          .from('products' as any)
          .upsert(batch as any, { onConflict: 'sku' });
        if (error) {
          errs.push(`Batch ${i}: ${error.message}`);
        }
        inserted += batch.length;
        setProgress(inserted);
      }

      setErrors(errs);
      setStatus(errs.length ? 'Completed with errors' : 'Completed successfully');
      setDone(true);
    })();
  }, []);

  const brandNames: Record<string, string> = {
    [BRANDS.polycab]: 'Polycab',
    [BRANDS.havells]: 'Havells',
    [BRANDS.finolex]: 'Finolex',
    [BRANDS.legrand]: 'Legrand',
    [BRANDS.gm]: 'GM Modular',
    [BRANDS.anchor]: 'Anchor by Panasonic',
    [BRANDS.omron]: 'Omron',
    [BRANDS.schneider]: 'Schneider Electric',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-2">Seed Catalog 4</h1>
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3 mb-4">
          ⚠️ Before running: disable RLS on the <code>products</code> table in Supabase, or
          ensure you're logged in as a super admin. Re-enable RLS after seeding completes.
        </p>

        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>{status}</span>
            <span>{progress} / {total}</span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all"
              style={{ width: total ? `${(progress / total) * 100}%` : '0%' }}
            />
          </div>
        </div>

        {done && (
          <div className="mt-6">
            <h2 className="font-semibold mb-2">Summary</h2>
            <ul className="text-sm space-y-1">
              {Object.entries(summary).map(([key, count]) => {
                const [brandId, category] = key.split('|');
                return (
                  <li key={key} className="flex justify-between border-b py-1">
                    <span>{brandNames[brandId] || brandId} — {category}</span>
                    <span className="font-mono">{count}</span>
                  </li>
                );
              })}
            </ul>
            {errors.length > 0 && (
              <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
                <strong>Errors:</strong>
                <ul className="list-disc pl-5 mt-1">
                  {errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
