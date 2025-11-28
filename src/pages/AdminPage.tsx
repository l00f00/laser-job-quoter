import { AppLayout } from '@/components/layout/AppLayout';
import { HelpButton } from '@/components/HelpButton';
import { Toaster } from '@/components/ui/sonner';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { mockAuth } from '@/lib/auth-utils';
import type { Order } from '@shared/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
function AdminDashboard() {
  const { data: orders, isLoading, error } = useQuery<Order[]>({
    queryKey: ['admin-orders'],
    queryFn: () => api('/api/admin/orders', {
      headers: { 'Authorization': `Bearer ${mockAuth.getToken()}` }
    }),
    enabled: mockAuth.isAuthenticated(),
  });
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Orders</AlertTitle>
        <AlertDescription>{(error as Error).message}</AlertDescription>
      </Alert>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Orders</CardTitle>
        <CardDescription>A list of all submitted orders.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
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
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-muted/50"
                  >
                    <TableCell className="font-mono text-xs">{order.id}</TableCell>
                    <TableCell className="font-mono text-xs">{order.quoteId}</TableCell>
                    <TableCell>
                      <Badge
                        className={cn({
                          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': order.status === 'paid',
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200': order.status === 'pending',
                        })}
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(order.submittedAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/quotes/${order.quoteId}`}>View Quote</Link>
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
export function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(mockAuth.isAuthenticated());
  useEffect(() => {
    const checkAuth = () => setIsAuthenticated(mockAuth.isAuthenticated());
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
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Manage and review all incoming orders.
            </p>
          </div>
          {isAuthenticated ? (
            <AdminDashboard />
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Access Denied</AlertTitle>
              <AlertDescription>You must be logged in as an administrator to view this page.</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
      <HelpButton />
      <Toaster richColors closeButton />
    </AppLayout>
  );
}