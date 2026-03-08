import { ProjectBomItem } from '@/types/project';

// ============================================================
// BOM Validation Engine — category-specific required fields
// ============================================================

export interface ValidationRule {
  requiredFields: (keyof ProjectBomItem)[];
  label: string;
}

// Plugin-style registry — add new component types without modifying core logic
const validationRules: Record<string, ValidationRule> = {
  MCCB: {
    label: 'MCCB',
    requiredFields: ['rated_current', 'poles', 'breaking_capacity', 'rated_voltage'],
  },
  MCB: {
    label: 'MCB',
    requiredFields: ['rated_current', 'poles', 'breaking_capacity'],
  },
  ACB: {
    label: 'ACB',
    requiredFields: ['rated_current', 'poles', 'breaking_capacity', 'rated_voltage'],
  },
  Contactor: {
    label: 'Contactor',
    requiredFields: ['rated_current', 'coil_voltage'],
  },
  'Overload Relay': {
    label: 'Overload Relay',
    requiredFields: ['rated_current'],
  },
  Relay: {
    label: 'Relay',
    requiredFields: ['rated_voltage', 'poles'],
  },
  CT: {
    label: 'Current Transformer',
    requiredFields: ['ct_ratio', 'accuracy_class'],
  },
  VFD: {
    label: 'Variable Frequency Drive',
    requiredFields: ['power_rating', 'rated_voltage'],
  },
  'Soft Starter': {
    label: 'Soft Starter',
    requiredFields: ['power_rating', 'rated_voltage'],
  },
  Meter: {
    label: 'Meter',
    requiredFields: ['rated_voltage'],
  },
  SPD: {
    label: 'Surge Protection Device',
    requiredFields: ['rated_voltage', 'poles'],
  },
  RCCB: {
    label: 'RCCB',
    requiredFields: ['rated_current', 'poles'],
  },
  RCBO: {
    label: 'RCBO',
    requiredFields: ['rated_current', 'poles'],
  },
  'Switch Fuse Unit': {
    label: 'Switch Fuse Unit',
    requiredFields: ['rated_current', 'poles'],
  },
  Isolator: {
    label: 'Isolator',
    requiredFields: ['rated_current', 'poles'],
  },
};

// Field labels for user-facing messages
const fieldLabels: Record<string, string> = {
  rated_current: 'Rated Current',
  rated_voltage: 'Rated Voltage',
  poles: 'Poles',
  breaking_capacity: 'Breaking Capacity',
  power_rating: 'Power Rating',
  brand: 'Brand',
  model_number: 'Model Number',
  category_slug: 'Category',
  component_type: 'Component Type',
};

export function getFieldLabel(field: string): string {
  return fieldLabels[field] || field;
}

export function getValidationRule(componentType?: string): ValidationRule | null {
  if (!componentType) return null;
  const normalized = componentType.trim();
  // Exact match first
  if (validationRules[normalized]) return validationRules[normalized];
  // Case-insensitive match
  const key = Object.keys(validationRules).find(
    k => k.toLowerCase() === normalized.toLowerCase()
  );
  return key ? validationRules[key] : null;
}

export interface ValidationResult {
  status: 'complete' | 'missing_fields' | 'needs_review';
  missingFields: string[];
}

export function validateBomItem(item: ProjectBomItem): ValidationResult {
  const rule = getValidationRule(item.component_type);

  // No rule found — can't validate, mark as needs_review if missing category
  if (!rule) {
    if (!item.component_type && !item.category_slug) {
      return { status: 'needs_review', missingFields: ['component_type', 'category_slug'] };
    }
    return { status: 'complete', missingFields: [] };
  }

  const missing: string[] = [];
  for (const field of rule.requiredFields) {
    const value = item[field];
    if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) {
      missing.push(field);
    }
  }

  if (missing.length === 0) return { status: 'complete', missingFields: [] };
  if (missing.length <= 1) return { status: 'missing_fields', missingFields: missing };
  return { status: 'needs_review', missingFields: missing };
}

// ============================================================
// Confidence Scoring — weighted multi-factor
// ============================================================

export function calculateConfidence(item: Partial<ProjectBomItem>): number {
  let score = 0;
  const rule = getValidationRule(item.component_type);

  // Factor 1: Required fields completeness (40%)
  if (rule) {
    const filled = rule.requiredFields.filter(f => {
      const v = item[f as keyof typeof item];
      return v !== null && v !== undefined && (typeof v !== 'string' || v.trim() !== '');
    }).length;
    score += 0.4 * (filled / rule.requiredFields.length);
  } else {
    // No rule — give partial credit if component_type exists
    score += item.component_type ? 0.2 : 0;
  }

  // Factor 2: Category certainty (20%)
  if (item.category_slug) score += 0.2;

  // Factor 3: Optional spec completeness (20%)
  const optionalFields: (keyof ProjectBomItem)[] = [
    'rated_current', 'rated_voltage', 'poles', 'breaking_capacity', 'power_rating',
  ];
  const optionalFilled = optionalFields.filter(f => {
    const v = item[f as keyof typeof item];
    return v !== null && v !== undefined && (typeof v !== 'string' || v.trim() !== '');
  }).length;
  score += 0.2 * (optionalFilled / optionalFields.length);

  // Factor 4: Brand / model presence (20%)
  if (item.brand) score += 0.1;
  if (item.model_number) score += 0.1;

  return Math.round(score * 100) / 100;
}

// Convenience to get all registered component types
export function getRegisteredComponentTypes(): string[] {
  return Object.keys(validationRules);
}
