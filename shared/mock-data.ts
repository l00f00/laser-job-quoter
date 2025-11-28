import type { User, Chat, ChatMessage, Material, Quote } from './types';
// --- LuxQuote Mock Data ---
export const MOCK_MATERIALS: Material[] = [
  {
    id: 'mat_acrylic_clear_3mm',
    name: 'Clear Acrylic',
    description: 'Versatile and clear, great for displays and enclosures.',
    colorSwatch: '#ffffff',
    costPerSqMm: 0.0005,
    kerfMm: 0.15,
    minFeatureMm: 0.5,
    thicknessesMm: [1.5, 3, 6],
    thumbnailUrl: 'https://images.unsplash.com/photo-1614154118323-35613f355910?q=80&w=800&auto=format&fit=crop',
    textureUrl: 'https://images.unsplash.com/photo-1608043152266-59fe78cb199a?q=80&w=400&fit=crop', // Frosted glass
  },
  {
    id: 'mat_birch_ply_3mm',
    name: 'Birch Plywood',
    description: 'Strong and light with a beautiful wood grain finish.',
    colorSwatch: '#E1C699',
    costPerSqMm: 0.0004,
    kerfMm: 0.2,
    minFeatureMm: 0.8,
    thicknessesMm: [3, 6],
    thumbnailUrl: 'https://images.unsplash.com/photo-1595934621923-316f6008a8a4?q=80&w=800&auto=format&fit=crop',
    textureUrl: 'https://images.unsplash.com/photo-1552590633-27e48a7a3123?q=80&w=400&fit=crop', // Wood grain
  },
  {
    id: 'mat_mdf_3mm',
    name: 'MDF',
    description: 'Economical and smooth, perfect for painting and prototyping.',
    colorSwatch: '#C3B091',
    costPerSqMm: 0.0002,
    kerfMm: 0.25,
    minFeatureMm: 1.0,
    thicknessesMm: [3, 6, 12],
    thumbnailUrl: 'https://images.unsplash.com/photo-1523568943349-65d8a10da3ea?q=80&w=800&auto=format&fit=crop',
    textureUrl: 'https://images.unsplash.com/photo-1563299796-b729d0af58a5?q=80&w=400&fit=crop', // Cork/MDF texture
  },
  {
    id: 'mat_delrin_black_6mm',
    name: 'Black Delrin (Acetal)',
    description: 'High-performance engineering plastic, excellent for mechanical parts.',
    colorSwatch: '#222222',
    costPerSqMm: 0.0012,
    kerfMm: 0.1,
    minFeatureMm: 0.4,
    thicknessesMm: [1.5, 3, 6],
    thumbnailUrl: 'https://images.unsplash.com/photo-1609503221888-91580335f288?q=80&w=800&auto=format&fit=crop',
    textureUrl: 'https://images.unsplash.com/photo-1588392382313-264ba344a1f7?q=80&w=400&fit=crop', // Dark texture
  },
  {
    id: 'mat_aluminum_brushed_2mm',
    name: 'Brushed Aluminum',
    description: 'Metallic finish for industrial parts.',
    colorSwatch: '#C0C0C0',
    costPerSqMm: 0.0015,
    kerfMm: 0.12,
    minFeatureMm: 0.6,
    thicknessesMm: [1, 2, 3],
    thumbnailUrl: 'https://images.unsplash.com/photo-1541781774459-c849f6d6afce?q=80&w=800',
    textureUrl: 'https://images.unsplash.com/photo-1585384319462-37f2f0f2e81d?q=80&w=400&fit=crop', // Brushed metal
  },
  {
    id: 'mat_leather_brown_2mm',
    name: 'Brown Leather',
    description: 'Premium material for custom goods.',
    colorSwatch: '#8B4513',
    costPerSqMm: 0.002,
    kerfMm: 0.18,
    minFeatureMm: 0.7,
    thicknessesMm: [1.5, 2, 3],
    thumbnailUrl: 'https://images.unsplash.com/photo-1608251547732-c378d79c2db5?q=80&w=800',
    textureUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=400&fit=crop', // Leather grain
  },
];
export const MOCK_QUOTES: Quote[] = [
  {
    id: 'quote_1',
    title: 'Project Alpha',
    createdAt: Date.now(),
    materialId: 'mat_acrylic_clear_3mm',
    thicknessMm: 3,
    jobType: 'both',
    physicalWidthMm: 100,
    physicalHeightMm: 150,
    estimate: { total: 25.50 },
    status: 'draft',
  }
];
// --- Template Demo Mock Data (can be removed later) ---
export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'User A' },
  { id: 'u2', name: 'User B' }
];
export const MOCK_CHATS: Chat[] = [
  { id: 'c1', title: 'General' },
];
export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  { id: 'm1', chatId: 'c1', userId: 'u1', text: 'Hello', ts: Date.now() },
];