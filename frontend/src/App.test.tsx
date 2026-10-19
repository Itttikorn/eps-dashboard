import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

describe('App Root Component - Theme Management', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  it('initializes in light mode when no preference stored and toggles to dark mode', async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );

    // Initial state: not dark
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    // Toggle theme
    const themeBtn = screen.getByTestId('theme-toggle-btn');
    fireEvent.click(themeBtn);

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(localStorage.getItem('eps_theme')).toBe('dark');
    });

    // Toggle back to light
    fireEvent.click(themeBtn);

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(localStorage.getItem('eps_theme')).toBe('light');
    });
  });

  it('restores dark mode preference from localStorage on mount', () => {
    localStorage.setItem('eps_theme', 'dark');
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});

