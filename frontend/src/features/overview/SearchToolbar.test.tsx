import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchToolbar } from './SearchToolbar';

describe('SearchToolbar Component', () => {
  it('renders search input and total filtered count', () => {
    render(
      <SearchToolbar
        searchQuery=""
        onSearchChange={vi.fn()}
        sortField="total"
        onSortFieldChange={vi.fn()}
        sortDir="desc"
        onToggleSortDir={vi.fn()}
        totalFilteredCount={14}
      />
    );

    expect(screen.getByPlaceholderText(/Filter by Project ID/i)).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();
  });

  it('triggers onSearchChange when typing', () => {
    const handleSearch = vi.fn();
    render(
      <SearchToolbar
        searchQuery=""
        onSearchChange={handleSearch}
        sortField="total"
        onSortFieldChange={vi.fn()}
        sortDir="desc"
        onToggleSortDir={vi.fn()}
        totalFilteredCount={14}
      />
    );

    const input = screen.getByPlaceholderText(/Filter by Project ID/i);
    fireEvent.change(input, { target: { value: 'BKK' } });
    expect(handleSearch).toHaveBeenCalledWith('BKK');
  });

  it('toggles sort direction when clicking sort button', () => {
    const handleToggle = vi.fn();
    render(
      <SearchToolbar
        searchQuery="BKK"
        onSearchChange={vi.fn()}
        sortField="total"
        onSortFieldChange={vi.fn()}
        sortDir="desc"
        onToggleSortDir={handleToggle}
        totalFilteredCount={2}
      />
    );

    const toggleBtn = screen.getByLabelText(/Toggle sort direction/i);
    fireEvent.click(toggleBtn);
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });
});

