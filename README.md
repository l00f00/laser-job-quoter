# LuxQuote — Laser Job Quoter
[![[cloudflarebutton]]](https://workers.cloudflare.com)
LuxQuote is a visually-rich, polished single-page web application for creating instant quotes for laser jobs (cutting, engraving, or both). Users upload raster images or vector SVGs, choose material, thickness, and finish, define whether the job is engraving, cutting, or a combo, and receive multiple price options (fast, standard, premium) with clear breakdowns. The system provides a live preview of the artwork scaled to the chosen physical size, validates critical manufacturability constraints, and computes detailed cost breakdowns. A prominent Help button opens a modal with guided tips and a request-for-help form.
## Key Features
- **Instant Quote Generation**: Upload artwork (PNG/JPG/SVG) and get precise pricing with breakdowns for material, cutting, engraving, setup, and finishing fees.
- **Live Artwork Preview**: Real-time SVG rendering with physical size controls, measurement overlays, and manufacturability validation (e.g., minimum feature size, kerf compensation).
- **Material Library**: Select from various materials with swatches, properties (density, cost, kerf), and thickness options.
- **Job Type Flexibility**: Toggle between engraving, cutting, or both, with automatic cost calculations based on area, length, or coverage.
- **Pricing Packages**: Choose from Economy, Standard, or Express options with estimated lead times and adjustable speed factors.
- **Help & Support**: Floating help modal with manufacturing tips, constraints, and a form to request human review via backend submission.
- **Saved Quotes & Editing**: Persist and list quotes with thumbnails, quick actions (duplicate, export, edit), and persistence using Durable Objects.
- **Admin Dashboard**: A role-protected area to manage orders, view analytics, and oversee payments.
- **Responsive & Accessible**: Mobile-first design with smooth animations, micro-interactions, and full accessibility compliance.
## Technology Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS v3, shadcn/ui, Framer Motion, Zustand, React Router, Sonner, Recharts.
- **Backend**: Cloudflare Workers, Hono, Durable Objects, Cloudflare D1 (hybrid model).
- **Utilities**: Lucide React, @tanstack/react-query, Zod, Immer.
- **Build & Dev**: Vite, Bun, Wrangler.
## Quick Start
### Prerequisites
- Node.js (v18+), but we recommend using Bun.
- Cloudflare account.
- Wrangler CLI installed: `bun add -g wrangler`.
### Installation
1. Clone the repository: `git clone <your-repo-url>`
2. Install dependencies: `bun install`
3. Generate types: `bun run cf-typegen`
### Local Development
1. Start the frontend dev server: `bun run dev`
2. In a separate terminal, start the Cloudflare Worker: `wrangler dev`
3. Open `http://localhost:3000` in your browser.
## Testing the Application (End-to-End Flow)
1.  **Login as User**: Use `demo@luxquote.com` / `demo123`.
2.  **Create a Quote**: Go to `/quote`, upload a design, select a material, and click "Save Quote".
3.  **View Saved Quotes**: Navigate to `/quotes` to see your saved project.
4.  **Edit a Quote**: Click "Edit" on the quote card, make a change, and click "Update Quote".
5.  **Checkout**: From the quote builder, click "Pay with Stripe" to simulate the checkout flow. You will be redirected to a mock success page.
6.  **Login as Admin**: Log out and log back in with `admin@luxquote.com` / `admin123`.
7.  **Admin View**: Go to `/admin`.
    - In the **Orders** tab, find the order you created and change its status from `pending` to `processing`.
    - In the **Analytics** tab, observe the updated revenue and material stats.
    - In the **Payments** tab, view the payment status and link to the mock Stripe session.
8.  **Verify No Type Errors**: Run `bun run build && tsc --noEmit` to confirm the project is type-safe.
## Admin Features
### Credentials
- **Admin**: `admin@luxquote.com` / `admin123`
### Dashboard Tabs
- **Orders**: View/update orders, download CSV/SVG per row.
- **Analytics**: Revenue/charts.
- **Payments**: Status/sync.
### Admin Tools (Sidebar if logged as admin)
- **/admin/materials**: CRUD for materials.
- **/admin/pricing**: Edit package multipliers/lead times.
- **/admin/stripe**: Test secrets config.
- **/admin/help-center**: Manage help articles.
- **/admin/support**: View/resolve help requests.
### Endpoints
- **POST /api/help-requests**: `{message, quoteId?}` → HelpRequestEntity.
- **/api/admin/materials**: GET/POST/PUT/:id/DELETE/:id (admin auth).
- **/api/admin/articles**: Similar CRUD.
- **/api/admin/support**: GET filtered help requests.
- **/api/admin/pricing**: GET/PUT packages.
- **/api/admin/stripe/test**: POST for validation.
- **GET /api/quotes/:id**: Now includes `fileContent` for SVG.
### User Features
- **QuoteBuilder**: Scale slider (50-200%), cut masking.
- **HelpButton**: Submits to `/api/help-requests` with `quoteId` if saved.
## Production Deployment
Deploy to Cloudflare Workers for global edge performance.
1.  **Login to Wrangler**: `wrangler login`
2.  **Configure Production Secrets**:
    Set your Stripe secret key in your production environment. **Never commit secrets to `wrangler.jsonc`**.
    ```bash
    wrangler secret put STRIPE_SECRET_KEY
    ```
    For webhook security, also set your webhook signing secret:
    ```bash
    wrangler secret put STRIPE_WEBHOOK_SECRET
    ```
3.  **Build the project**: `bun run build`
4.  **Deploy**: `wrangler deploy`
## Production Notes
### Webhook Security
The provided `/api/stripe/webhook` endpoint is a mock. For production, you must verify the Stripe signature to prevent fraudulent requests.
### Scaling with D1
The application uses Durable Objects for quote and order storage. For larger-scale analytics and relational queries, migrating to Cloudflare D1 is recommended.
### Monitoring
Leverage the Cloudflare dashboard for monitoring your application:
- **Workers & Pages Analytics**: View request counts, CPU time, and invocation metrics.
- **Logs**: Use `wrangler tail` for real-time logs or view persisted logs in the dashboard to debug issues.
- **Durable Objects**: Inspect DO storage and metrics directly from the dashboard.
[![[cloudflarebutton]]](https://workers.cloudflare.com)