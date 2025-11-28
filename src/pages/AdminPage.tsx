import { useEffect, useState, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, AlertTriangle, Edit, BarChart, CreditCard } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { HelpButton } from '@/components/HelpButton';
import { Toaster } from '@/components/ui/sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockAuth } from '@/lib/auth-utils';
import { OrdersTab } from '@/components/admin/OrdersTab';
import { PaymentsTab } from '@/components/admin/PaymentsTab';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
const LazyAnalyticsTab = lazy(() => import('@/components/admin/AnalyticsTab').then(module => ({ default: module.AnalyticsTab })));
const AnalyticsFallback = () => (
  <div className="grid gap-6 md:grid-cols-2">
    <Skeleton className="h-24 w-full" />
    <Skeleton className="h-24 w-full" />
    <div className="md:col-span-2"><Skeleton className="h-80 w-full" /></div>
  </div>
);
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
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">Manage orders, view analytics, and oversee payments.</p>
          </div>
          {!isAuthenticated || !isAdmin ? (
            <Alert variant="destructive" className="max-w-lg mx-auto">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Access Denied</AlertTitle>
              <AlertDescription>
                You must be logged in as an administrator to view this page.
                <Button asChild variant="link" className="p-0 h-auto ml-1">
                  <Link to="/login">Login as Admin</Link>
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <Tabs defaultValue="orders" className="w-full">
              <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
                <TabsTrigger value="orders"><Edit className="mr-2 h-4 w-4" />Orders</TabsTrigger>
                <TabsTrigger value="analytics"><BarChart className="mr-2 h-4 w-4" />Analytics</TabsTrigger>
                <TabsTrigger value="payments"><CreditCard className="mr-2 h-4 w-4" />Payments</TabsTrigger>
              </TabsList>
              <motion.div
                key="tabs-content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <TabsContent value="orders" className="mt-6"><OrdersTab /></TabsContent>
                <TabsContent value="analytics" className="mt-6">
                  <Suspense fallback={<AnalyticsFallback />}>
                    <LazyAnalyticsTab />
                  </Suspense>
                </TabsContent>
                <TabsContent value="payments" className="mt-6"><PaymentsTab /></TabsContent>
              </motion.div>
            </Tabs>
          )}
        </div>
      </div>
      <HelpButton />
      <Toaster richColors closeButton />
    </AppLayout>
  );
}