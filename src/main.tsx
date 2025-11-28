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
import { ErrorBoundary } from "react-error-boundary";
/**
 * Import application pages and common components.
 */
import { HomePage } from "@/pages/HomePage";
import { DemoPage } from "@/pages/DemoPage";
import LoginPage from "@/pages/LoginPage";
import { QuotePage } from "@/pages/QuotePage";
import { AdminPage } from "@/pages/AdminPage";
import FullPageLoader from "@/components/common/FullPageLoader";
import ErrorFallback from "@/components/common/ErrorFallback";
/**
 * Import global styles.
 */
import "@/index.css";
// Lazy load pages that are not critical for the initial render
const QuotesListPage = lazy(() => import('@/pages/QuotesListPage'));
// Create a client
const queryClient = new QueryClient();
const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Root element not found. Make sure there is an element with id='root' in index.html");
}
ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
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