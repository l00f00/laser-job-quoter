import { AppLayout } from '@/components/layout/AppLayout';
import { QuoteBuilder } from '@/components/quote/QuoteBuilder';
import { HelpButton } from '@/components/HelpButton';
import { Toaster } from '@/components/ui/sonner';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Quote } from '@shared/types';
import { Skeleton } from '@/components/ui/skeleton';
export function QuotePage() {
  const { id } = useParams<{ id: string }>();
  const { data: initialQuote, isLoading } = useQuery<Quote>({
    queryKey: ['quote', id],
    queryFn: () => api(`/api/quotes/${id}`),
    enabled: !!id,
  });
  const isEditMode = !!id;
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-display font-bold">
              {isEditMode ? 'Edit Your Quote' : 'Create Your Quote'}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              {isEditMode
                ? 'Modify your design, change materials, and update your quote.'
                : 'Upload your design, choose your material, and get an instant price.'}
            </p>
          </div>
          {isEditMode && isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-3 space-y-8"><Skeleton className="h-64 w-full" /></div>
              <div className="lg:col-span-6 space-y-8"><Skeleton className="h-96 w-full" /></div>
              <div className="lg:col-span-3"><Skeleton className="h-80 w-full" /></div>
            </div>
          ) : (
            <QuoteBuilder key={id} editMode={isEditMode} initialQuote={initialQuote} />
          )}
        </div>
      </div>
      <HelpButton />
      <Toaster richColors closeButton />
    </AppLayout>
  );
}