/*
 * D1 Integration: Assumes DB binding in wrangler.jsonc.
 * Migrate DO data externally: `wrangler d1 execute luxquote-db --file=migrate.sql` with INSERT SELECT.
 * Schema as documented in README.md.
 */
import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, ChatBoardEntity, QuoteEntity, OrderEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import { MOCK_MATERIALS } from "@shared/mock-data";
import { OrderStatus, type LoginUser, type Quote, type Order, type PricePackage } from "@shared/types";
import type { D1Database } from "@cloudflare/workers-types";
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // --- Auth Routes ---
  app.post('/api/login', async (c) => {
    const { email, password } = await c.req.json<{ email?: string, password?: string }>();
    if (!isStr(email) || !isStr(password)) return bad(c, 'Email and password required');
    const lowerEmail = email.toLowerCase();
    let user: LoginUser | null = null;
    if (lowerEmail === 'demo@luxquote.com' && password === 'demo123') {
      user = { id: 'user_demo_01', email, name: 'Demo User', role: 'user' };
    } else if (lowerEmail === 'admin@luxquote.com' && password === 'admin123') {
      user = { id: 'admin_01', email, name: 'Admin User', role: 'admin' };
    }
    if (!user) {
      return c.json({ success: false, error: 'Invalid credentials' }, 401);
    }
    const token = `mock_jwt_${btoa(JSON.stringify(user))}`;
    return ok(c, { user, token });
  });
  // --- LuxQuote Routes ---
  app.get('/api/materials', (c) => {
    return ok(c, MOCK_MATERIALS);
  });
  app.get('/api/quotes', async (c) => {
    await QuoteEntity.ensureSeed(c.env);
    const page = await QuoteEntity.list(c.env);
    const sorted = page.items.sort((a, b) => b.createdAt - a.createdAt);
    return ok(c, sorted);
  });
  app.get('/api/quotes/:id', async (c) => {
    const id = c.req.param('id');
    const quoteEntity = new QuoteEntity(c.env, id);
    if (!(await quoteEntity.exists())) {
      return notFound(c, 'Quote not found');
    }
    const quote = await quoteEntity.getState();
    return ok(c, quote);
  });
  app.post('/api/quotes', async (c) => {
    const body = (await c.req.json()) as Partial<Quote>;
    if (!body.materialId || !body.estimate) {
      return bad(c, 'Missing required quote data');
    }
    const newQuote: Quote = {
      id: `quote_${crypto.randomUUID()}`,
      title: body.title || "Untitled Quote",
      createdAt: Date.now(),
      status: 'draft',
      materialId: body.materialId,
      thicknessMm: body.thicknessMm || 0,
      jobType: body.jobType || 'cut',
      physicalWidthMm: body.physicalWidthMm || 0,
      physicalHeightMm: body.physicalHeightMm || 0,
      estimate: body.estimate,
      thumbnail: body.thumbnail,
    };
    const created = await QuoteEntity.create(c.env, newQuote);
    return ok(c, created);
  });
  app.put('/api/quotes/:id', async (c) => {
    const id = c.req.param('id');
    const body = (await c.req.json()) as Partial<Quote>;
    const quoteEntity = new QuoteEntity(c.env, id);
    if (!(await quoteEntity.exists())) {
      return notFound(c, 'Quote not found');
    }
    await quoteEntity.patch(body);
    const updatedQuote = await quoteEntity.getState();
    return ok(c, updatedQuote);
  });
  // --- Order & Stripe Routes ---
  app.post('/api/orders', async (c) => {
    const { quoteId } = (await c.req.json()) as { quoteId: string };
    if (!quoteId) return bad(c, 'quoteId is required');
    const quote = new QuoteEntity(c.env, quoteId);
    if (!(await quote.exists())) return notFound(c, 'Quote not found');
    const newOrder: Order = {
      id: `order_${crypto.randomUUID()}`,
      quoteId,
      userId: 'user_demo_01', // Mock user ID
      status: OrderStatus.Pending,
      submittedAt: Date.now(),
      paymentStatus: 'mock_pending',
    };
    const created = await OrderEntity.create(c.env, newOrder);
    return ok(c, created);
  });
  app.post('/api/orders/stripe', async (c) => {
    const { quoteId } = (await c.req.json()) as { quoteId: string };
    if (!quoteId) return bad(c, 'quoteId is required');
    const quoteEntity = new QuoteEntity(c.env, quoteId);
    if (!(await quoteEntity.exists())) return notFound(c, 'Quote not found');
    const quote = await quoteEntity.getState();
    const estimate = quote.estimate as PricePackage | undefined;
    if (!estimate || !estimate.total) return bad(c, 'Quote has no valid price estimate.');
    const origin = c.req.header('origin') || c.req.url.split('/api')[0];
    let session: { url: string; id: string; payment_intent: string } | null = null;
    let error: string | null = null;
    try {
      const stripeKey = (c.env as any).STRIPE_SECRET_KEY;
      if (!stripeKey) throw new Error("Stripe key not configured.");
      const params = new URLSearchParams();
      params.append('mode', 'payment');
      params.append('line_items[0][price_data][currency]', 'usd');
      params.append('line_items[0][price_data][product_data][name]', `LuxQuote Order for: ${quote.title}`);
      params.append('line_items[0][price_data][product_data][description]', `Material: ${quote.materialId}, ${quote.thicknessMm}mm`);
      params.append('line_items[0][price_data][unit_amount]', String(Math.round(estimate.total * 100)));
      params.append('line_items[0][quantity]', '1');
      params.append('success_url', `${origin}/quotes?payment=success&session_id={CHECKOUT_SESSION_ID}`);
      params.append('cancel_url', `${origin}/quote/${quoteId}`);
      params.append('metadata[quote_id]', quoteId);
      const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded', 'Stripe-Version': '2023-10-16' },
        body: params.toString(),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Stripe API error: ${res.status} ${errText}`);
      }
      session = await res.json();
    } catch (e) {
      console.error('Stripe session creation failed:', e);
      error = (e as Error).message;
    }
    if (!session) {
      session = {
        url: `${origin}/quotes?payment=success&session_id=cs_test_mock_${crypto.randomUUID()}`,
        id: `cs_test_mock_${crypto.randomUUID()}`,
        payment_intent: `pi_mock_${crypto.randomUUID()}`,
      };
    }
    const newOrderData: Order = {
      id: `order_${crypto.randomUUID()}`,
      quoteId,
      userId: 'user_demo_01', // Mocked user ID
      status: OrderStatus.Pending,
      submittedAt: Date.now(),
      paymentStatus: 'mock_pending',
      stripeSessionId: session.id,
      paymentIntentId: session.payment_intent,
    };
    const newOrder = await OrderEntity.create(c.env, newOrderData);
    return ok(c, { url: session.url, orderId: newOrder.id, error });
  });
  app.post('/api/stripe/webhook', async (c) => {
    const event = await c.req.json();
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const quoteId = session.metadata.quote_id;
      if (quoteId) {
        const allOrders = (await OrderEntity.list(c.env)).items;
        const orderToUpdate = allOrders.find(o => o.quoteId === quoteId || o.stripeSessionId === session.id);
        if (orderToUpdate) {
          const orderEntity = new OrderEntity(c.env, orderToUpdate.id);
          await orderEntity.patch({
            status: OrderStatus.Paid,
            paymentStatus: 'mock_paid',
            stripeSessionId: session.id,
            paymentIntentId: session.payment_intent,
          });
          console.log(`Order ${orderEntity.id} for quote ${quoteId} marked as paid.`);
        }
      }
    }
    return ok(c, { received: true });
  });
  // --- Admin Routes ---
  app.get('/api/admin/orders', async (c) => {
    const page = await OrderEntity.list(c.env);
    const sorted = page.items.sort((a, b) => b.submittedAt - a.submittedAt).slice(0, 50);
    const enrichedOrders = await Promise.all(sorted.map(async (order) => {
      const quoteEntity = new QuoteEntity(c.env, order.quoteId);
      if (await quoteEntity.exists()) {
        const quote = await quoteEntity.getState();
        order.quote = {
          title: quote.title,
          materialId: quote.materialId,
          jobType: quote.jobType,
          physicalWidthMm: quote.physicalWidthMm,
          physicalHeightMm: quote.physicalHeightMm,
          estimate: quote.estimate as PricePackage,
          thumbnail: quote.thumbnail,
        };
      }
      return order;
    }));
    return ok(c, enrichedOrders);
  });
  app.patch('/api/orders/:id', async (c) => {
    const id = c.req.param('id');
    const { status } = (await c.req.json()) as { status: OrderStatus };
    if (!status || !Object.values(OrderStatus).includes(status)) {
      return bad(c, 'Invalid status provided');
    }
    const orderEntity = new OrderEntity(c.env, id);
    if (!(await orderEntity.exists())) {
      return notFound(c, 'Order not found');
    }
    await orderEntity.updateStatus(status);
    return ok(c, await orderEntity.getState());
  });
  app.get('/api/admin/analytics', async (c) => {
    const ordersPage = await OrderEntity.list(c.env);
    const quotesPage = await QuoteEntity.list(c.env);
    const quotesById = new Map(quotesPage.items.map(q => [q.id, q]));
    const orders = ordersPage.items;
    const totalRevenue = orders
      .filter(o => o.status === 'paid')
      .reduce((sum, o) => {
        const quote = quotesById.get(o.quoteId);
        const total = (quote?.estimate as PricePackage)?.total || 0;
        return sum + total;
      }, 0);
    const materialCounts = quotesPage.items.reduce((acc, quote) => {
      acc[quote.materialId] = (acc[quote.materialId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topMaterials = Object.entries(materialCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    return ok(c, {
      totalRevenue,
      orderCount: orders.length,
      topMaterials,
    });
  });
  // --- Template Demo Routes (can be removed later) ---
  app.get('/api/users', async (c) => {
    await UserEntity.ensureSeed(c.env);
    return ok(c, await UserEntity.list(c.env));
  });
  app.post('/api/users', async (c) => {
    const { name } = (await c.req.json()) as { name?: string };
    if (!name?.trim()) return bad(c, 'name required');
    return ok(c, await UserEntity.create(c.env, { id: crypto.randomUUID(), name: name.trim() }));
  });
  app.get('/api/chats', async (c) => {
    await ChatBoardEntity.ensureSeed(c.env);
    return ok(c, await ChatBoardEntity.list(c.env));
  });
  app.post('/api/chats', async (c) => {
    const { title } = (await c.req.json()) as { title?: string };
    if (!title?.trim()) return bad(c, 'title required');
    const created = await ChatBoardEntity.create(c.env, { id: crypto.randomUUID(), title: title.trim(), messages: [] });
    return ok(c, { id: created.id, title: created.title });
  });
  app.get('/api/chats/:chatId/messages', async (c) => {
    const chat = new ChatBoardEntity(c.env, c.req.param('chatId'));
    if (!await chat.exists()) return notFound(c, 'chat not found');
    return ok(c, await chat.listMessages());
  });
  app.post('/api/chats/:chatId/messages', async (c) => {
    const chatId = c.req.param('chatId');
    const { userId, text } = (await c.req.json()) as { userId?: string; text?: string };
    if (!isStr(userId) || !text?.trim()) return bad(c, 'userId and text required');
    const chat = new ChatBoardEntity(c.env, chatId);
    if (!await chat.exists()) return notFound(c, 'chat not found');
    return ok(c, await chat.sendMessage(userId, text.trim()));
  });
}