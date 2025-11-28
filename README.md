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
## Authentication
LuxQuote uses mock authentication for demo purposes.
### Credentials
- **User**: `email: demo@luxquote.com`, `password: demo123` (role: user)
- **Admin**: `email: admin@luxquote.com`, `password: admin123` (role: admin)
### API Login
Log in programmatically by sending a POST request to `/api/login`.
**Request:**
```json
{
  "email": "demo@luxquote.com",
  "password": "demo123"
}
```
**Success Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_demo_01",
      "email": "demo@luxquote.com",
      "name": "Demo User",
      "role": "user"
    },
    "token": "mock_jwt_..."
  }
}
```
Tokens are stored in `localStorage` (`luxquote_auth_token`, `luxquote_user`) for session persistence.
## Admin Dashboard
The admin dashboard is a role-protected area for managing the application.
- **Access**: Navigate to `/admin` after logging in with an admin account. Non-admin users will see an "Access Denied" message.
- **Features**:
  - **Orders Tab**: View a table of all submitted orders. You can edit the status of each order (e.g., from `pending` to `processing` or `shipped`).
  - **Analytics Tab**: View key metrics like total revenue and total order count. A pie chart visualizes the most popular materials used in quotes.
  - **Payments Tab**: See a list of orders with their payment status and links to the corresponding Stripe payment details.
## Quote Editing
Saved quotes can be easily modified.
1.  Navigate to `/quotes` to see your list of saved quotes.
2.  Click the "Edit" button on any quote card.
3.  This will take you to `/quote/:id`, where the Quote Builder will be pre-filled with all the data from that quote.
4.  You can change the material, job type, or even upload a new design.
5.  Click "Update Quote" to save your changes via a `PUT` request to `/api/quotes/:id`.
## Backend Persistence (Hybrid DO + D1)
The application uses a hybrid model for persistence, leveraging both Durable Objects (DO) for high-frequency writes and D1 for relational queries and analytics.
- **Durable Objects**: Used for creating and updating individual quotes and orders, providing strong consistency per object.
- **Cloudflare D1**: A SQL database used for listing orders and running analytical queries across all data, which is difficult with DOs alone.
### D1 Setup (Manual)
To enable D1-powered features, you need to set up a D1 database and bind it to the worker.
1.  **Create the D1 Database**:
    ```bash
    wrangler d1 create luxquote-db
    ```
2.  **Bind the Database in `wrangler.jsonc`**:
    Add the following to your `wrangler.jsonc` file. Replace `<YOUR_DATABASE_ID>` with the ID from the previous step.
    ```json
    "d1_databases": [
      {
        "binding": "DB",
        "database_name": "luxquote-db",
        "database_id": "<YOUR_DATABASE_ID>"
      }
    ]
    ```
3.  **Create Schema**:
    Create a file `schema.sql` and run `wrangler d1 execute luxquote-db --file=schema.sql`.
    ```sql
    -- schema.sql
    CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT UNIQUE, name TEXT, role TEXT);
    CREATE TABLE quotes (id TEXT PRIMARY KEY, user_id TEXT, title TEXT, material_id TEXT, thickness_mm REAL, job_type TEXT, physical_width_mm REAL, physical_height_mm REAL, estimate TEXT, thumbnail TEXT, status TEXT, created_at INTEGER, FOREIGN KEY(user_id) REFERENCES users(id));
    CREATE TABLE orders (id TEXT PRIMARY KEY, quote_id TEXT, user_id TEXT, status TEXT, submitted_at INTEGER, payment_status TEXT, stripe_session_id TEXT, payment_intent_id TEXT, FOREIGN KEY(quote_id) REFERENCES quotes(id), FOREIGN KEY(user_id) REFERENCES users(id));
    ```
4.  **Migrate Data (Optional)**:
    To move existing data from DOs to D1, you would need a custom script to read from DOs and `INSERT` into D1.
## Stripe Integration
- **Checkout**: Clicking "Pay with Stripe" sends a POST request to `/api/orders/stripe`, which creates a mock Stripe Checkout session and redirects the user.
- **Webhook**: A mock webhook endpoint at `/api/stripe/webhook` listens for `checkout.session.completed` events to update an order's status to `paid`.
## Testing the Application
1.  **Login as User**: Use `demo@luxquote.com` / `demo123`.
2.  **Create a Quote**: Go to `/quote`, upload a design, select a material, and click "Save Quote".
3.  **View Saved Quotes**: Navigate to `/quotes` to see your saved project.
4.  **Edit a Quote**: Click "Edit" on the quote card, make a change, and click "Update Quote".
5.  **Checkout**: From the quote builder, click "Pay with Stripe" to simulate the checkout flow.
6.  **Login as Admin**: Log out and log back in with `admin@luxquote.com` / `admin123`.
7.  **Admin View**: Go to `/admin`.
    - In the **Orders** tab, find the order you created and change its status.
    - In the **Analytics** tab, observe the updated revenue and material stats.
    - In the **Payments** tab, view the payment status.
## Deployment
Deploy to Cloudflare Workers for global edge performance.
1.  Login to Wrangler: `wrangler login`
2.  Build the project: `bun run build`
3.  Deploy: `wrangler deploy`
[![[cloudflarebutton]]](https://workers.cloudflare.com)