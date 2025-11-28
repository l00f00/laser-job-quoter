import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ExternalLink, RefreshCw, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api-client';
import { mockAuth } from '@/lib/auth-utils';
import type { Order } from '@shared/types';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
export function PaymentsTab() {
  const { data: orders, isLoading, error } = useQuery<Order[]>({
    queryKey: ['admin-orders'], // Reuse the same query as OrdersTab
    queryFn: () => api('/api/admin/orders', { headers: { 'Authorization': `Bearer ${mockAuth.getToken()}` } }),
  });
  const handleMockSync = (orderId: string) => {
    toast.info(`Syncing status for order ${orderId}...`, {
      description: 'This is a mock action. In production, this would fetch the latest status from Stripe.',
    });
  };
  if (isLoading) return (
    <Card>
      <CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
  if (error) return <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{(error as Error).message}</AlertDescription></Alert>;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Overview</CardTitle>
        <CardDescription>Review payment statuses and access Stripe for details.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Stripe Session ID</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {orders?.map((order, i) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-muted/50"
                  >
                    <TableCell className="font-mono text-xs">{order.id}</TableCell>
                    <TableCell>
                      <Badge variant={order.paymentStatus === 'mock_paid' ? 'default' : 'secondary'} className={cn({
                        'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300': order.paymentStatus === 'mock_paid',
                      })}>
                        {order.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {order.stripeSessionId ? (
                        <a
                          href={`https://dashboard.stripe.com/test/payments/${order.paymentIntentId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-500 hover:underline"
                        >
                          {order.stripeSessionId} <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => handleMockSync(order.id)}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Sync
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}