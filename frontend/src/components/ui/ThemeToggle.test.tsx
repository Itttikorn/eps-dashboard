import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle Component', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  it('renders theme toggle button with accessible label', () => {
    render(<ThemeToggle />);
    const btn = screen.getByTestId('theme-toggle-btn');
    expect(btn).toBeInTheDocument();
  });

  it('toggles dark mode class on html and invokes onThemeChange callback', () => {
    const handleThemeChange = vi.fn();
    render(<ThemeToggle onThemeChange={handleThemeChange} />);
    const btn = screen.getByTestId('theme-toggle-btn');

    fireEvent.click(btn);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('eps_theme')).toBe('dark');
    expect(handleThemeChange).toHaveBeenCalled();
  });

  it('does not invoke applyTheme directly when in controlled mode', () => {
    const handleThemeChange = vi.fn();
    render(<ThemeToggle isDark={false} onThemeChange={handleThemeChange} />);
    const btn = screen.getByTestId('theme-toggle-btn');

    fireEvent.click(btn);
    expect(handleThemeChange).toHaveBeenCalledWith(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('eps_theme')).toBeNull();
  });
});

