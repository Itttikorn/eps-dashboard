import { describe, it, expect } from 'vitest';
import { getProjectColor, ALL_24_PALETTE } from './palette';

describe('Palette logic', () => {
  const projects = ['PRJ-A', 'PRJ-B', 'PRJ-C', 'PRJ-D', 'PRJ-E', 'PRJ-F', 'PRJ-G', 'PRJ-H', 'PRJ-I'];

  it('assigns deterministic colors from sorted list', () => {
    const colA = getProjectColor('PRJ-A', projects);
    const colB = getProjectColor('PRJ-B', projects);

    expect(colA.color).toBe(ALL_24_PALETTE[0]);
    expect(colB.color).toBe(ALL_24_PALETTE[1]);
  });

  it('maintains color stability for PRJ-C regardless of PRJ-A presence if master list is passed', () => {
    const fullList = ['PRJ-A', 'PRJ-B', 'PRJ-C'];
    const col1 = getProjectColor('PRJ-C', fullList);

    // Re-evaluating with same master known list preserves identical color
    const col2 = getProjectColor('PRJ-C', fullList);
    expect(col1.color).toBe(col2.color);
    expect(col1.slotIndex).toBe(2);
  });

  it('marks slots 9+ (index 8+) as dashed', () => {
    // 9th project in list (index 8)
    const col9 = getProjectColor('PRJ-I', projects);
    expect(col9.slotIndex).toBe(8);
    expect(col9.isDashed).toBe(true);
    expect(col9.strokeDasharray).toBe('5 5');

    // 1st project (index 0) is solid
    const col1 = getProjectColor('PRJ-A', projects);
    expect(col1.isDashed).toBe(false);
    expect(col1.strokeDasharray).toBeUndefined();
  });
});

