// Deterministic 24-slot color palette mapping

export const BASE_16_COLORS: string[] = [
  '#2f6fce', // 1: Royal Blue
  '#ee8a1f', // 2: Amber
  '#12a4a0', // 3: Teal
  '#26a65b', // 4: Emerald
  '#8b5cf6', // 5: Purple
  '#ec4899', // 6: Pink
  '#06b6d4', // 7: Cyan
  '#f59e0b', // 8: Ochre
  '#3b82f6', // 9: Blue (dashed)
  '#10b981', // 10: Mint (dashed)
  '#6366f1', // 11: Indigo (dashed)
  '#d97706', // 12: Rust (dashed)
  '#14b8a6', // 13: Aqua (dashed)
  '#84cc16', // 14: Lime (dashed)
  '#a855f7', // 15: Violet (dashed)
  '#f43f5e', // 16: Rose (dashed)
];

// Additional 8 HSL-rotated slots for 17..24
export const EXTENDED_8_COLORS: string[] = [
  '#0284c7', // 17
  '#059669', // 18
  '#7c3aed', // 19
  '#db2777', // 20
  '#ea580c', // 21
  '#4f46e5', // 22
  '#0d9488', // 23
  '#ca8a04', // 24
];

export const ALL_24_PALETTE = [...BASE_16_COLORS, ...EXTENDED_8_COLORS];

/**
 * Returns a stable, deterministic color and stroke pattern for a given project identifier.
 * Stable assignment is keyed by hashing or indexing against the sorted known project IDs.
 */
export function getProjectColor(
  projectId: string,
  allKnownProjectIds?: string[]
): {
  color: string;
  isDashed: boolean;
  strokeDasharray?: string;
  slotIndex: number;
} {
  let index = 0;

  if (allKnownProjectIds && allKnownProjectIds.length > 0) {
    const sorted = [...allKnownProjectIds].sort();
    const foundIndex = sorted.indexOf(projectId);
    index = foundIndex >= 0 ? foundIndex : 0;
  } else {
    // Hash-based fallback when global list isn't provided
    let hash = 0;
    for (let i = 0; i < projectId.length; i++) {
      hash = (hash << 5) - hash + projectId.charCodeAt(i);
      hash |= 0;
    }
    index = Math.abs(hash) % ALL_24_PALETTE.length;
  }

  const slotIndex = index % ALL_24_PALETTE.length;
  const color = ALL_24_PALETTE[slotIndex] || '#2f6fce';
  const isDashed = slotIndex >= 8;

  return {
    color,
    isDashed,
    strokeDasharray: isDashed ? '5 5' : undefined,
    slotIndex,
  };
}

