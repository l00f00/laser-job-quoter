import { AppLayout } from '@/components/layout/AppLayout';
import { HelpButton } from '@/components/HelpButton';
import { Toaster, toast } from '@/components/ui/sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { mockAuth } from '@/lib/auth-utils';
import type { Order, Material } from '@shared/types';
import { OrderStatus } from '@shared/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, ShieldCheck, Edit, BarChart, PieChartIcon, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
function OrdersTab() {
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
        <CardHeader><CardTitle>All Orders</CardTitle><CardDescription>A list of all submitted orders.</CardDescription></CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader><TableRow><TableHead>Order ID</TableHead><TableHead>Quote ID</TableHead><TableHead>Status</TableHead><TableHead>Submitted</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
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
                      <TableCell><Badge className={cn({ 'bg-green-100 text-green-800': order.status === 'paid', 'bg-yellow-100 text-yellow-800': order.status === 'pending', 'bg-blue-100 text-blue-800': order.status === 'shipped' })}>{order.status}</Badge></TableCell>
                      <TableCell>{new Date(order.submittedAt).toLocaleString()}</TableCell>
                      <TableCell className="space-x-2">
                        <Button variant="outline" size="sm" asChild><Link to={`/quote/${order.quoteId}`}>View Quote</Link></Button>
                        <Button variant="ghost" size="sm" onClick={() => { setEditingOrder(order); setNewStatus(order.status); }}><Edit className="h-4 w-4" /></Button>
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
          <DialogHeader><DialogTitle>Edit Order Status</DialogTitle><DialogDescription>Update the status for order {editingOrder?.id}.</DialogDescription></DialogHeader>
          <div className="py-4">
            <Select value={newStatus} onValueChange={(v) => setNewStatus(v as OrderStatus)}>
              <SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger>
              <SelectContent>
                {Object.values(OrderStatus).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter><Button onClick={handleStatusUpdate}>Save changes</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
function AnalyticsTab() {
  const { data: analytics, isLoading } = useQuery<{ totalRevenue: number; orderCount: number; topMaterials: { name: string; value: number }[] }>({
    queryKey: ['admin-analytics'],
    queryFn: () => api('/api/admin/analytics', { headers: { 'Authorization': `Bearer ${mockAuth.getToken()}` } }),
  });
  const { data: materials } = useQuery<Material[]>({ queryKey: ['materials'], queryFn: () => api('/api/materials') });
  const materialsById = new Map(materials?.map(m => [m.id, m.name]));
  const pieData = analytics?.topMaterials.map(m => ({ ...m, name: materialsById.get(m.name) || 'Unknown' }));
  if (isLoading) return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent><Skeleton className="h-12 w-3/4" /></CardContent></Card>
      <Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent><Skeleton className="h-12 w-1/2" /></CardContent></Card>
      <Card className="md:col-span-2"><CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader><CardContent className="h-80"><Skeleton className="h-full w-full" /></CardContent></Card>
    </div>
  );
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card><CardHeader><CardTitle>Total Revenue</CardTitle></CardHeader><CardContent><p className="text-4xl font-bold">${analytics?.totalRevenue.toFixed(2)}</p></CardContent></Card>
      <Card><CardHeader><CardTitle>Total Orders</CardTitle></CardHeader><CardContent><p className="text-4xl font-bold">{analytics?.orderCount}</p></CardContent></Card>
      <Card className="md:col-span-2"><CardHeader><CardTitle>Top Materials</CardTitle></CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {pieData?.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
export function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(mockAuth.isAuthenticated());
  const [isAdmin, setIsAdmin] = useState(mockAuth.getRole() === 'admin');
  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(mockAuth.isAuthenticated());
      setIsAdmin(mockAuth.getRole() === 'admin');
    };
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <div className="text-center mb-12">
            <ShieldCheck className="mx-auto h-12 w-12 text-indigo-500" />
            <h1 className="mt-4 text-4xl md:text-5xl font-display font-bold">Admin Dashboard</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">Manage and review all incoming orders.</p>
          </div>
          {!isAuthenticated || !isAdmin ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Access Denied</AlertTitle>
              <AlertDescription>You must be logged in as an administrator to view this page.</AlertDescription>
            </Alert>
          ) : (
            <Tabs defaultValue="orders" className="w-full">
              <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3"><TabsTrigger value="orders"><Edit className="mr-2 h-4 w-4" />Orders</TabsTrigger><TabsTrigger value="analytics"><BarChart className="mr-2 h-4 w-4" />Analytics</TabsTrigger><TabsTrigger value="payments"><CreditCard className="mr-2 h-4 w-4" />Payments</TabsTrigger></TabsList>
              <TabsContent value="orders" className="mt-6"><OrdersTab /></TabsContent>
              <TabsContent value="analytics" className="mt-6"><AnalyticsTab /></TabsContent>
              <TabsContent value="payments" className="mt-6"><Card><CardHeader><CardTitle>Payments</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Stripe payment integration is active. View payment details in the Stripe Dashboard.</p></CardContent></Card></TabsContent>
            </Tabs>
          )}
        </div>
      </div>
      <HelpButton />
      <Toaster richColors closeButton />
    </AppLayout>
  );
}