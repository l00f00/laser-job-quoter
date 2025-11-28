import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api-client';
import type { Quote, PricePackage } from '@shared/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileText, Copy, Download, AlertTriangle, Edit, ShoppingCart } from 'lucide-react';
import { exportQuoteCSV } from '@/lib/export-utils';
import { duplicateQuote } from '@/lib/quote-actions';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mockAuth } from '@/lib/auth-utils';
import { toast } from 'sonner';
import { LoginModal } from '../auth/LoginModal';
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};
const QuoteCard = ({ quote }: { quote: Quote }) => {
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const estimate = quote.estimate as PricePackage | undefined;
  const totalForQuantity = (estimate?.total ?? 0) * quantity;
  const handleDuplicate = async () => {
    await duplicateQuote(quote);
    queryClient.invalidateQueries({ queryKey: ['quotes'] });
  };
  const handleCheckout = async () => {
    if (!mockAuth.isAuthenticated()) {
      setIsLoginModalOpen(true);
      return;
    }
    setIsCheckingOut(true);
    try {
      const res = await api<{ url: string }>('/api/orders/stripe', {
        method: 'POST',
        body: JSON.stringify({ quoteId: quote.id, quantity }),
      });
      if (res.url) {
        window.location.href = res.url;
      } else {
        throw new Error("Checkout URL not provided.");
      }
    } catch (e) {
      toast.error('Checkout failed', { description: (e as Error).message });
    } finally {
      setIsCheckingOut(false);
    }
  };
  return (
    <>
      <motion.div
        key={quote.id}
        variants={itemVariants}
        whileHover={{ scale: 1.02, y: -4 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        layout
      >
        <Card className="flex flex-col h-full shadow-soft transition-shadow duration-200 hover:shadow-xl">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg line-clamp-1">{quote.title}</CardTitle>
                <CardDescription>Created {new Date(quote.createdAt).toLocaleDateString()}</CardDescription>
              </div>
              <Badge variant={quote.status === 'draft' ? 'secondary' : 'default'}>{quote.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-grow space-y-4">
            <div className="aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden">
              {quote.thumbnail ? (
                <img src={quote.thumbnail} alt="preview" className="max-h-full max-w-full object-contain" />
              ) : (
                <FileText className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-muted-foreground line-clamp-1">{quote.materialId}</span>
              <motion.div key={quantity} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-right">
                <span className="text-2xl font-bold font-display">${totalForQuantity.toFixed(2)}</span>
                <p className="text-xs text-muted-foreground">for {quantity} pc{quantity > 1 ? 's' : ''}</p>
              </motion.div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`quantity-${quote.id}`}>Quantity</Label>
              <Input
                id={`quantity-${quote.id}`}
                type="number"
                value={quantity}
                onChange={e => setQuantity(Math.max(1, Math.min(100, Number(e.target.value))))}
                min={1}
                max={100}
                className="w-full"
                disabled={!estimate}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:grid sm:grid-cols-3 gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/quote/${quote.id}`}><Edit className="mr-2 h-4 w-4" /> Edit</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handleDuplicate}><Copy className="mr-2 h-4 w-4" /> Duplicate</Button>
            <Button variant="outline" size="sm" onClick={() => exportQuoteCSV(quote)}><Download className="mr-2 h-4 w-4" /> Export</Button>
            <Button
              className="bg-[rgb(245,128,37)] hover:bg-[rgb(230,90,27)] text-white sm:col-span-3"
              onClick={handleCheckout}
              disabled={!estimate || isCheckingOut}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {isCheckingOut ? 'Processing...' : `Buy Now (${quantity})`}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
      <LoginModal open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen} onLoginSuccess={() => toast.info("Logged in! Please try again.")} />
    </>
  );
};
export function QuotesList() {
  const { data: quotes, isLoading, error } = useQuery<Quote[]>({
    queryKey: ['quotes'],
    queryFn: () => api('/api/quotes'),
  });
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
            <CardContent><Skeleton className="aspect-video w-full" /></CardContent>
            <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
          </Card>
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load your quotes. Please try again later.</AlertDescription>
      </Alert>
    );
  }
  if (!quotes || quotes.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed rounded-lg">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">No Quotes Found</h3>
        <p className="mt-1 text-sm text-muted-foreground">You haven't saved any quotes yet.</p>
        <Button asChild className="mt-6 bg-[rgb(245,128,37)] hover:bg-[rgb(230,90,27)] text-white">
          <Link to="/quote">Create Your First Quote</Link>
        </Button>
      </div>
    );
  }
  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence>
        {quotes.map((quote) => <QuoteCard key={quote.id} quote={quote} />)}
      </AnimatePresence>
    </motion.div>
  );
}