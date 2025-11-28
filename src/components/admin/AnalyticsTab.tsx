import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { api } from '@/lib/api-client';
import { mockAuth } from '@/lib/auth-utils';
import type { Material } from '@shared/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
const COLORS = ['#6366F1', '#F58125', '#10B981', '#F97316', '#8884D8'];
const cardVariants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: { scale: 1, opacity: 1 },
};
export function AnalyticsTab() {
  const { data: analytics, isLoading: isLoadingAnalytics } = useQuery<{ totalRevenue: number; orderCount: number; topMaterials: { name: string; value: number }[] }>({
    queryKey: ['admin-analytics'],
    queryFn: () => api('/api/admin/analytics', { headers: { 'Authorization': `Bearer ${mockAuth.getToken()}` } }),
  });
  const { data: materials, isLoading: isLoadingMaterials } = useQuery<Material[]>({
    queryKey: ['materials'],
    queryFn: () => api('/api/materials'),
  });
  const materialsById = new Map(materials?.map(m => [m.id, m.name]));
  const pieData = analytics?.topMaterials.map(m => ({ ...m, name: materialsById.get(m.name) || 'Unknown' }));
  const isLoading = isLoadingAnalytics || isLoadingMaterials;
  if (isLoading) return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent><Skeleton className="h-12 w-3/4" /></CardContent></Card>
      <Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent><Skeleton className="h-12 w-1/2" /></CardContent></Card>
      <Card className="md:col-span-2"><CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader><CardContent className="h-80"><Skeleton className="h-full w-full" /></CardContent></Card>
    </div>
  );
  return (
    <motion.div
      className="grid gap-6 md:grid-cols-2"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={cardVariants}>
        <Card>
          <CardHeader><CardTitle>Total Revenue</CardTitle></CardHeader>
          <CardContent><p className="text-4xl font-bold">${analytics?.totalRevenue.toFixed(2)}</p></CardContent>
        </Card>
      </motion.div>
      <motion.div variants={cardVariants}>
        <Card>
          <CardHeader><CardTitle>Total Orders</CardTitle></CardHeader>
          <CardContent><p className="text-4xl font-bold">{analytics?.orderCount}</p></CardContent>
        </Card>
      </motion.div>
      <motion.div variants={cardVariants} className="md:col-span-2">
        <Card>
          <CardHeader><CardTitle>Top Materials Used</CardTitle></CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData?.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
export default AnalyticsTab;