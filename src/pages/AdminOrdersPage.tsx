import { OrdersTab } from '@/components/admin/OrdersTab';
import { ShieldCheck } from 'lucide-react';
export default function AdminOrdersPage() {
  return (
    <div>
      <div className="text-center mb-12">
        <ShieldCheck className="mx-auto h-12 w-12 text-indigo-500" />
        <h1 className="mt-4 text-4xl md:text-5xl font-display font-bold">Manage Orders</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Review, update, and download assets for all submitted orders.
        </p>
      </div>
      <OrdersTab />
    </div>
  );
}