import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IngestionErrorModal } from './IngestionErrorModal';

describe('IngestionErrorModal Component', () => {
  it('renders modal with error message and title', () => {
    render(
      <IngestionErrorModal
        open={true}
        onClose={vi.fn()}
        title="Invalid CSV Format"
        errorMessage="CSV parse failed: missing doc_number"
      />
    );

    expect(screen.getByTestId('ingestion-error-modal')).toBeInTheDocument();
    expect(screen.getByText('Invalid CSV Format')).toBeInTheDocument();
    expect(screen.getByText('CSV parse failed: missing doc_number')).toBeInTheDocument();
    // Does not show row discrepancies section if details is empty
    expect(screen.queryByText(/Detected Row Discrepancies:/i)).not.toBeInTheDocument();
  });

  it('filters out details that duplicate the error message so duplicate text is never shown', () => {
    const errorText = 'CSV parse failed: CSV missing required headers: missing required doc_number or title column';
    render(
      <IngestionErrorModal
        open={true}
        onClose={vi.fn()}
        title="Invalid CSV Format"
        errorMessage={errorText}
        details={[errorText]}
      />
    );

    // Error text is rendered only once (not duplicated in a discrepancies box)
    const matches = screen.getAllByText(errorText);
    expect(matches).toHaveLength(1);
    expect(screen.queryByText(/Detected Row Discrepancies:/i)).not.toBeInTheDocument();
  });

  it('renders distinct row discrepancies when details differ from the error message', () => {
    const errorText = 'CSV contains validation issues';
    render(
      <IngestionErrorModal
        open={true}
        onClose={vi.fn()}
        title="Invalid CSV Format"
        errorMessage={errorText}
        details={[errorText, 'Row 5: Invalid date format', 'Row 12: Missing status']}
      />
    );

    expect(screen.getByText(/Detected Row Discrepancies:/i)).toBeInTheDocument();
    expect(screen.getByText('Row 5: Invalid date format')).toBeInTheDocument();
    expect(screen.getByText('Row 12: Missing status')).toBeInTheDocument();

    // The duplicate item from details should have been excluded
    const matches = screen.getAllByText(errorText);
    expect(matches).toHaveLength(1);
  });

  it('invokes onClose when clicking Close Diagnostics button', () => {
    const handleClose = vi.fn();
    render(
      <IngestionErrorModal
        open={true}
        onClose={handleClose}
        title="Error"
        errorMessage="Something went wrong"
      />
    );

    const closeBtn = screen.getByRole('button', { name: /Close Diagnostics/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});

