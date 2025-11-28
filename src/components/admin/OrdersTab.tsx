import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit, AlertTriangle, ArrowUpDown } from 'lucide-react';
import { api } from '@/lib/api-client';
import { mockAuth } from '@/lib/auth-utils';
import type { Order, Material } from '@shared/types';
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
type SortConfig = { key: keyof Order; direction: 'asc' | 'desc' };
export function OrdersTab() {
  const queryClient = useQueryClient();
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'submittedAt', direction: 'desc' });
  const { data: materials } = useQuery<Material[]>({
    queryKey: ['materials'],
    queryFn: () => api('/api/materials'),
  });
  const materialsById = useMemo(() => new Map(materials?.map(m => [m.id, m.name])), [materials]);
  const { data: orders, isLoading, error } = useQuery<Order[]>({
    queryKey: ['admin-orders'],
    queryFn: () => api('/api/admin/orders', { headers: { 'Authorization': `Bearer ${mockAuth.getToken()}` } }),
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });
  const sortedOrders = useMemo(() => {
    if (!orders) return [];
    return [...orders].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [orders, sortConfig]);
  const handleSort = (key: keyof Order) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };
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
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </CardContent>
    </Card>
  );
  if (error) return <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{(error as Error).message}</AlertDescription></Alert>;
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>A list of all submitted orders. Data refreshes automatically.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Thumbnail</TableHead>
                  <TableHead>Quote Title</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Dimensions</TableHead>
                  <TableHead className="w-16">Qty</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('submittedAt')}>
                    <span className="flex items-center">Submitted <ArrowUpDown className="ml-2 h-4 w-4" /></span>
                  </TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {sortedOrders.map((order, i) => (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-accent/50 transition-colors"
                    >
                      <TableCell>
                        {order.quote?.thumbnail ? (
                          <img src={order.quote.thumbnail} alt="Preview" className="w-12 h-12 object-cover rounded-md" />
                        ) : <div className="w-12 h-12 bg-muted rounded-md" />}
                      </TableCell>
                      <TableCell className="font-medium">{order.quote?.title ?? 'N/A'}</TableCell>
                      <TableCell>{materialsById.get(order.quote?.materialId ?? '') ?? 'N/A'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{order.quote ? `${order.quote.physicalWidthMm}x${order.quote.physicalHeightMm}mm` : 'N/A'}</TableCell>
                      <TableCell>{order.quantity ?? 1}</TableCell>
                      <TableCell className="font-semibold">${(((order.quote?.estimate as any)?.total ?? 0) * (order.quantity ?? 1)).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={cn({
                          'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300': order.status === 'paid',
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300': order.status === 'pending',
                          'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300': order.status === 'shipped' || order.status === 'processing',
                        })}>{order.status}</Badge>
                      </TableCell>
                      <TableCell>{new Date(order.submittedAt).toLocaleString()}</TableCell>
                      <TableCell className="font-mono text-xs">{order.userId}</TableCell>
                      <TableCell className="space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/quote/${order.quoteId}`}>View</Link>
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