/**
 * Main application entrypoint
 *
 * Added route for /login which renders the modal-only LoginPage.
 *
 * Keep this file minimal and consistent with the project's React Router v6 setup.
 */
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
/**
 * Import application pages.
 * - HomePage and DemoPage are existing pages in the template.
 * - LoginPage is the new page we added which renders the LoginModal.
 */
import HomePage from "@/pages/HomePage";
import DemoPage from "@/pages/DemoPage";
import LoginPage from "@/pages/LoginPage";
/**
 * Import global styles. Adjust path if your project uses a different stylesheet entry.
 * Most Vite + Tailwind templates include an index.css at the project src root.
 */
import "@/index.css";
const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Root element not found. Make sure there is an element with id='root' in index.html");
}
ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Main application routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/demo" element={<DemoPage />} />
        {/* Login modal-only route */}
        <Route path="/login" element={<LoginPage />} />
        {/* Fallback: reuse HomePage for unmatched routes (adjust if you have a NotFound page) */}
        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);