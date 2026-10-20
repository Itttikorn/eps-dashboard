import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryBadge, DelinquencyChip, OverdueBadge, TrendTag } from './Badges';

describe('Badges Component Suite', () => {
  describe('CategoryBadge', () => {
    it('renders category name and count correctly', () => {
      render(<CategoryBadge name="Baseline Review" color="#2F6FCE" count={42} />);
      expect(screen.getByText('Baseline Review')).toBeInTheDocument();
      expect(screen.getByText('(42)')).toBeInTheDocument();
    });

    it('handles click callback when provided', () => {
      const handleClick = vi.fn();
      render(
        <CategoryBadge
          name="Control"
          color="#12A4A0"
          onClick={handleClick}
        />
      );
      const btn = screen.getByRole('button');
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('applies active styling when active is true', () => {
      render(
        <CategoryBadge
          name="Active Category"
          color="#2F6FCE"
          active={true}
        />
      );
      const btn = screen.getByRole('button');
      expect(btn).toHaveClass('font-semibold');
    });
  });

  describe('DelinquencyChip', () => {
    it('renders normal pending percentage when not critical', () => {
      render(<DelinquencyChip pendingPercent={12.4} isCritical={false} />);
      expect(screen.getByText('12.4% pending')).toBeInTheDocument();
      expect(screen.queryByTestId('delinquency-critical-chip')).not.toBeInTheDocument();
    });

    it('renders high-contrast blinking badge when critical (>=45%)', () => {
      render(<DelinquencyChip pendingPercent={51.2} isCritical={true} />);
      const chip = screen.getByTestId('delinquency-critical-chip');
      expect(chip).toBeInTheDocument();
      expect(chip).toHaveTextContent('51.2% OVERDUE');
      expect(chip).toHaveClass('chip-blink');
    });
  });

  describe('OverdueBadge', () => {
    it('classifies < 5% as ON TRACK green', () => {
      render(<OverdueBadge overduePercent={3.2} overdueCount={15} />);
      const badge = screen.getByTestId('overdue-badge-on-track');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('ON TRACK');
      expect(badge).toHaveTextContent('15 docs • 3.2%');
    });

    it('classifies 5-15% as ATTENTION amber', () => {
      render(<OverdueBadge overduePercent={10.0} overdueCount={50} />);
      const badge = screen.getByTestId('overdue-badge-attention');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('ATTENTION');
    });

    it('classifies > 15% as CRITICAL red', () => {
      render(<OverdueBadge overduePercent={18.5} overdueCount={92} />);
      const badge = screen.getByTestId('overdue-badge-critical');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('CRITICAL');
    });
  });

  describe('TrendTag', () => {
    it('renders IMPROVING with down triangle symbol', () => {
      render(<TrendTag direction="IMPROVING" />);
      const tag = screen.getByTestId('trend-tag-improving');
      expect(tag).toHaveTextContent('▼');
      expect(tag).toHaveTextContent('IMPROVING');
    });

    it('renders DEGRADING with up triangle symbol', () => {
      render(<TrendTag direction="DEGRADING" />);
      const tag = screen.getByTestId('trend-tag-degrading');
      expect(tag).toHaveTextContent('▲');
      expect(tag).toHaveTextContent('DEGRADING');
    });

    it('renders STABLE with em-dash symbol', () => {
      render(<TrendTag direction="STABLE" />);
      const tag = screen.getByTestId('trend-tag-stable');
      expect(tag).toHaveTextContent('—');
      expect(tag).toHaveTextContent('STABLE');
    });
  });
});

