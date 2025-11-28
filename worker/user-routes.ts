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
    const token = `mock_jwt_${btoa(email + ':' + Date.now())}`;
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
    const mockSession = {
      id: `cs_test_${crypto.randomUUID().replace(/-/g, '')}`,
      url: `${c.req.url.split('/api')[0]}/quotes?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      metadata: { quote_id: quote.id },
    };
    return ok(c, { id: mockSession.id, url: mockSession.url });
  });
  app.post('/api/stripe/webhook', async (c) => {
    const event = await c.req.json();
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const quoteId = session.metadata.quote_id;
      if (quoteId) {
        const allOrders = (await OrderEntity.list(c.env)).items;
        const orderToUpdate = allOrders.find(o => o.quoteId === quoteId);
        if (orderToUpdate) {
          const orderEntity = new OrderEntity(c.env, orderToUpdate.id);
          await orderEntity.updateStatus(OrderStatus.Paid);
          console.log(`Order ${orderEntity.id} for quote ${quoteId} marked as paid.`);
        }
      }
    }
    return ok(c, { received: true });
  });
  // --- Admin Routes ---
  app.get('/api/admin/orders', async (c) => {
    if (c.env.DB) {
      try {
        const { results } = await c.env.DB.prepare('SELECT * FROM orders ORDER BY submittedAt DESC').all<Order>();
        return ok(c, results);
      } catch (e) {
        console.error("D1 query for orders failed:", e);
        // Fallback to DO
      }
    }
    await OrderEntity.ensureSeed(c.env);
    const page = await OrderEntity.list(c.env);
    const sorted = page.items.sort((a, b) => b.submittedAt - a.submittedAt);
    return ok(c, sorted);
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
    if (c.env.DB) {
      try {
        const revenueResult = await c.env.DB.prepare("SELECT SUM(CAST(json_extract(q.estimate, '$.total') AS REAL)) as total FROM orders o JOIN quotes q ON o.quote_id = q.id WHERE o.status = ?1").bind('paid').first<{ total: number }>();
        const orderCountResult = await c.env.DB.prepare("SELECT COUNT(*) as count FROM orders").first<{ count: number }>();
        const materialsResult = await c.env.DB.prepare("SELECT materialId as name, COUNT(*) as value FROM quotes GROUP BY materialId ORDER BY value DESC LIMIT 5").all<{ name: string, value: number }>();
        return ok(c, {
          totalRevenue: revenueResult?.total || 0,
          orderCount: orderCountResult?.count || 0,
          topMaterials: materialsResult.results || [],
        });
      } catch (e) {
        console.error("D1 analytics query failed:", e);
        // Fallback to DO
      }
    }
    // DO-based fallback analytics
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