import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Zap } from 'lucide-react';
import type { PricePackage } from '@/lib/quote-utils';
interface PriceCardProps {
  packages: PricePackage[];
  onSaveQuote: () => void;
  isSaving: boolean;
}
export function PriceCard({ packages, onSaveQuote, isSaving }: PriceCardProps) {
  const [selectedPackage, setSelectedPackage] = useState<'Economy' | 'Standard' | 'Express'>('Standard');
  const activePackage = packages.find(p => p.name === selectedPackage) || packages[1];
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
          value={selectedPackage}
          onValueChange={(value) => {
            if (value) setSelectedPackage(value as any);
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
                key={activePackage.total}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                ${activePackage.total.toFixed(2)}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        <Separator />
        <div className="space-y-2 text-sm">
          <h4 className="font-semibold mb-2">Price Breakdown</h4>
          {Object.entries(activePackage.breakdown).map(([key, value]) => (
            value > 0 && (
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
                <span>${value.toFixed(2)}</span>
              </div>
            )
          ))}
        </div>
        <Button size="lg" className="w-full bg-[rgb(245,128,37)] hover:bg-[rgb(230,90,27)] text-white" onClick={onSaveQuote} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Quote'}
        </Button>
      </CardContent>
    </Card>
  );
}