import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadDropzone } from './UploadDropzone';
import { MaterialSelector } from './MaterialSelector';
import { PriceCard } from './PriceCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { calculateEstimate, getSvgMetrics, checkManufacturability, getKerfAdjustedMetrics, ArtworkMetrics, processSvgForCut } from '@/lib/quote-utils';
import type { Material, Quote, PricePackage } from '@shared/types';
import { Scissors, Brush, Layers, AlertTriangle } from 'lucide-react';
import { mockAuth } from '@/lib/auth-utils';
import { LoginModal } from '@/components/auth/LoginModal';
import { cn } from '@/lib/utils';
type QuoteState = {
  file?: File;
  fileContent?: string;
  artworkMetrics?: ArtworkMetrics;
  material?: Material;
  thicknessMm?: number;
  jobType: 'cut' | 'engrave' | 'both';
  savedQuoteId?: string;
};
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};
export function QuoteBuilder() {
  const [state, setState] = useState<QuoteState>({ jobType: 'cut' });
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [manufacturabilityIssues, setManufacturabilityIssues] = useState<string[]>([]);
  const [showKerf, setShowKerf] = useState(false);
  const handleFileAccepted = async (file: File, content: string, physicalWidthMm: number) => {
    setIsLoadingMetrics(true);
    setManufacturabilityIssues([]);
    setState(s => ({ ...s, file, fileContent: content, artworkMetrics: undefined, savedQuoteId: undefined }));
    try {
      if (file.type.includes('svg')) {
        const metrics = await getSvgMetrics(content, physicalWidthMm);
        setState(s => ({ ...s, artworkMetrics: metrics }));
        toast.success('Artwork analyzed successfully!');
      } else {
        // For raster images, metrics are simpler
        const aspectRatio = await new Promise<number>(resolve => {
          const img = new Image();
          img.onload = () => resolve(img.height / img.width);
          img.src = content; // content is data URL for raster
        });
        const metrics: ArtworkMetrics = {
          widthMm: physicalWidthMm,
          heightMm: physicalWidthMm * aspectRatio,
          cutLengthMm: 0, // Cannot determine from raster
          engraveAreaSqMm: physicalWidthMm * (physicalWidthMm * aspectRatio), // Assume full engraving
          pathComplexity: 1,
        };
        setState(s => ({ ...s, artworkMetrics: metrics }));
        toast.success('Artwork dimensions set!');
      }
    } catch (error) {
      toast.error('Failed to analyze artwork', { description: (error as Error).message });
      setState(s => ({ ...s, file: undefined, fileContent: undefined }));
    } finally {
      setIsLoadingMetrics(false);
    }
  };
  const handleSelectMaterial = (material: Material) => {
    setState(s => ({ ...s, material, thicknessMm: material.thicknessesMm[0] }));
  };
  const displayedMetrics = useMemo(() => {
    if (showKerf && state.artworkMetrics && state.material) {
      return getKerfAdjustedMetrics(state.artworkMetrics, state.material.kerfMm);
    }
    return state.artworkMetrics;
  }, [showKerf, state.artworkMetrics, state.material]);
  useEffect(() => {
    if (state.artworkMetrics && state.material && state.thicknessMm) {
      const issues = checkManufacturability(state.artworkMetrics, state.material, state.thicknessMm);
      setManufacturabilityIssues(issues);
    }
  }, [state.artworkMetrics, state.material, state.thicknessMm]);
  const pricePackages = useMemo((): PricePackage[] | null => {
    if (!displayedMetrics || !state.material || !state.thicknessMm) {
      return null;
    }
    return calculateEstimate(displayedMetrics, {
      material: state.material,
      thicknessMm: state.thicknessMm,
      jobType: state.jobType,
    });
  }, [displayedMetrics, state.material, state.thicknessMm, state.jobType]);
  const handleSaveQuote = async (selectedPackage: PricePackage) => {
    if (!mockAuth.isAuthenticated()) {
      setIsLoginModalOpen(true);
      return;
    }
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
        estimate: selectedPackage,
        thumbnail: state.fileContent && state.file.type.includes('svg') ? `data:image/svg+xml;base64,${btoa(state.fileContent)}` : undefined,
      };
      const savedQuote = await api<Quote>('/api/quotes', {
        method: 'POST',
        body: JSON.stringify(quoteData),
        headers: { 'Authorization': `Bearer ${mockAuth.getToken()}` }
      });
      setState(s => ({ ...s, savedQuoteId: savedQuote.id }));
      toast.success('Quote saved!', { description: 'You can now proceed to checkout.' });
    } catch (error) {
      toast.error('Failed to save quote.');
    } finally {
      setIsSaving(false);
    }
  };
  const processedPreviewSrc = useMemo(() => {
    if (!state.fileContent || !state.file) return '';
    if (state.jobType === 'cut' && state.file.type.includes('svg')) {
      const processedSvg = processSvgForCut(state.fileContent);
      return `data:image/svg+xml;base64,${btoa(processedSvg)}`;
    }
    // For raster or other job types, use original content
    // Note: UploadDropzone provides data URL for raster, raw text for SVG
    if (state.file.type.includes('svg')) {
      return `data:image/svg+xml;base64,${btoa(state.fileContent)}`;
    }
    return state.fileContent; // This is already a data URL from UploadDropzone
  }, [state.fileContent, state.file, state.jobType]);
  const step = !state.material ? 1 : !state.file ? 2 : 3;
  const artworkPreviewStyles = {
    cut: 'mix-blend-normal', // Use normal blend for clear outlines
    engrave: 'mix-blend-multiply opacity-70',
    both: 'mix-blend-normal',
  };
  return (
    <>
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 md:gap-6 lg:gap-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="lg:col-span-3 space-y-8">
          <motion.div layout variants={itemVariants}>
            <Card className={step === 1 ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}>
              <CardHeader><CardTitle>1. Select Material</CardTitle></CardHeader>
              <CardContent><MaterialSelector selectedMaterialId={state.material?.id} onSelectMaterial={handleSelectMaterial} /></CardContent>
            </Card>
          </motion.div>
          {state.material && (
            <motion.div layout variants={itemVariants}>
              <Card>
                <CardHeader><CardTitle>2. Job Options</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Job Type</Label>
                    <ToggleGroup type="single" value={state.jobType} onValueChange={(value) => { if (value) setState(s => ({ ...s, jobType: value as any })) }} className="grid grid-cols-3 mt-2">
                      <ToggleGroupItem value="cut"><Scissors className="h-4 w-4 mr-2" />Cut</ToggleGroupItem>
                      <ToggleGroupItem value="engrave"><Brush className="h-4 w-4 mr-2" />Engrave</ToggleGroupItem>
                      <ToggleGroupItem value="both"><Layers className="h-4 w-4 mr-2" />Both</ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                  <div>
                    <Label>Thickness: {state.thicknessMm}mm</Label>
                    <Slider value={[state.thicknessMm || state.material.thicknessesMm[0]]} onValueChange={([val]) => setState(s => ({ ...s, thicknessMm: val }))} min={state.material.thicknessesMm[0]} max={state.material.thicknessesMm[state.material.thicknessesMm.length - 1]} step={state.material.thicknessesMm.length > 1 ? state.material.thicknessesMm[1] - state.material.thicknessesMm[0] : 1} className="mt-2" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
        <div className="lg:col-span-6 space-y-8">
          <motion.div layout variants={itemVariants}>
            <Card className={step === 2 ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}>
              <CardHeader><CardTitle>3. Upload Artwork</CardTitle></CardHeader>
              <CardContent><UploadDropzone onFileAccepted={handleFileAccepted} /></CardContent>
            </Card>
          </motion.div>
          {state.fileContent && (
            <motion.div layout variants={itemVariants} className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Artwork Preview</CardTitle>
                  {state.material && (
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="kerf-toggle">Kerf View</Label>
                      <Switch id="kerf-toggle" checked={showKerf} onCheckedChange={setShowKerf} />
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {isLoadingMetrics ? (
                    <Skeleton className="aspect-video w-full" />
                  ) : (
                    <AnimatePresence>
                      <motion.div
                        key={state.material?.textureUrl || 'default'}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="aspect-video w-full rounded-lg border bg-muted/30 flex items-center justify-center p-4 relative overflow-hidden bg-cover bg-center"
                        style={{ backgroundImage: state.material?.textureUrl ? `url(${state.material.textureUrl})` : 'none' }}
                      >
                        <img
                          src={processedPreviewSrc}
                          alt="Artwork preview"
                          loading="lazy"
                          width={state.artworkMetrics?.widthMm}
                          height={state.artworkMetrics?.heightMm}
                          className={cn("max-h-full max-w-full object-contain transition-all duration-300", artworkPreviewStyles[state.jobType])}
                          style={{ imageRendering: 'optimizeQuality' }}
                        />
                         {showKerf && state.material && (
                          <div
                            className="absolute inset-0 pointer-events-none border-red-500/50 border-dashed"
                            style={{ borderWidth: `${state.material.kerfMm / 2}px` }}
                          />
                        )}
                      </motion.div>
                    </AnimatePresence>
                  )}
                </CardContent>
              </Card>
              {manufacturabilityIssues.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Manufacturability Warning</AlertTitle>
                  <AlertDescription>
                    <ul>{manufacturabilityIssues.map((issue, i) => <li key={i}>- {issue}</li>)}</ul>
                  </AlertDescription>
                </Alert>
              )}
            </motion.div>
          )}
        </div>
        <div className="lg:col-span-3">
          <motion.div layout variants={itemVariants} className="sticky top-24">
            {pricePackages ? (
              <PriceCard packages={pricePackages} quoteId={state.savedQuoteId} onSaveQuote={handleSaveQuote} isSaving={isSaving} />
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
      </motion.div>
      <LoginModal open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen} onLoginSuccess={() => toast.info("Login successful! Please click 'Save Quote' again.")} />
    </>
  );
}