import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PresetToolbar } from './PresetToolbar';

describe('PresetToolbar Component', () => {
  it('renders all 5 preset buttons', () => {
    render(<PresetToolbar currentPreset="90D" onSelectPreset={vi.fn()} />);

    expect(screen.getByTestId('preset-btn-30D')).toBeInTheDocument();
    expect(screen.getByTestId('preset-btn-90D')).toBeInTheDocument();
    expect(screen.getByTestId('preset-btn-180D')).toBeInTheDocument();
    expect(screen.getByTestId('preset-btn-1Y')).toBeInTheDocument();
    expect(screen.getByTestId('preset-btn-ALL')).toBeInTheDocument();
  });

  it('marks currentPreset as aria-pressed', () => {
    render(<PresetToolbar currentPreset="90D" onSelectPreset={vi.fn()} />);
    expect(screen.getByTestId('preset-btn-90D')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('preset-btn-30D')).toHaveAttribute('aria-pressed', 'false');
  });

  it('triggers onSelectPreset when a button is clicked', () => {
    const handleSelect = vi.fn();
    render(<PresetToolbar currentPreset="90D" onSelectPreset={handleSelect} />);

    fireEvent.click(screen.getByTestId('preset-btn-1Y'));
    expect(handleSelect).toHaveBeenCalledWith('1Y');
  });
});

