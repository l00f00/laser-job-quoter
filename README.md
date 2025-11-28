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
- **Saved Quotes**: Persist and list quotes with thumbnails, quick actions (duplicate, export, help), and mock persistence using Durable Objects.
- **Responsive & Accessible**: Mobile-first design with smooth animations, micro-interactions, and full accessibility compliance.
- **Client-Side Estimator**: Heavy computation (metrics extraction, pricing) happens in the browser for instant feedback; backend handles persistence.

Built with obsessive attention to visual excellence, LuxQuote delivers a delightful user experience for laser fabrication quoting.

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS v3, shadcn/ui (Radix primitives), Framer Motion (animations), Zustand (state management), React Router, Sonner (toasts), Recharts (charts).
- **Backend**: Cloudflare Workers, Hono (routing), Durable Objects (persistence via single GlobalDurableObject).
- **Utilities**: Lucide React (icons), @tanstack/react-query (data fetching), Zod (validation), Immer (immutable updates).
- **Build & Dev**: Vite, Bun (package manager), Wrangler (Cloudflare deployment).
- **No Additional Dependencies**: Strictly uses preconfigured packages; no external services beyond Cloudflare ecosystem.

## Quick Start

### Prerequisites

- Node.js (v18+), but we recommend using Bun for faster installs and runs.
- Cloudflare account (free tier sufficient for development).
- Wrangler CLI installed: `bun add -g wrangler`.

### Installation

1. Clone the repository:
   ```
   git clone <your-repo-url>
   cd luxquote
   ```

2. Install dependencies using Bun:
   ```
   bun install
   ```

3. Generate TypeScript types for Cloudflare bindings:
   ```
   bun run cf-typegen
   ```

### Local Development

1. Start the development server:
   ```
   bun run dev
   ```
   The app will be available at `http://localhost:3000` (or the port specified in your environment).

2. In a separate terminal, start the Cloudflare Worker (for API endpoints):
   ```
   bun run dev:worker
   ```
   Or deploy to preview: `wrangler dev`.

3. Open `http://localhost:3000` in your browser. The app includes a hero landing page and navigates to the Quote Builder.

### Usage Examples

- **Create a Quote**:
  1. Click "Start a Quote" on the home page.
  2. Upload an image or SVG via drag-and-drop.
  3. Select material and thickness from the sidebar.
  4. Toggle job type (engrave/cut/both) and adjust physical size.
  5. View live pricing packages in the right panel.
  6. Click "Request Quote" to save or "Ask for Help" for support.

- **View Saved Quotes**:
  Navigate to the Quotes List page to see thumbnails, prices, and actions like duplicate or export (CSV/PDF).

- **Help Modal**:
  Click the floating help button to access tips, constraints, and submit a support request (posts to `/api/quotes/help`).

All interactions are client-side for estimates; persistence uses `/api/quotes` endpoints.

## Development Instructions

### Project Structure

- `src/`: React frontend (pages, components, hooks, lib).
- `worker/`: Cloudflare Worker backend (routes in `user-routes.ts`, entities in `entities.ts`).
- `shared/`: Shared types and mock data.
- Preinstalled shadcn/ui components in `src/components/ui/*`.

### Adding Features

- **Frontend**: Extend `src/pages/` for new views (e.g., QuoteBuilder.tsx). Use Zustand for local state (primitive selectors only to avoid loops). Import shadcn components from `@/components/ui/*`.
- **Backend**: Add routes in `worker/user-routes.ts` using entity patterns (e.g., extend `IndexedEntity` for QuoteEntity). Use `ApiResponse<T>` for all responses.
- **State Management**: Follow Zustand rules—no object selectors, use individual primitives and `useMemo` for derived values.
- **Styling**: Tailwind v3-safe; use utilities from `tailwind.config.js` (custom colors: orange #F58125, indigo #6366F1, neutral #111827).
- **Testing**: Lint with `bun run lint`. No e2e tests; manual verification recommended.
- **Avoid Infinite Loops**: No setState in render; stable dependencies in effects; primitive selectors in Zustand.

### Environment Variables

No custom env vars needed for local dev. For production, set via Wrangler secrets if extending (e.g., Stripe keys in Phase 3).

## Deployment

Deploy to Cloudflare Workers for global edge performance. The template is preconfigured.

1. Login to Wrangler:
   ```
   wrangler login
   ```

2. Build the project:
   ```
   bun run build
   ```

3. Deploy:
   ```
   bun run deploy
   ```
   Or use `wrangler deploy` directly.

The frontend assets are served as a static SPA, with API routes handled by the Worker. Preview deployments are automatic via Wrangler.

For custom domains or advanced config, edit `wrangler.jsonc` (but avoid modifying bindings/migrations).

[![[cloudflarebutton]]](https://workers.cloudflare.com)

## Contributing

1. Fork the repo and create a feature branch.
2. Install dependencies with Bun and run `bun run dev`.
3. Make changes, lint (`bun run lint`), and test locally.
4. Commit with clear messages and open a PR.

Focus on visual polish, responsiveness, and avoiding runtime errors (e.g., no update depth exceeded).

## License

MIT License. See [LICENSE](LICENSE) for details.

## Support

- Issues: Open a GitHub issue for bugs or features.
- Help Modal: In-app support requests post to backend for human review.
- Cloudflare Docs: Refer to Workers and Durable Objects documentation for backend extensions.

Built with ❤️ by Cloudflare's rapid development team.