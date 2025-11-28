/**
 * Main application entrypoint
 *
 * Wraps the application in QueryClientProvider to enable @tanstack/react-query.
 * Defines all application routes using React Router v6.
 */
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
/**
 * Import application pages.
 */
import { HomePage } from "@/pages/HomePage";
import { DemoPage } from "@/pages/DemoPage";
import LoginPage from "@/pages/LoginPage";
import { QuotePage } from "@/pages/QuotePage";
import { QuotesListPage } from "@/pages/QuotesListPage";
import { AdminPage } from "@/pages/AdminPage";
/**
 * Import global styles.
 */
import "@/index.css";
// Create a client
const queryClient = new QueryClient();
const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Root element not found. Make sure there is an element with id='root' in index.html");
}
ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
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
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);