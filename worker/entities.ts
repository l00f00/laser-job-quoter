/**
 * Minimal real-world demo: One Durable Object instance per entity (User, ChatBoard), with Indexes for listing.
 */
import { IndexedEntity } from "./core-utils";
import type { User, Chat, ChatMessage, Quote, Material, Order } from "@shared/types";
import { OrderStatus } from "@shared/types";
import { MOCK_CHAT_MESSAGES, MOCK_CHATS, MOCK_USERS, MOCK_QUOTES, MOCK_MATERIALS } from "@shared/mock-data";
// USER ENTITY: one DO instance per user
export class UserEntity extends IndexedEntity<User> {
  static readonly entityName = "user";
  static readonly indexName = "users";
  static readonly initialState: User = { id: "", name: "" };
  static seedData = MOCK_USERS;
}
// CHAT BOARD ENTITY: one DO instance per chat board, stores its own messages
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
  };
  static seedData = [];
  async updatePaymentStatus(status: 'mock_paid'): Promise<void> {
    await this.patch({ paymentStatus: status, status: OrderStatus.Paid });
  }
}