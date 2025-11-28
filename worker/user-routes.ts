import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, ChatBoardEntity, QuoteEntity, OrderEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import { MOCK_MATERIALS } from "@shared/mock-data";
import { OrderStatus } from "@shared/types";
import type { Quote, Order } from "@shared/types";
export function userRoutes(app: Hono<{ Bindings: Env }>) {
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
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer mock_token')) {
      console.warn('Auth header missing or invalid for POST /api/quotes');
    }
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
  // --- Order Routes ---
  app.post('/api/orders', async (c) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) return c.json({ success: false, error: 'Unauthorized' }, 401);
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
  app.get('/api/admin/orders', async (c) => {
    // In a real app, this would be a proper admin role check
    const authHeader = c.req.header('Authorization');
    if (!authHeader) return c.json({ success: false, error: 'Unauthorized' }, 401);
    await OrderEntity.ensureSeed(c.env);
    const page = await OrderEntity.list(c.env);
    const sorted = page.items.sort((a, b) => b.submittedAt - a.submittedAt);
    return ok(c, sorted);
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