import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectSelectorDropdown } from './ProjectSelectorDropdown';

const mockProjects = [
  { id: 'PRJ-01', name: 'Rayong Petrochemical' },
  { id: 'PRJ-02', name: 'Bangkok Center' },
  { id: 'PRJ-03', name: 'Chiang Mai Distribution' },
];

describe('ProjectSelectorDropdown Component', () => {
  it('renders available projects and selection count', () => {
    render(
      <ProjectSelectorDropdown
        availableProjects={mockProjects}
        selectedProjectIds={['PRJ-01']}
        onToggleProject={vi.fn()}
        onSelectAll={vi.fn()}
        onClearAll={vi.fn()}
      />
    );

    expect(screen.getByText(/Projects to Compare \(1\/3\)/i)).toBeInTheDocument();
    expect(screen.getByText('PRJ-01')).toBeInTheDocument();
    expect(screen.getByText('PRJ-02')).toBeInTheDocument();
    expect(screen.getByText('PRJ-03')).toBeInTheDocument();
  });

  it('calls onSelectAll and onClearAll actions', () => {
    const handleSelectAll = vi.fn();
    const handleClearAll = vi.fn();

    render(
      <ProjectSelectorDropdown
        availableProjects={mockProjects}
        selectedProjectIds={['PRJ-01']}
        onToggleProject={vi.fn()}
        onSelectAll={handleSelectAll}
        onClearAll={handleClearAll}
      />
    );

    fireEvent.click(screen.getByTestId('select-all-projects-btn'));
    expect(handleSelectAll).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('clear-all-projects-btn'));
    expect(handleClearAll).toHaveBeenCalledTimes(1);
  });
});

