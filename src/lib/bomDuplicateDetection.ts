import { ProjectBomItem } from '@/types/project';

// ============================================================
// BOM Duplicate Detection
// ============================================================

export interface DuplicateGroup {
  /** Indices into the items array */
  indices: number[];
  /** Sum of quantities across duplicates */
  suggestedQuantity: number;
  /** Shared component type */
  componentType: string;
  /** Key specs that match */
  matchingSpecs: string;
}

/**
 * Generate a fingerprint for comparison.
 * Two items are "duplicate" when they share the same component type
 * and the same key electrical specs.
 */
function fingerprint(item: ProjectBomItem): string {
  const parts = [
    (item.component_type || '').toLowerCase().trim(),
    (item.rated_current || '').toLowerCase().trim(),
    (item.poles || '').toLowerCase().trim(),
    (item.breaking_capacity || '').toLowerCase().trim(),
    (item.rated_voltage || '').toLowerCase().trim(),
    (item.power_rating || '').toLowerCase().trim(),
  ];
  return parts.join('|');
}

/**
 * Detect potential duplicate components in a BOM.
 * Groups items that share the same component type and key specs.
 * Only returns groups with 2+ items.
 */
export function detectDuplicates(items: ProjectBomItem[]): DuplicateGroup[] {
  const groups = new Map<string, number[]>();

  items.forEach((item, idx) => {
    if (!item.component_type) return;
    const fp = fingerprint(item);
    if (!fp.replace(/\|/g, '').trim()) return; // Skip empty fingerprints
    const existing = groups.get(fp) || [];
    existing.push(idx);
    groups.set(fp, existing);
  });

  const duplicates: DuplicateGroup[] = [];
  for (const [, indices] of groups) {
    if (indices.length < 2) continue;
    const firstItem = items[indices[0]];
    const totalQty = indices.reduce((sum, i) => sum + items[i].quantity, 0);
    const specs = [
      firstItem.rated_current,
      firstItem.poles,
      firstItem.breaking_capacity,
    ].filter(Boolean).join(', ');

    duplicates.push({
      indices,
      suggestedQuantity: totalQty,
      componentType: firstItem.component_type || 'Unknown',
      matchingSpecs: specs || 'Same type',
    });
  }

  return duplicates;
}
