import React from 'react';
import type { FallbackProps } from 'react-error-boundary';
const ErrorFallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => (
  <div role="alert" className="flex flex-col items-center justify-center min-h-screen text-center p-4 bg-background text-foreground">
    <h2 className="text-2xl font-bold text-destructive">Something went wrong:</h2>
    <pre className="mt-2 p-2 bg-muted rounded-md text-destructive-foreground whitespace-pre-wrap break-words">
      {error.message}
    </pre>
    <button onClick={resetErrorBoundary} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md">
      Reload Page
    </button>
  </div>
);
export default React.memo(ErrorFallback);