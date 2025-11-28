export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
// --- LuxQuote Types ---
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
  estimate: Record<string, unknown>; // Store the calculated estimate
  thumbnail?: string; // small base64 preview
  status: 'draft' | 'requested' | 'in_progress' | 'complete';
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