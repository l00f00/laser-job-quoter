import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api-client';
import { mockAuth } from '@/lib/auth-utils';
import type { Order } from '@shared/types';
import { OrderStatus } from '@shared/types';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
export function OrdersTab() {
  const queryClient = useQueryClient();
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('');
  const { data: orders, isLoading, error } = useQuery<Order[]>({
    queryKey: ['admin-orders'],
    queryFn: () => api('/api/admin/orders', { headers: { 'Authorization': `Bearer ${mockAuth.getToken()}` } }),
  });
  const handleStatusUpdate = async () => {
    if (!editingOrder || !newStatus) return;
    try {
      await api(`/api/orders/${editingOrder.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
        headers: { 'Authorization': `Bearer ${mockAuth.getToken()}` },
      });
      toast.success('Order status updated!');
      setEditingOrder(null);
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    } catch (e) {
      toast.error('Failed to update status', { description: (e as Error).message });
    }
  };
  if (isLoading) return (
    <Card>
      <CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
  if (error) return <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{(error as Error).message}</AlertDescription></Alert>;
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>A list of all submitted orders.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Quote ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {orders?.map((order, i) => (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-muted/50"
                    >
                      <TableCell className="font-mono text-xs">{order.id}</TableCell>
                      <TableCell className="font-mono text-xs">{order.quoteId}</TableCell>
                      <TableCell>
                        <Badge className={cn({
                          'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300': order.status === 'paid',
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300': order.status === 'pending',
                          'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300': order.status === 'shipped' || order.status === 'processing',
                        })}>{order.status}</Badge>
                      </TableCell>
                      <TableCell>{new Date(order.submittedAt).toLocaleString()}</TableCell>
                      <TableCell className="space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/quote/${order.quoteId}`}>View Quote</Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingOrder(order); setNewStatus(order.status); }}>
                          <Edit className="h-4 w-4" />
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
      <Dialog open={!!editingOrder} onOpenChange={(open) => !open && setEditingOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Order Status</DialogTitle>
            <DialogDescription>Update the status for order {editingOrder?.id}.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newStatus} onValueChange={(v) => setNewStatus(v as OrderStatus)}>
              <SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger>
              <SelectContent>
                {Object.values(OrderStatus).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={handleStatusUpdate}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}