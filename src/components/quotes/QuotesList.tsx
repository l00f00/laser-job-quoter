import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api-client';
import type { Quote, PricePackage } from '@shared/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileText, Copy, Download, LifeBuoy, AlertTriangle } from 'lucide-react';
import { exportQuoteCSV, exportQuotePDF } from '@/lib/export-utils';
import { duplicateQuote } from '@/lib/quote-actions';
import { Link } from 'react-router-dom';
export function QuotesList() {
  const queryClient = useQueryClient();
  const { data: quotes, isLoading, error } = useQuery<Quote[]>({
    queryKey: ['quotes'],
    queryFn: () => api('/api/quotes'),
  });
  const handleDuplicate = async (quote: Quote) => {
    await duplicateQuote(quote);
    queryClient.invalidateQueries({ queryKey: ['quotes'] });
  };
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
            <CardContent><Skeleton className="h-24 w-full" /></CardContent>
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {quotes.map((quote) => {
        const estimate = quote.estimate as PricePackage | undefined;
        return (
          <motion.div
            key={quote.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
          >
            <Card className="flex flex-col h-full shadow-soft">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{quote.title}</CardTitle>
                    <CardDescription>Created {new Date(quote.createdAt).toLocaleDateString()}</CardDescription>
                  </div>
                  <Badge variant={quote.status === 'draft' ? 'secondary' : 'default'}>{quote.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                  {quote.thumbnail ? (
                    <img src={quote.thumbnail} alt="preview" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <FileText className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">{quote.materialId}</span>
                  <span className="text-2xl font-bold font-display">${estimate?.total?.toFixed(2) ?? 'N/A'}</span>
                </div>
              </CardContent>
              <CardFooter className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => handleDuplicate(quote)}><Copy className="mr-2 h-4 w-4" /> Duplicate</Button>
                <Button variant="outline" onClick={() => exportQuoteCSV(quote)}><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
              </CardFooter>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}