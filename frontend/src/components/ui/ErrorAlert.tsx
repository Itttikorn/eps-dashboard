import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export interface ErrorAlertProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  title = 'Failed to load data',
  message = 'An unexpected error occurred while communicating with the service.',
  onRetry,
  className = '',
}) => {
  return (
    <div
      role="alert"
      className={`rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-4 text-red-900 dark:text-red-200 ${className}`}
      data-testid="error-alert"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-red-800 dark:text-red-200">{title}</h4>
          <p className="text-sm text-red-700 dark:text-red-300/90 mt-1">{message}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

