/**
 * Smart Product Name Parser for Electrical Components
 * Extracts structured specifications from free-text product names.
 */

export interface ParsedProduct {
  componentType: string | null;
  category: string | null;
  categorySlug: string | null;
  ratedCurrent: number | null;
  poles: number | null;
  breakingCapacity: number | null;
  voltage: number | null;
  voltageType: 'AC' | 'DC' | null;
  coilVoltage: string | null;
  brand: string | null;
  ctRatio: string | null;
  powerRating: number | null;
  powerUnit: string | null;
  utilizationCategory: string | null;
  overloadRange: string | null;
  accuracyClass: string | null;
  searchKeywords: string[];
}

// Category mappings from component keywords
const CATEGORY_MAP: Record<string, { category: string; slug: string }> = {
  'mccb': { category: 'Low Voltage Switchgear', slug: 'low-voltage-switchgears' },
  'mcb': { category: 'Low Voltage Switchgear', slug: 'low-voltage-switchgears' },
  'acb': { category: 'Low Voltage Switchgear', slug: 'low-voltage-switchgears' },
  'rccb': { category: 'Low Voltage Switchgear', slug: 'low-voltage-switchgears' },
  'rcbo': { category: 'Low Voltage Switchgear', slug: 'low-voltage-switchgears' },
  'isolator': { category: 'Low Voltage Switchgear', slug: 'low-voltage-switchgears' },
  'switch disconnector': { category: 'Low Voltage Switchgear', slug: 'low-voltage-switchgears' },
  'changeover': { category: 'Low Voltage Switchgear', slug: 'low-voltage-switchgears' },
  'contactor': { category: 'Control Gear', slug: 'controlling-gear-signalling-devices' },
  'overload relay': { category: 'Control Gear', slug: 'controlling-gear-signalling-devices' },
  'olr': { category: 'Control Gear', slug: 'controlling-gear-signalling-devices' },
  'thermal overload': { category: 'Control Gear', slug: 'controlling-gear-signalling-devices' },
  'motor starter': { category: 'Control Gear', slug: 'controlling-gear-signalling-devices' },
  'dol starter': { category: 'Control Gear', slug: 'controlling-gear-signalling-devices' },
  'star delta': { category: 'Control Gear', slug: 'controlling-gear-signalling-devices' },
  'push button': { category: 'Control Gear', slug: 'controlling-gear-signalling-devices' },
  'indicator': { category: 'Control Gear', slug: 'controlling-gear-signalling-devices' },
  'pilot lamp': { category: 'Control Gear', slug: 'controlling-gear-signalling-devices' },
  'e-stop': { category: 'Control Gear', slug: 'controlling-gear-signalling-devices' },
  'relay': { category: 'Relays', slug: 'relays' },
  'timer relay': { category: 'Relays', slug: 'relays' },
  'timer': { category: 'Relays', slug: 'relays' },
  'ct': { category: 'Metering', slug: 'meters' },
  'current transformer': { category: 'Metering', slug: 'meters' },
  'energy meter': { category: 'Metering', slug: 'meters' },
  'multifunction meter': { category: 'Metering', slug: 'meters' },
  'ammeter': { category: 'Metering', slug: 'meters' },
  'voltmeter': { category: 'Metering', slug: 'meters' },
  'smps': { category: 'Automation Power', slug: 'industrial-automation' },
  'power supply': { category: 'Automation Power', slug: 'industrial-automation' },
  'vfd': { category: 'Industrial Automation', slug: 'industrial-automation' },
  'drive': { category: 'Industrial Automation', slug: 'industrial-automation' },
  'plc': { category: 'Industrial Automation', slug: 'industrial-automation' },
  'soft starter': { category: 'Industrial Automation', slug: 'industrial-automation' },
  'control transformer': { category: 'Transformers', slug: 'transformers' },
  'transformer': { category: 'Transformers', slug: 'transformers' },
  'capacitor': { category: 'Capacitors & Reactors', slug: 'capacitors-reactors' },
  'reactor': { category: 'Capacitors & Reactors', slug: 'capacitors-reactors' },
  'cable': { category: 'Wires & Cables', slug: 'wires-cables' },
  'wire': { category: 'Wires & Cables', slug: 'wires-cables' },
  'led': { category: 'LED Lights', slug: 'led-lights' },
  'light': { category: 'LED Lights', slug: 'led-lights' },
  'panel': { category: 'Panels & Enclosures', slug: 'panels-enclosures' },
  'enclosure': { category: 'Panels & Enclosures', slug: 'panels-enclosures' },
  'db': { category: 'Low Voltage Switchgear', slug: 'low-voltage-switchgears' },
  'distribution board': { category: 'Low Voltage Switchgear', slug: 'low-voltage-switchgears' },
};

// Known brands
const KNOWN_BRANDS = [
  'Siemens', 'Schneider', 'Schneider Electric', 'ABB', 'L&T', 'Legrand',
  'Havells', 'Omron', 'MeanWell', 'Mean Well', 'Polycab', 'Hager',
  'C&S', 'Elmex', 'HPL', 'GE', 'Eaton', 'LS', 'Mitsubishi', 'Delta',
  'Fuji', 'Allen Bradley', 'Rockwell', 'Phoenix Contact', 'Weidmuller',
  'IDEC', 'Autonics', 'Selec', 'Larsen & Toubro', 'Finolex', 'KEI',
  'RR Kabel', 'Anchor', 'Crompton', 'Bajaj', 'Philips', 'Wipro',
  'Orient', 'Syska', 'BCH', 'IndoAsian', 'Standard', 'Teknic',
];

export function parseProductName(input: string): ParsedProduct {
  const text = input.trim();
  const upper = text.toUpperCase();
  const result: ParsedProduct = {
    componentType: null,
    category: null,
    categorySlug: null,
    ratedCurrent: null,
    poles: null,
    breakingCapacity: null,
    voltage: null,
    voltageType: null,
    coilVoltage: null,
    brand: null,
    ctRatio: null,
    powerRating: null,
    powerUnit: null,
    utilizationCategory: null,
    overloadRange: null,
    accuracyClass: null,
    searchKeywords: [],
  };

  // 1. Detect component type & category (check multi-word first, then single-word)
  const sortedKeys = Object.keys(CATEGORY_MAP).sort((a, b) => b.length - a.length);
  for (const keyword of sortedKeys) {
    if (upper.includes(keyword.toUpperCase())) {
      result.componentType = keyword.toUpperCase();
      result.category = CATEGORY_MAP[keyword].category;
      result.categorySlug = CATEGORY_MAP[keyword].slug;
      break;
    }
  }

  // 2. Extract rated current: patterns like "250A", "63 A", "125A"
  const currentMatch = upper.match(/(\d+)\s*A(?:\s|$|,|\b)/);
  if (currentMatch) {
    const val = parseInt(currentMatch[1]);
    // Avoid matching voltage values (typically > 200 without explicit "A")
    if (val <= 6300) {
      result.ratedCurrent = val;
    }
  }

  // 3. Extract poles: "4P", "3P", "TPN", "SPN", "FP", "TP"
  const poleMatch = upper.match(/(\d)\s*P(?:\+N)?(?:\s|$|,)/);
  if (poleMatch) {
    result.poles = parseInt(poleMatch[1]);
  } else if (upper.includes('TPN') || upper.includes('3P+N')) {
    result.poles = 4; // 3P+N
  } else if (upper.includes('SPN') || upper.includes('1P+N')) {
    result.poles = 2; // 1P+N
  } else if (/\bFP\b/.test(upper)) {
    result.poles = 4;
  } else if (/\bTP\b/.test(upper) && !upper.includes('TPN')) {
    result.poles = 3;
  } else if (/\bSP\b/.test(upper) && !upper.includes('SPN')) {
    result.poles = 1;
  }

  // 4. Breaking capacity: "36kA", "10 kA", "36KA"
  const breakingMatch = upper.match(/(\d+)\s*KA/);
  if (breakingMatch) {
    result.breakingCapacity = parseInt(breakingMatch[1]);
  }

  // 5. Voltage: "415V", "230V AC", "24V DC"
  const voltageMatch = text.match(/(\d+)\s*V\s*(AC|DC)?/i);
  if (voltageMatch) {
    result.voltage = parseInt(voltageMatch[1]);
    if (voltageMatch[2]) {
      result.voltageType = voltageMatch[2].toUpperCase() as 'AC' | 'DC';
    }
  }

  // 6. Coil voltage (for contactors): "Coil 220V", "coil voltage 24V DC"
  const coilMatch = text.match(/coil\s*(?:voltage)?\s*(\d+)\s*V\s*(AC|DC)?/i);
  if (coilMatch) {
    result.coilVoltage = `${coilMatch[1]}V${coilMatch[2] ? ' ' + coilMatch[2].toUpperCase() : ''}`;
  }

  // 7. CT ratio: "200/5A", "100/5"
  const ctMatch = text.match(/(\d+)\s*\/\s*(\d+)\s*A?/i);
  if (ctMatch && (upper.includes('CT') || upper.includes('CURRENT TRANSFORMER'))) {
    result.ctRatio = `${ctMatch[1]}/${ctMatch[2]}A`;
  }

  // 8. Power rating: "1kVA", "10A 24V" (for SMPS), "500W"
  const kvaMatch = text.match(/(\d+(?:\.\d+)?)\s*kVA/i);
  if (kvaMatch) {
    result.powerRating = parseFloat(kvaMatch[1]);
    result.powerUnit = 'kVA';
  }
  const wattMatch = text.match(/(\d+(?:\.\d+)?)\s*W(?:\s|$)/i);
  if (wattMatch && !kvaMatch) {
    result.powerRating = parseFloat(wattMatch[1]);
    result.powerUnit = 'W';
  }
  const kwMatch = text.match(/(\d+(?:\.\d+)?)\s*kW/i);
  if (kwMatch) {
    result.powerRating = parseFloat(kwMatch[1]);
    result.powerUnit = 'kW';
  }

  // 9. Utilization category: "AC-3", "AC3", "AC-1"
  const ucMatch = upper.match(/AC[\s-]?([1-7][AB]?)/);
  if (ucMatch) {
    result.utilizationCategory = `AC-${ucMatch[1]}`;
  }

  // 10. Overload range: "55-65A", "23–32A"
  const olrMatch = text.match(/(\d+)\s*[-–]\s*(\d+)\s*A/);
  if (olrMatch && (upper.includes('OLR') || upper.includes('OVERLOAD') || upper.includes('THERMAL'))) {
    result.overloadRange = `${olrMatch[1]}–${olrMatch[2]}A`;
  }

  // 11. Accuracy class: "Class 1", "Class 0.5S"
  const classMatch = text.match(/Class\s+(\d+(?:\.\d+)?S?)/i);
  if (classMatch) {
    result.accuracyClass = `Class ${classMatch[1]}`;
  }

  // 12. Brand detection (case-insensitive)
  for (const brand of KNOWN_BRANDS) {
    if (upper.includes(brand.toUpperCase())) {
      result.brand = brand;
      break;
    }
  }

  // 13. Generate search keywords
  const keywords: string[] = [];
  if (result.componentType) keywords.push(result.componentType);
  if (result.ratedCurrent) keywords.push(`${result.ratedCurrent}A`);
  if (result.poles) keywords.push(`${result.poles}P`);
  if (result.breakingCapacity) keywords.push(`${result.breakingCapacity}kA`);
  if (result.voltage) keywords.push(`${result.voltage}V`);
  if (result.brand) keywords.push(result.brand);
  if (result.ctRatio) keywords.push(result.ctRatio);
  if (result.coilVoltage) keywords.push(`Coil ${result.coilVoltage}`);
  if (result.utilizationCategory) keywords.push(result.utilizationCategory);
  result.searchKeywords = keywords;

  return result;
}

export { KNOWN_BRANDS };
