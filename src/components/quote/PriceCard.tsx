import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Zap, ShoppingCart, Loader2 } from 'lucide-react';
import type { PricePackage } from '@shared/types';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
interface PriceCardProps {
  packages: PricePackage[];
  quoteId?: string;
  onSaveQuote: (selectedPackage: PricePackage) => void;
  isSaving: boolean;
  isEditMode?: boolean;
}
export function PriceCard({ packages, quoteId, onSaveQuote, isSaving, isEditMode = false }: PriceCardProps) {
  const [selectedPackageName, setSelectedPackageName] = useState<'Economy' | 'Standard' | 'Express'>('Standard');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const activePackage = packages.find(p => p.name === selectedPackageName) || packages[1];
  const handleCheckout = async () => {
    if (!quoteId) {
      toast.error("Please save the quote before placing an order.");
      return;
    }
    setIsCheckingOut(true);
    try {
      const response = await api<{ url: string }>('/api/orders/stripe', {
        method: 'POST',
        body: JSON.stringify({ quoteId, package: activePackage.name }),
      });
      if (response.url) {
        window.location.href = response.url;
      } else {
        throw new Error("A valid checkout URL was not provided.");
      }
    } catch (error) {
      toast.error("Failed to start checkout.", {
        description: (error as Error).message,
      });
    } finally {
      setIsCheckingOut(false);
    }
  };
  return (
    <Card className="shadow-lg sticky top-24">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Instant Quote</span>
          <Zap className="text-[rgb(245,128,37)]" />
        </CardTitle>
        <CardDescription>Select a production speed to see your price.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ToggleGroup
          type="single"
          value={selectedPackageName}
          onValueChange={(value: 'Economy' | 'Standard' | 'Express') => {
            if (value) setSelectedPackageName(value);
          }}
          className="grid grid-cols-3"
        >
          {packages.map(pkg => (
            <ToggleGroupItem key={pkg.name} value={pkg.name} className="flex flex-col h-auto py-2">
              <span className="font-semibold">{pkg.name}</span>
              <span className="text-xs text-muted-foreground">{pkg.leadTime}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">Total Price</p>
          <div className="text-5xl font-bold font-display text-foreground relative h-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePackage?.total}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                ${activePackage?.total?.toFixed(2) ?? '0.00'}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        <Separator />
        <div className="space-y-2 text-sm">
          <h4 className="font-semibold mb-2">Price Breakdown</h4>
          {Object.entries(activePackage?.breakdown ?? {}).map(([key, value]) => (
            (value as number) > 0 && (
              <div key={key} className="flex justify-between items-center text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  {key}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger>
                      <TooltipContent><p>Details about {key.toLowerCase()}.</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </span>
                <span>${(value as number)?.toFixed(2) ?? '0.00'}</span>
              </div>
            )
          ))}
        </div>
        <div className="grid grid-cols-1 gap-2">
          <Button size="lg" className="w-full bg-[rgb(245,128,37)] hover:bg-[rgb(230,90,27)] text-white" onClick={() => onSaveQuote(activePackage)} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSaving ? 'Saving...' : (isEditMode ? 'Update Quote' : 'Save Quote')}
          </Button>
          <Button size="lg" variant="secondary" className="w-full" onClick={handleCheckout} disabled={!quoteId || isCheckingOut}>
            {isCheckingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
            {isCheckingOut ? 'Redirecting...' : 'Pay with Stripe'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}