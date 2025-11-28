/**
 * Main application entrypoint
 *
 * Wraps the application in QueryClientProvider to enable @tanstack/react-query.
 * Defines all application routes using React Router v6.
 */
import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from 'react-error-boundary';
/**
 * Import application pages.
 */
import { HomePage } from "@/pages/HomePage";
import { DemoPage } from "@/pages/DemoPage";
import LoginPage from "@/pages/LoginPage";
import { QuotePage } from "@/pages/QuotePage";
import { AdminPage } from "@/pages/AdminPage";
import { Skeleton } from "@/components/ui/skeleton";
/**
 * Import global styles.
 */
import "@/index.css";
// Lazy load pages that are not critical for the initial render
const QuotesListPage = lazy(() => import('@/pages/QuotesListPage').then(module => ({ default: module.QuotesListPage })));
// Create a client
const queryClient = new QueryClient();
const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Root element not found. Make sure there is an element with id='root' in index.html");
}
const FullPageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="w-full max-w-md p-8 space-y-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-10 w-1/2 mx-auto" />
    </div>
  </div>
);
const ErrorFallback = ({ error }: { error: Error }) => (
  <div role="alert" className="flex flex-col items-center justify-center min-h-screen text-center p-4 bg-background text-foreground">
    <h2 className="text-2xl font-bold text-destructive">Something went wrong:</h2>
    <pre className="mt-2 p-2 bg-muted rounded-md text-destructive-foreground">{error.message}</pre>
    <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md">
      Reload Page
    </button>
  </div>
);
ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Suspense fallback={<FullPageLoader />}>
            <Routes>
              {/* Main application routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/demo" element={<DemoPage />} />
              {/* Quote routes */}
              <Route path="/quote" element={<QuotePage />} />
              <Route path="/quote/:id" element={<QuotePage />} />
              <Route path="/quotes" element={<QuotesListPage />} />
              {/* Auth & Admin routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/admin" element={<AdminPage />} />
              {/* Fallback: reuse HomePage for unmatched routes */}
              <Route path="*" element={<HomePage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);