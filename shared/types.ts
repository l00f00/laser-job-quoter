export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
// --- LuxQuote Types ---
export enum OrderStatus {
  Pending = 'pending',
  Processing = 'processing',
  Paid = 'paid',
  Shipped = 'shipped',
}
export interface PricePackage {
  name: 'Economy' | 'Standard' | 'Express';
  leadTime: string;
  machineTimeMultiplier: number;
  total: number;
  breakdown: Record<string, number>;
}
export interface Material {
  id: string;
  name: string;
  description: string;
  colorSwatch: string; // hex or css color
  costPerSqMm: number; // in USD
  kerfMm: number;
  minFeatureMm: number;
  thicknessesMm: number[];
  thumbnailUrl: string;
  textureUrl?: string;
}
export interface Quote {
  id: string;
  title: string;
  createdAt: number; // epoch millis
  materialId: string;
  thicknessMm: number;
  jobType: 'cut' | 'engrave' | 'both';
  physicalWidthMm: number;
  physicalHeightMm: number;
  estimate?: PricePackage | Record<string, unknown>; // Store the calculated estimate
  thumbnail?: string; // small base64 preview
  fileContent?: string; // Full SVG content, base64 encoded
  status: 'draft' | 'requested' | 'in_progress' | 'complete';
  dpiOverride?: number;
}
export interface Order {
  id: string;
  quoteId: string;
  userId: string;
  status: OrderStatus;
  submittedAt: number;
  paymentStatus: 'mock_pending' | 'mock_paid';
  stripeSessionId?: string;
  paymentIntentId?: string;
  quantity?: number;
  // Enriched data from the backend
  quote?: {
    title: string;
    materialId: string;
    jobType: 'cut' | 'engrave' | 'both';
    physicalWidthMm: number;
    physicalHeightMm: number;
    estimate: PricePackage | Record<string, unknown>;
    thumbnail?: string;
  };
}
export type EnrichedOrder = Required<Order>;
export interface LoginUser {
  id: string;
  email: string;
  name: string;
  role?: 'user' | 'admin';
}
export interface LoginResponse {
  user: LoginUser;
  token: string;
}
// --- New Admin & Help Types ---
export interface Article {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}
export interface HelpRequest {
  id: string;
  message: string;
  quoteId?: string;
  userId: string;
  status: 'open' | 'resolved';
  timestamp: number;
}
export interface PricingConfig {
  packages: PricePackage[];
}
// --- Template Demo Types (can be removed later) ---
export interface User {
  id: string;
  name: string;
}
export interface Chat {
  id: string;
  title: string;
}
export interface ChatMessage {
  id: string;
  chatId: string;
  userId: string;
  text: string;
  ts: number; // epoch millis
}