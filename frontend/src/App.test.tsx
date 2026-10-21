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
    window.location.hash = '';
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

  it('does not write to localStorage on initial mount when no preference is saved', () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );

    expect(localStorage.getItem('eps_theme')).toBeNull();
    expect(localStorage.getItem('eps-theme')).toBeNull();
  });

  it('switches tabs and renders lazy-loaded components within Suspense', async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );

    expect(screen.getByTestId('overview-tab')).toBeInTheDocument();

    const trendsNav =
      screen.queryByRole('tab', { name: /trends/i }) ??
      screen.getByTestId('tab-trends');
    fireEvent.click(trendsNav);

    await waitFor(() => {
      expect(screen.getByTestId('trend-tab')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('switches to ingest tab and renders lazy-loaded CsvIngestionScreen', async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );

    const ingestNav =
      screen.queryByRole('tab', { name: /ingest/i }) ??
      screen.getByTestId('tab-ingest');
    fireEvent.click(ingestNav);

    await waitFor(() => {
      expect(screen.getByTestId('csv-ingestion-screen')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('renders lazy-loaded CsvUploadModal on demand when upload button clicked', async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );

    expect(screen.queryByTestId('csv-upload-modal')).not.toBeInTheDocument();

    const uploadBtn = screen.getByTestId('header-upload-btn');
    fireEvent.click(uploadBtn);

    await waitFor(() => {
      expect(screen.getByTestId('csv-upload-modal')).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});

