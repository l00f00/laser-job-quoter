import { AppLayout } from '@/components/layout/AppLayout';
import { QuoteBuilder } from '@/components/quote/QuoteBuilder';
import { HelpButton } from '@/components/HelpButton';
import { Toaster } from '@/components/ui/sonner';
export function QuotePage() {
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-display font-bold">Create Your Quote</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Upload your design, choose your material, and get an instant price for your laser cutting and engraving job.
            </p>
          </div>
          <QuoteBuilder />
        </div>
      </div>
      <HelpButton />
      <Toaster richColors closeButton />
    </AppLayout>
  );
}