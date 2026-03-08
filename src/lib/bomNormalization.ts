// ============================================================
// BOM Normalization — standardize raw AI output values
// ============================================================

/**
 * Normalize rated current strings: "250A" → "250 A", "63a" → "63 A"
 */
export function normalizeRatedCurrent(value: string | null | undefined): string | null {
  if (!value) return null;
  // CT ratio: "200/5A"
  const ctMatch = value.trim().match(/^(\d+)\s*\/\s*(\d+)\s*(A|a)?$/i);
  if (ctMatch) return `${ctMatch[1]}/${ctMatch[2]} A`;
  // Ranges: "55-65A" or "23–32A"
  const rangeMatch = value.trim().match(/^(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)\s*(A|a|amp|amps)?$/i);
  if (rangeMatch) return `${rangeMatch[1]}-${rangeMatch[2]} A`;
  // Simple: "250A"
  const match = value.trim().match(/^(\d+\.?\d*)\s*(A|a|amp|amps)?$/i);
  if (match) return `${match[1]} A`;
  return value.trim();
}

/**
 * Normalize poles: "4P" → "4P", "4 pole" → "4P", "3" → "3P"
 */
export function normalizePoles(value: string | null | undefined): string | null {
  if (!value) return null;
  const upper = value.trim().toUpperCase();
  if (upper === 'TPN' || upper === 'TP+N') return '3P+N';
  if (upper === 'TP') return '3P';
  if (upper === 'SPN' || upper === 'SP+N') return '1P+N';
  if (upper === 'SP') return '1P';
  if (upper === 'FP') return '4P';
  const match = value.trim().match(/^(\d+)\s*(P|p|pole|poles)?$/i);
  if (match) return `${match[1]}P`;
  return upper;
}

/**
 * Normalize breaking capacity: "36kA" → "36 kA", "25ka" → "25 kA"
 */
export function normalizeBreakingCapacity(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = value.trim().match(/^(\d+\.?\d*)\s*(kA|ka|KA)$/i);
  if (match) return `${match[1]} kA`;
  return value.trim();
}

/**
 * Normalize voltage: "24V DC" → "24 V DC", "415v" → "415 V"
 */
export function normalizeVoltage(value: string | null | undefined): string | null {
  if (!value) return null;
  // Transformer voltage: "415/230V"
  const txMatch = value.trim().match(/^(\d+)\s*\/\s*(\d+)\s*(V|v)\s*(AC|DC|ac|dc)?$/i);
  if (txMatch) return `${txMatch[1]}/${txMatch[2]} V${txMatch[4] ? ` ${txMatch[4].toUpperCase()}` : ''}`;
  // Simple: "24V DC", "415V"
  const match = value.trim().match(/^(\d+\.?\d*)\s*(V|v)\s*(AC|DC|ac|dc)?$/i);
  if (match) {
    const suffix = match[3] ? ` ${match[3].toUpperCase()}` : '';
    return `${match[1]} V${suffix}`;
  }
  return value.trim();
}

/**
 * Normalize power rating: "15kW" → "15 kW", "20HP" → "20 HP"
 */
export function normalizePowerRating(value: string | null | undefined): string | null {
  if (!value) return null;
  const kvaMatch = value.trim().match(/^(\d+\.?\d*)\s*(kVA|kva|KVA)$/i);
  if (kvaMatch) return `${kvaMatch[1]} kVA`;
  const kwMatch = value.trim().match(/^(\d+\.?\d*)\s*(kW|kw|KW)$/i);
  if (kwMatch) return `${kwMatch[1]} kW`;
  const hpMatch = value.trim().match(/^(\d+\.?\d*)\s*(HP|hp|Hp)$/i);
  if (hpMatch) return `${hpMatch[1]} HP`;
  const vaMatch = value.trim().match(/^(\d+\.?\d*)\s*(VA|va)$/i);
  if (vaMatch) return `${vaMatch[1]} VA`;
  const wMatch = value.trim().match(/^(\d+\.?\d*)\s*(W|w|watt|watts)$/i);
  if (wMatch) return `${wMatch[1]} W`;
  return value.trim();
}

/**
 * Normalize quantity — ensure integer ≥ 1
 */
export function normalizeQuantity(value: unknown): number {
  if (typeof value === 'number') return Math.max(1, Math.round(value));
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? 1 : Math.max(1, parsed);
  }
  return 1;
}

/**
 * Normalize all fields on a BOM item (partial — works on any shape)
 */
export function normalizeBomFields(item: Record<string, unknown>): Record<string, unknown> {
  const result = { ...item };
  if ('rated_current' in result) result.rated_current = normalizeRatedCurrent(result.rated_current as string);
  if ('rated_voltage' in result) result.rated_voltage = normalizeVoltage(result.rated_voltage as string);
  if ('poles' in result) result.poles = normalizePoles(result.poles as string);
  if ('breaking_capacity' in result) result.breaking_capacity = normalizeBreakingCapacity(result.breaking_capacity as string);
  if ('power_rating' in result) result.power_rating = normalizePowerRating(result.power_rating as string);
  if ('quantity' in result) result.quantity = normalizeQuantity(result.quantity);
  if ('coil_voltage' in result) result.coil_voltage = normalizeVoltage(result.coil_voltage as string);
  return result;
}
