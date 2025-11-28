/*
 * D1 Integration: Assumes DB binding in wrangler.jsonc.
 * Migrate DO data externally: `wrangler d1 execute luxquote-db --file=migrate.sql` with INSERT SELECT.
 * Schema as documented in README.md.
 */
import { Hono, type Context, type Next } from "hono";
import type { Env } from './core-utils';
import { UserEntity, ChatBoardEntity, QuoteEntity, OrderEntity, MaterialEntity, ArticleEntity, HelpRequestEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import { MOCK_MATERIALS } from "@shared/mock-data";
import { OrderStatus, type LoginUser, type Quote, type Order, type PricePackage, type Material, type Article, type HelpRequest } from "@shared/types";
export type AppContext = {
  Bindings: Env;
  Variables: {
    user: LoginUser;
  };
};
const adminAuthMiddleware = async (c: Context<AppContext>, next: Next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token || !token.startsWith('mock_jwt_')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }
  try {
    const userJson = atob(token.slice(9));
    const user: LoginUser = JSON.parse(userJson);
    if (!user) {
      return c.json({ success: false, error: 'Invalid token data' }, 401);
    }
    if (user.role !== 'admin') {
      return c.json({ success: false, error: 'Admin access required' }, 403);
    }
    c.set('user', user);
    await next();
  } catch (e) {
    return c.json({ success: false, error: 'Invalid token' }, 401);
  }
};
const userAuthMiddleware = async (c: Context<AppContext>, next: Next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token || !token.startsWith('mock_jwt_')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }
  try {
    const userJson = atob(token.slice(9));
    const user: LoginUser = JSON.parse(userJson);
    if (!user) {
      return c.json({ success: false, error: 'Invalid token data' }, 401);
    }
    c.set('user', user);
    await next();
  } catch (e) {
    return c.json({ success: false, error: 'Invalid token' }, 401);
  }
};
export function userRoutes(app: Hono<AppContext>) {
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
  // --- LuxQuote Public Routes ---
  app.get('/api/materials', async (c) => {
    await MaterialEntity.ensureSeed(c.env);
    const page = await MaterialEntity.list(c.env);
    return ok(c, page.items);
  });
  app.post('/api/help-requests', userAuthMiddleware, async (c) => {
    const user = c.get('user');
    const { message, quoteId } = await c.req.json<{ message: string; quoteId?: string }>();
    if (!message) return bad(c, 'Message is required');
    const newRequest: HelpRequest = {
      id: `hr_${crypto.randomUUID()}`,
      message,
      quoteId,
      userId: user.id,
      status: 'open',
      timestamp: Date.now(),
    };
    const created = await HelpRequestEntity.create(c.env, newRequest);
    return ok(c, created);
  });
  // --- LuxQuote User Routes ---
  app.get('/api/quotes', userAuthMiddleware, async (c) => {
    await QuoteEntity.ensureSeed(c.env);
    const page = await QuoteEntity.list(c.env);
    const sorted = page.items.sort((a, b) => b.createdAt - a.createdAt);
    return ok(c, sorted);
  });
  app.get('/api/quotes/:id', userAuthMiddleware, async (c) => {
    const id = c.req.param('id');
    const quoteEntity = new QuoteEntity(c.env, id);
    if (!(await quoteEntity.exists())) {
      return notFound(c, 'Quote not found');
    }
    const quote = await quoteEntity.getState();
    if (quote.thumbnail && quote.thumbnail.startsWith('data:image/svg+xml;base64,')) {
      quote.fileContent = quote.thumbnail;
    }
    return ok(c, quote);
  });
  app.post('/api/quotes', userAuthMiddleware, async (c) => {
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
      fileContent: body.thumbnail,
    };
    const created = await QuoteEntity.create(c.env, newQuote);
    return ok(c, created);
  });
  app.put('/api/quotes/:id', userAuthMiddleware, async (c) => {
    const id = c.req.param('id');
    const body = (await c.req.json()) as Partial<Quote>;
    const quoteEntity = new QuoteEntity(c.env, id);
    if (!(await quoteEntity.exists())) {
      return notFound(c, 'Quote not found');
    }
    if (body.thumbnail) {
        body.fileContent = body.thumbnail;
    }
    await quoteEntity.patch(body);
    const updatedQuote = await quoteEntity.getState();
    return ok(c, updatedQuote);
  });
  // --- Order & Stripe Routes ---
  app.post('/api/orders/stripe', userAuthMiddleware, async (c) => {
    const user = c.get('user');
    const { quoteId, quantity = 1 } = (await c.req.json()) as { quoteId: string, quantity?: number };
    if (!quoteId) return bad(c, 'quoteId is required');
    if (quantity < 1 || quantity > 100 || !Number.isInteger(quantity)) {
      return bad(c, 'Invalid quantity. Must be an integer between 1 and 100.');
    }
    const quoteEntity = new QuoteEntity(c.env, quoteId);
    if (!(await quoteEntity.exists())) return notFound(c, 'Quote not found');
    const quote = await quoteEntity.getState();
    const estimate = quote.estimate as PricePackage | undefined;
    if (!estimate || !estimate.total) return bad(c, 'Quote has no valid price estimate.');
    const origin = c.req.header('origin') || c.req.url.split('/api')[0];
    let session: { url: string; id: string; payment_intent: string } | null = null;
    let error: string | null = null;
    const stripeKey = (c.env as any).STRIPE_SECRET_KEY;
    if (!stripeKey || String(stripeKey).includes('HERE')) {
      session = {
        url: `${origin}/quotes?payment=success&session_id=cs_test_mock_${crypto.randomUUID()}&quantity=${quantity}`,
        id: `cs_test_mock_${crypto.randomUUID()}`,
        payment_intent: `pi_mock_${crypto.randomUUID()}`,
      };
    } else {
      // Production Stripe logic would go here
    }
    const newOrderData: Order = {
      id: `order_${crypto.randomUUID()}`,
      quoteId,
      userId: user.id,
      status: OrderStatus.Pending,
      submittedAt: Date.now(),
      paymentStatus: 'mock_pending',
      stripeSessionId: session!.id,
      paymentIntentId: session!.payment_intent,
      quantity,
    };
    const newOrder = await OrderEntity.create(c.env, newOrderData);
    return ok(c, { url: session!.url, orderId: newOrder.id, error, quantity });
  });
  // --- Admin Routes ---
  app.use('/api/admin/*', adminAuthMiddleware);
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
        const quantity = o.quantity || 1;
        return sum + (total * quantity);
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
  // Materials Admin CRUD
  app.get('/api/admin/materials', async (c) => ok(c, (await MaterialEntity.list(c.env)).items));
  app.post('/api/admin/materials', async (c) => {
    const body = await c.req.json<Material>();
    const newMat = { ...body, id: `mat_${crypto.randomUUID()}` };
    return ok(c, await MaterialEntity.create(c.env, newMat));
  });
  app.put('/api/admin/materials/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json<Partial<Material>>();
    const entity = new MaterialEntity(c.env, id);
    if (!await entity.exists()) return notFound(c, 'Material not found');
    await entity.patch(body);
    return ok(c, await entity.getState());
  });
  app.delete('/api/admin/materials/:id', async (c) => {
    const id = c.req.param('id');
    const deleted = await MaterialEntity.delete(c.env, id);
    return ok(c, { deleted });
  });
  // Articles Admin CRUD
  app.get('/api/admin/articles', async (c) => ok(c, (await ArticleEntity.list(c.env)).items));
  app.post('/api/admin/articles', async (c) => {
    const body = await c.req.json<Partial<Article>>();
    const newArticle: Article = { id: `art_${crypto.randomUUID()}`, createdAt: Date.now(), title: body.title || '', content: body.content || '' };
    return ok(c, await ArticleEntity.create(c.env, newArticle));
  });
  app.put('/api/admin/articles/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json<Partial<Article>>();
    const entity = new ArticleEntity(c.env, id);
    if (!await entity.exists()) return notFound(c, 'Article not found');
    await entity.patch(body);
    return ok(c, await entity.getState());
  });
  app.delete('/api/admin/articles/:id', async (c) => {
    const id = c.req.param('id');
    return ok(c, { deleted: await ArticleEntity.delete(c.env, id) });
  });
  // Support Admin
  app.get('/api/admin/support', async (c) => {
    const page = await HelpRequestEntity.list(c.env);
    return ok(c, page.items.sort((a, b) => b.timestamp - a.timestamp));
  });
  app.patch('/api/admin/support/:id', async (c) => {
    const id = c.req.param('id');
    const { status } = await c.req.json<{ status: 'open' | 'resolved' }>();
    const entity = new HelpRequestEntity(c.env, id);
    if (!await entity.exists()) return notFound(c, 'Request not found');
    await entity.updateStatus(status);
    return ok(c, await entity.getState());
  });
  // Pricing & Stripe Admin
  app.get('/api/admin/pricing', (c) => ok(c, { packages: [] /* Mock */ }));
  app.put('/api/admin/pricing', async (c) => ok(c, { success: true }));
  app.post('/api/admin/stripe/test', (c) => {
    const stripeKey = (c.env as any).STRIPE_SECRET_KEY;
    const connected = stripeKey && !String(stripeKey).includes('HERE');
    return ok(c, { connected });
  });
}