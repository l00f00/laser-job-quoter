import { api } from './api-client';
import { mockAuth } from './auth-utils';
import type { Quote } from '@shared/types';
import { toast } from 'sonner';
export async function duplicateQuote(quote: Quote): Promise<Quote | null> {
  const token = mockAuth.getToken();
  if (!token) {
    toast.error('You must be logged in to duplicate a quote.');
    return null;
  }
  // Create a new quote object based on the old one, but with a new ID and timestamp
  const { id, createdAt, ...restOfQuote } = quote;
  const newQuoteData: Partial<Quote> = {
    ...restOfQuote,
    title: `${quote.title} (Copy)`,
  };
  try {
    const newQuote = await api<Quote>('/api/quotes', {
      method: 'POST',
      body: JSON.stringify(newQuoteData),
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    toast.success('Quote duplicated successfully!');
    return newQuote;
  } catch (error) {
    toast.error('Failed to duplicate quote', {
      description: (error as Error).message,
    });
    return null;
  }
}