/**
 * Entities with hybrid DO/D1 support.
 * Assumes D1 binding `DB` is present in `env`. Falls back to DO if not.
 */
import { IndexedEntity } from "./core-utils";
import type { User, Chat, ChatMessage, Quote, Material, Order, Article, HelpRequest } from "@shared/types";
import { OrderStatus } from "@shared/types";
import { MOCK_CHAT_MESSAGES, MOCK_CHATS, MOCK_USERS, MOCK_QUOTES, MOCK_MATERIALS } from "@shared/mock-data";
import type { Env } from './core-utils';
// USER ENTITY
export class UserEntity extends IndexedEntity<User> {
  static readonly entityName = "user";
  static readonly indexName = "users";
  static readonly initialState: User = { id: "", name: "" };
  static seedData = MOCK_USERS;
}
// CHAT BOARD ENTITY
export type ChatBoardState = Chat & { messages: ChatMessage[] };
const SEED_CHAT_BOARDS: ChatBoardState[] = MOCK_CHATS.map(c => ({
  ...c,
  messages: MOCK_CHAT_MESSAGES.filter(m => m.chatId === c.id),
}));
export class ChatBoardEntity extends IndexedEntity<ChatBoardState> {
  static readonly entityName = "chat";
  static readonly indexName = "chats";
  static readonly initialState: ChatBoardState = { id: "", title: "", messages: [] };
  static seedData = SEED_CHAT_BOARDS;
  async listMessages(): Promise<ChatMessage[]> {
    const { messages } = await this.getState();
    return messages;
  }
  async sendMessage(userId: string, text: string): Promise<ChatMessage> {
    const msg: ChatMessage = { id: crypto.randomUUID(), chatId: this.id, userId, text, ts: Date.now() };
    await this.mutate(s => ({ ...s, messages: [...s.messages, msg] }));
    return msg;
  }
}
// --- LuxQuote Entities ---
// QUOTE ENTITY
export class QuoteEntity extends IndexedEntity<Quote> {
  static readonly entityName = "quote";
  static readonly indexName = "quotes";
  static readonly initialState: Quote = {
    id: "",
    title: "New Quote",
    createdAt: 0,
    materialId: "",
    thicknessMm: 0,
    jobType: 'cut',
    physicalWidthMm: 0,
    physicalHeightMm: 0,
    estimate: {},
    status: 'draft',
  };
  static seedData = MOCK_QUOTES;
}
// ORDER ENTITY
export class OrderEntity extends IndexedEntity<Order> {
  static readonly entityName = "order";
  static readonly indexName = "orders";
  static readonly initialState: Order = {
    id: "",
    quoteId: "",
    userId: "",
    status: OrderStatus.Pending,
    submittedAt: 0,
    paymentStatus: 'mock_pending',
    stripeSessionId: '',
    paymentIntentId: '',
  };
  static seedData = [];
  async updatePaymentStatus(status: 'mock_paid'): Promise<void> {
    await this.patch({ paymentStatus: status, status: OrderStatus.Paid });
  }
  async updateStripeSession(sessionId: string, intentId: string): Promise<void> {
    await this.patch({ stripeSessionId: sessionId, paymentIntentId: intentId });
  }
  async updateStatus(status: OrderStatus): Promise<void> {
    await this.patch({ status });
  }
}
// MATERIAL ENTITY
export class MaterialEntity extends IndexedEntity<Material> {
  static readonly entityName = "material";
  static readonly indexName = "materials";
  static readonly initialState: Material = {
    id: "",
    name: "",
    description: "",
    colorSwatch: "#ffffff",
    costPerSqMm: 0,
    kerfMm: 0,
    minFeatureMm: 0,
    thicknessesMm: [],
    thumbnailUrl: "",
    textureUrl: "",
  };
  static seedData = MOCK_MATERIALS;
}
// ARTICLE ENTITY
export class ArticleEntity extends IndexedEntity<Article> {
  static readonly entityName = "article";
  static readonly indexName = "articles";
  static readonly initialState: Article = {
    id: "",
    title: "",
    content: "",
    createdAt: 0,
  };
  static seedData = [];
}
// HELP REQUEST ENTITY
export class HelpRequestEntity extends IndexedEntity<HelpRequest> {
  static readonly entityName = "helpRequest";
  static readonly indexName = "helpRequests";
  static readonly initialState: HelpRequest = {
    id: "",
    message: "",
    userId: "",
    status: 'open',
    timestamp: 0,
  };
  static seedData = [];
  async updateStatus(status: 'open' | 'resolved'): Promise<void> {
    await this.patch({ status });
  }
}