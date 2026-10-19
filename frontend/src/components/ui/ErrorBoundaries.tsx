import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class BaseErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          className="p-6 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/30 text-center my-4"
          data-testid="error-boundary-fallback"
        >
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-red-900 dark:text-red-200 mb-1">
            {this.props.fallbackTitle || 'Component Encountered an Issue'}
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300 max-w-md mx-auto mb-4">
            {this.props.fallbackMessage ||
              this.state.error?.message ||
              'A rendering error occurred in this view.'}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Retry Component
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export const RootErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <BaseErrorBoundary
    fallbackTitle="Application Initialization Failed"
    fallbackMessage="A critical error occurred while loading the application. Please reload the page."
  >
    {children}
  </BaseErrorBoundary>
);

export const ChartErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <BaseErrorBoundary
    fallbackTitle="Trend Chart Unavailable"
    fallbackMessage="Unable to render the historical trend chart with the current time-series dataset."
  >
    {children}
  </BaseErrorBoundary>
);

export const TableErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <BaseErrorBoundary
    fallbackTitle="Portfolio Matrix Unavailable"
    fallbackMessage="Unable to render the project comparative matrix table."
  >
    {children}
  </BaseErrorBoundary>
);

export const UploadErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <BaseErrorBoundary
    fallbackTitle="Upload Zone Error"
    fallbackMessage="An unexpected issue occurred in the CSV upload component."
  >
    {children}
  </BaseErrorBoundary>
);

export { BaseErrorBoundary as ErrorBoundary };

