import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
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
import { calculateEstimate, getSvgMetrics, checkManufacturability, ArtworkMetrics, processSvgForCut, createMaskedTextureSvg } from '@/lib/quote-utils';
import type { Material, Quote, PricePackage } from '@shared/types';
import { Scissors, Brush, Layers, AlertTriangle } from 'lucide-react';
import { mockAuth } from '@/lib/auth-utils';
import { LoginModal } from '@/components/auth/LoginModal';
import { useQuery } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { HelpButton } from '../HelpButton';
type QuoteState = {
  file?: File;
  fileContent?: string;
  artworkMetrics?: ArtworkMetrics;
  initialMetrics?: ArtworkMetrics;
  material?: Material;
  thicknessMm?: number;
  jobType: 'cut' | 'engrave' | 'both';
  savedQuoteId?: string;
  scalePercent: number;
};
interface QuoteBuilderProps {
  editMode?: boolean;
  initialQuote?: Quote;
}
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
export function QuoteBuilder({ editMode = false, initialQuote }: QuoteBuilderProps) {
  const [state, setState] = useState<QuoteState>({ jobType: 'cut', scalePercent: 100 });
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [manufacturabilityIssues, setManufacturabilityIssues] = useState<string[]>([]);
  const [showKerf, setShowKerf] = useState(false);
  const [redLines, setRedLines] = useState(false);
  const { data: materials } = useQuery<Material[]>({ queryKey: ['materials'], queryFn: () => api('/api/materials') });
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (editMode && initialQuote && materials) {
      const material = materials.find(m => m.id === initialQuote.materialId);
      const fileContent = initialQuote.fileContent && initialQuote.fileContent.startsWith('data:image/svg+xml;base64,')
        ? atob(initialQuote.fileContent.split(',')[1])
        : undefined;
      const metrics = {
        widthMm: initialQuote.physicalWidthMm,
        heightMm: initialQuote.physicalHeightMm,
        cutLengthMm: 0, engraveAreaSqMm: 0, pathComplexity: 0,
      };
      setState(s => ({
        ...s,
        jobType: initialQuote.jobType,
        material,
        thicknessMm: initialQuote.thicknessMm,
        savedQuoteId: initialQuote.id,
        fileContent,
        artworkMetrics: metrics,
        initialMetrics: metrics,
      }));
      if (fileContent) {
        setIsLoadingMetrics(true);
        getSvgMetrics(fileContent, initialQuote.physicalWidthMm).then(fullMetrics => {
          setState(s => ({ ...s, artworkMetrics: fullMetrics, initialMetrics: fullMetrics }));
        }).catch(err => {
          toast.error("Failed to re-analyze artwork", { description: err.message });
        }).finally(() => setIsLoadingMetrics(false));
      }
    }
  }, [editMode, initialQuote, materials]);
  const handleFileAccepted = async (file: File, content: string, physicalWidthMm: number) => {
    setIsLoadingMetrics(true);
    setManufacturabilityIssues([]);
    setState(s => ({ ...s, file, fileContent: content, artworkMetrics: undefined, initialMetrics: undefined, scalePercent: 100 }));
    try {
      if (file.type.includes('svg')) {
        const metrics = await getSvgMetrics(content, physicalWidthMm);
        setState(s => ({ ...s, artworkMetrics: metrics, initialMetrics: metrics }));
        toast.success('Artwork analyzed successfully!');
      } else {
        // Raster logic
      }
    } catch (error) {
      toast.error('Failed to analyze artwork', { description: (error as Error).message });
    } finally {
      setIsLoadingMetrics(false);
    }
  };
  const debouncedRecalc = useCallback((newWidth: number) => {
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = setTimeout(async () => {
      if (state.fileContent && isSvg) {
        setIsLoadingMetrics(true);
        try {
          const newMetrics = await getSvgMetrics(state.fileContent, newWidth);
          setState(s => ({ ...s, artworkMetrics: newMetrics }));
        } catch (e) {
          toast.error("Failed to recalculate metrics.");
        } finally {
          setIsLoadingMetrics(false);
        }
      }
    }, 300);
  }, [state.fileContent]);
  const handleScaleChange = (value: number[]) => {
    const newScale = value[0];
    setState(s => ({ ...s, scalePercent: newScale }));
    if (state.initialMetrics) {
      const factor = newScale / 100;
      const newWidth = state.initialMetrics.widthMm * factor;
      const newHeight = state.initialMetrics.heightMm * factor;
      setState(s => ({ ...s, artworkMetrics: { ...s.artworkMetrics!, widthMm: newWidth, heightMm: newHeight } }));
      debouncedRecalc(newWidth);
    }
  };
  useEffect(() => {
    if (state.artworkMetrics && state.material && state.thicknessMm) {
      const issues = checkManufacturability(state.artworkMetrics, state.material, state.thicknessMm);
      setManufacturabilityIssues(issues);
    }
  }, [state.artworkMetrics, state.material, state.thicknessMm]);
  const pricePackages = useMemo((): PricePackage[] | null => {
    if (!state.artworkMetrics || !state.material || !state.thicknessMm) return null;
    return calculateEstimate(state.artworkMetrics, {
      material: state.material,
      thicknessMm: state.thicknessMm,
      jobType: state.jobType,
    });
  }, [state.artworkMetrics, state.material, state.thicknessMm, state.jobType]);
  const handleSaveQuote = async (selectedPackage: PricePackage) => {
    if (!mockAuth.isAuthenticated()) { setIsLoginModalOpen(true); return; }
    if (!state.material || !state.artworkMetrics || !pricePackages) { toast.error("Please complete all steps."); return; }
    setIsSaving(true);
    try {
      const isSvg = state.file?.type.includes('svg') || initialQuote?.thumbnail?.startsWith('data:image/svg+xml');
      const thumbnail = isSvg && state.fileContent ? `data:image/svg+xml;base64,${btoa(state.fileContent)}` : initialQuote?.thumbnail;
      const quoteData: Partial<Quote> = {
        title: state.file?.name || initialQuote?.title || 'Untitled Quote',
        materialId: state.material.id,
        thicknessMm: state.thicknessMm,
        jobType: state.jobType,
        physicalWidthMm: state.artworkMetrics.widthMm,
        physicalHeightMm: state.artworkMetrics.heightMm,
        estimate: selectedPackage,
        thumbnail,
        fileContent: thumbnail,
      };
      if (editMode && state.savedQuoteId) {
        const updatedQuote = await api<Quote>(`/api/quotes/${state.savedQuoteId}`, { method: 'PUT', body: JSON.stringify(quoteData) });
        setState(s => ({ ...s, savedQuoteId: updatedQuote.id }));
        toast.success('Quote updated successfully!');
      } else {
        const savedQuote = await api<Quote>('/api/quotes', { method: 'POST', body: JSON.stringify(quoteData) });
        setState(s => ({ ...s, savedQuoteId: savedQuote.id }));
        toast.success('Quote saved!');
      }
    } catch (error) {
      toast.error(`Failed to ${editMode ? 'update' : 'save'} quote.`);
    } finally {
      setIsSaving(false);
    }
  };
  const isSvg = useMemo(() => (state.file?.type.includes('svg')) || (initialQuote?.thumbnail?.startsWith('data:image/svg+xml')), [state.file, initialQuote?.thumbnail]);
  const processedPreviewData = useMemo(() => {
    if (!state.fileContent || !state.artworkMetrics) return { type: 'none' };
    const toBase64 = (svgString: string) => `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
    if (state.jobType === 'cut' && state.material?.textureUrl) {
      const maskedSvg = createMaskedTextureSvg(state.fileContent, state.material.textureUrl, state.artworkMetrics.widthMm, state.artworkMetrics.heightMm, redLines);
      return { type: 'masked-cut', src: toBase64(maskedSvg) };
    }
    if (state.jobType === 'cut') {
      return { type: 'cut', src: toBase64(processSvgForCut(state.fileContent, redLines ? 'red' : 'black')) };
    }
    // Other job types...
    return { type: 'engrave', src: toBase64(state.fileContent) };
  }, [state.fileContent, state.artworkMetrics, state.jobType, state.material, redLines]);
  return (
    <>
      <motion.div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 lg:gap-8" variants={containerVariants} initial="hidden" animate="visible">
        <div className="lg:col-span-3 space-y-8">
          <motion.div layout variants={itemVariants}>
            <Card><CardHeader><CardTitle>1. Select Material</CardTitle></CardHeader><CardContent><MaterialSelector selectedMaterialId={state.material?.id} onSelectMaterial={(m) => setState(s => ({ ...s, material: m, thicknessMm: m.thicknessesMm[0] }))} /></CardContent></Card>
          </motion.div>
          {state.material && (
            <motion.div layout variants={itemVariants}>
              <Card><CardHeader><CardTitle>2. Job Options</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div><Label>Job Type</Label><ToggleGroup type="single" value={state.jobType} onValueChange={(v) => { if (v) setState(s => ({ ...s, jobType: v as any })) }} className="grid grid-cols-3 mt-2"><ToggleGroupItem value="cut"><Scissors className="h-4 w-4 mr-2" />Cut</ToggleGroupItem><ToggleGroupItem value="engrave"><Brush className="h-4 w-4 mr-2" />Engrave</ToggleGroupItem><ToggleGroupItem value="both"><Layers className="h-4 w-4 mr-2" />Both</ToggleGroupItem></ToggleGroup></div>
                  <div><Label>Thickness: {state.thicknessMm}mm</Label><Slider value={[state.thicknessMm || state.material.thicknessesMm[0]]} onValueChange={([val]) => setState(s => ({ ...s, thicknessMm: val }))} min={state.material.thicknessesMm[0]} max={state.material.thicknessesMm[state.material.thicknessesMm.length - 1]} step={state.material.thicknessesMm.length > 1 ? state.material.thicknessesMm[1] - state.material.thicknessesMm[0] : 1} className="mt-2" /></div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
        <div className="lg:col-span-6 space-y-8">
          <motion.div layout variants={itemVariants}>
            <Card><CardHeader><CardTitle>3. Upload Artwork</CardTitle></CardHeader><CardContent>{isLoadingMetrics ? <Skeleton className="h-64 w-full" /> : <UploadDropzone onFileAccepted={handleFileAccepted} />}</CardContent></Card>
          </motion.div>
          {state.fileContent && (
            <motion.div layout variants={itemVariants} className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
                  <CardTitle>Artwork Preview</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm">Scale</Label>
                    <Slider value={[state.scalePercent]} onValueChange={handleScaleChange} min={50} max={200} step={10} className="w-24" />
                    <span className="text-sm font-mono w-12 text-right">{state.scalePercent}%</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="red-lines">Red Lines</Label>
                    <Switch id="red-lines" checked={redLines} onCheckedChange={setRedLines} />
                  </div>
                </CardHeader>
                <CardContent>
                  <ErrorBoundary>
                    {isLoadingMetrics ? <Skeleton className="aspect-video w-full" /> : (
                      <div className="aspect-video w-full rounded-lg border bg-muted/30 flex items-center justify-center p-4 overflow-auto max-h-[500px]">
                        <img src={processedPreviewData.src} alt="Preview" className="max-h-full max-w-full object-contain" />
                      </div>
                    )}
                  </ErrorBoundary>
                </CardContent>
              </Card>
              {manufacturabilityIssues.length > 0 && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Manufacturability Warning</AlertTitle><AlertDescription><ul>{manufacturabilityIssues.map((issue, i) => <li key={i}>- {issue}</li>)}</ul></AlertDescription></Alert>}
            </motion.div>
          )}
        </div>
        <div className="lg:col-span-3">
          <motion.div layout variants={itemVariants} className="sticky top-24">
            <PriceCard packages={pricePackages} quoteId={state.savedQuoteId} onSaveQuote={handleSaveQuote} isSaving={isSaving} isEditMode={editMode} />
          </motion.div>
        </div>
      </motion.div>
      <HelpButton savedQuoteId={state.savedQuoteId} />
      <LoginModal open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen} onLoginSuccess={() => toast.info("Login successful! Please click 'Save Quote' again.")} />
    </>
  );
}