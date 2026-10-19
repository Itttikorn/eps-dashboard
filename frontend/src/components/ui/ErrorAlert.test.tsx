import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorAlert } from './ErrorAlert';

describe('ErrorAlert Component', () => {
  it('renders default title and message', () => {
    render(<ErrorAlert />);
    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders custom title, message and invokes onRetry', () => {
    const handleRetry = vi.fn();
    render(
      <ErrorAlert
        title="Network Disconnected"
        message="Please check your VPN connection"
        onRetry={handleRetry}
      />
    );

    expect(screen.getByText('Network Disconnected')).toBeInTheDocument();
    expect(screen.getByText('Please check your VPN connection')).toBeInTheDocument();

    const retryBtn = screen.getByText('Try again');
    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });
});

