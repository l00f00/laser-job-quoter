import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { UploadDropzone } from './UploadDropzone';
import { MaterialSelector } from './MaterialSelector';
import { PriceCard } from './PriceCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { calculateEstimate, getSvgMetrics, PricePackage, ArtworkMetrics } from '@/lib/quote-utils';
import type { Material, Quote } from '@shared/types';
import { Scissors, Brush, Layers } from 'lucide-react';
type QuoteState = {
  file?: File;
  fileContent?: string;
  artworkMetrics?: ArtworkMetrics;
  material?: Material;
  thicknessMm?: number;
  jobType: 'cut' | 'engrave' | 'both';
};
export function QuoteBuilder() {
  const [state, setState] = useState<QuoteState>({ jobType: 'cut' });
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const handleFileAccepted = async (file: File, content: string, physicalWidthMm: number) => {
    setIsLoadingMetrics(true);
    setState(s => ({ ...s, file, fileContent: content, artworkMetrics: undefined }));
    try {
      const metrics = await getSvgMetrics(content, physicalWidthMm);
      setState(s => ({ ...s, artworkMetrics: metrics }));
      toast.success('Artwork analyzed successfully!');
    } catch (error) {
      toast.error('Failed to analyze SVG', { description: (error as Error).message });
      setState(s => ({ ...s, file: undefined, fileContent: undefined }));
    } finally {
      setIsLoadingMetrics(false);
    }
  };
  const handleSelectMaterial = (material: Material) => {
    setState(s => ({ ...s, material, thicknessMm: material.thicknessesMm[0] }));
  };
  const pricePackages = useMemo((): PricePackage[] | null => {
    if (!state.artworkMetrics || !state.material || !state.thicknessMm) {
      return null;
    }
    return calculateEstimate(state.artworkMetrics, {
      material: state.material,
      thicknessMm: state.thicknessMm,
      jobType: state.jobType,
    });
  }, [state.artworkMetrics, state.material, state.thicknessMm, state.jobType]);
  const handleSaveQuote = async () => {
    if (!state.file || !state.material || !state.artworkMetrics || !pricePackages) {
      toast.error("Please complete all steps before saving.");
      return;
    }
    setIsSaving(true);
    try {
      const quoteData: Partial<Quote> = {
        title: state.file.name,
        materialId: state.material.id,
        thicknessMm: state.thicknessMm,
        jobType: state.jobType,
        physicalWidthMm: state.artworkMetrics.widthMm,
        physicalHeightMm: state.artworkMetrics.heightMm,
        estimate: pricePackages.find(p => p.name === 'Standard') || pricePackages[0],
      };
      await api<Quote>('/api/quotes', {
        method: 'POST',
        body: JSON.stringify(quoteData),
      });
      toast.success('Quote saved!', { description: 'You can view it in your saved quotes list.' });
    } catch (error) {
      toast.error('Failed to save quote.');
    } finally {
      setIsSaving(false);
    }
  };
  const step = !state.file ? 1 : !state.material ? 2 : 3;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: Filters & Options */}
      <div className="lg:col-span-3 space-y-8">
        <motion.div layout>
          <Card className={step === 2 ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}>
            <CardHeader><CardTitle>1. Select Material</CardTitle></CardHeader>
            <CardContent><MaterialSelector selectedMaterialId={state.material?.id} onSelectMaterial={handleSelectMaterial} /></CardContent>
          </Card>
        </motion.div>
        {state.material && (
          <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader><CardTitle>2. Job Options</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Job Type</Label>
                  <ToggleGroup
                    type="single"
                    value={state.jobType}
                    onValueChange={(value) => { if (value) setState(s => ({ ...s, jobType: value as any })) }}
                    className="grid grid-cols-3 mt-2"
                  >
                    <ToggleGroupItem value="cut"><Scissors className="h-4 w-4 mr-2" />Cut</ToggleGroupItem>
                    <ToggleGroupItem value="engrave"><Brush className="h-4 w-4 mr-2" />Engrave</ToggleGroupItem>
                    <ToggleGroupItem value="both"><Layers className="h-4 w-4 mr-2" />Both</ToggleGroupItem>
                  </ToggleGroup>
                </div>
                <div>
                  <Label>Thickness: {state.thicknessMm}mm</Label>
                  <Slider
                    value={[state.thicknessMm || state.material.thicknessesMm[0]]}
                    onValueChange={([val]) => setState(s => ({ ...s, thicknessMm: val }))}
                    min={state.material.thicknessesMm[0]}
                    max={state.material.thicknessesMm[state.material.thicknessesMm.length - 1]}
                    step={state.material.thicknessesMm.length > 1 ? state.material.thicknessesMm[1] - state.material.thicknessesMm[0] : 1}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
      {/* Middle Column: Artwork Preview */}
      <div className="lg:col-span-6 space-y-8">
        <motion.div layout>
          <Card className={step === 1 ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}>
            <CardHeader><CardTitle>3. Upload Artwork</CardTitle></CardHeader>
            <CardContent>
              <UploadDropzone onFileAccepted={handleFileAccepted} />
            </CardContent>
          </Card>
        </motion.div>
        {state.fileContent && (
          <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader><CardTitle>Artwork Preview</CardTitle></CardHeader>
              <CardContent>
                {isLoadingMetrics ? (
                  <Skeleton className="aspect-video w-full" />
                ) : (
                  <div className="aspect-video w-full rounded-lg border bg-muted/30 flex items-center justify-center p-4">
                    <img src={`data:image/svg+xml;base64,${btoa(state.fileContent)}`} alt="Artwork preview" className="max-h-full max-w-full" />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
      {/* Right Column: Pricing */}
      <div className="lg:col-span-3">
        <motion.div layout className="sticky top-24">
          {pricePackages ? (
            <PriceCard packages={pricePackages} onSaveQuote={handleSaveQuote} isSaving={isSaving} />
          ) : (
            <Card className="shadow-soft">
              <CardHeader><CardTitle>Your Quote</CardTitle></CardHeader>
              <CardContent className="text-center text-muted-foreground h-64 flex items-center justify-center">
                <p>Complete the steps to see your instant price.</p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}