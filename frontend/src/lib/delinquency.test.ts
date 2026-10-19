import { describe, it, expect } from 'vitest';
import {
  calculatePendingRatio,
  isDelinquencyCritical,
  classifyOverdueHealth,
  getTrendDirectionIndicator,
} from './delinquency';

describe('Delinquency logic', () => {
  it('calculates pending ratio and handles zero denominator', () => {
    expect(calculatePendingRatio(0, 0)).toBe(0);
    expect(calculatePendingRatio(5, 5)).toBe(50);
    expect(calculatePendingRatio(20, 80)).toBe(20);
  });

  it('determines critical status around 45.0% boundary', () => {
    expect(isDelinquencyCritical(44.9)).toBe(false);
    expect(isDelinquencyCritical(45.0)).toBe(true);
    expect(isDelinquencyCritical(45.1)).toBe(true);
  });

  it('classifies overdue health bands accurately', () => {
    expect(classifyOverdueHealth(0).status).toBe('ON TRACK');
    expect(classifyOverdueHealth(4.99).status).toBe('ON TRACK');
    expect(classifyOverdueHealth(5.0).status).toBe('ATTENTION');
    expect(classifyOverdueHealth(15.0).status).toBe('ATTENTION');
    expect(classifyOverdueHealth(15.01).status).toBe('CRITICAL');
    expect(classifyOverdueHealth(100).status).toBe('CRITICAL');
  });

  it('maps net change directions to directional indicators without inversion', () => {
    const improving = getTrendDirectionIndicator('IMPROVING');
    expect(improving.symbol).toBe('▼');
    expect(improving.colorClass).toContain('text-emerald');

    const degrading = getTrendDirectionIndicator('DEGRADING');
    expect(degrading.symbol).toBe('▲');
    expect(degrading.colorClass).toContain('text-red');

    const stable = getTrendDirectionIndicator('STABLE');
    expect(stable.symbol).toBe('—');
  });
});

