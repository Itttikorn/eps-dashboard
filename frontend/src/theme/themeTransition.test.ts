import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { applyTheme, getInitialTheme } from './themeTransition';

describe('themeTransition utility (Option 1: Instantaneous sync)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    document.documentElement.className = '';
    // Clean any stray style tags in head
    document.head.querySelectorAll('style').forEach(s => s.remove());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('applies dark theme without transition style when disableTransition is false', () => {
    applyTheme(true, false);

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('eps_theme')).toBe('dark');
    expect(document.head.querySelector('style')).toBeNull();
  });

  it('applies dark theme with temporary transition-none style and cleans it up after tick', () => {
    applyTheme(true, true);

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('eps_theme')).toBe('dark');

    // The temporary style tag should be in head
    const styleEl = document.head.querySelector('style');
    expect(styleEl).not.toBeNull();
    expect(styleEl?.textContent).toContain('transition:none!important');

    // Advance 1ms
    vi.advanceTimersByTime(5);

    // Style tag should be cleaned up
    expect(document.head.querySelector('style')).toBeNull();
  });

  it('applies light theme with temporary transition-none style and cleans it up', () => {
    document.documentElement.classList.add('dark');
    applyTheme(false, true);

    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('eps_theme')).toBe('light');

    vi.advanceTimersByTime(5);
    expect(document.head.querySelector('style')).toBeNull();
  });

  it('does not inject style if requested theme already matches current theme', () => {
    document.documentElement.classList.add('dark');
    applyTheme(true, true);

    // No style tag should be injected because theme didn't change
    expect(document.head.querySelector('style')).toBeNull();
  });

  it('retrieves initial theme correctly from localStorage', () => {
    localStorage.setItem('eps_theme', 'dark');
    expect(getInitialTheme()).toBe(true);

    localStorage.setItem('eps_theme', 'light');
    expect(getInitialTheme()).toBe(false);
  });

  it('does not write to localStorage when persist is false', () => {
    localStorage.clear();
    applyTheme(true, false, false);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('eps_theme')).toBeNull();
  });
});
