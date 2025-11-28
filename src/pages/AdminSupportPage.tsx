import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { mockAuth } from '@/lib/auth-utils';
import { api } from '@/lib/api-client';
import type { HelpRequest } from '@shared/types';
import { toast } from 'sonner';
import { AlertTriangle, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
export default function AdminSupportPage() {
  const queryClient = useQueryClient();
  const { data: requests, isLoading, error } = useQuery<HelpRequest[]>({
    queryKey: ['admin-support'],
    queryFn: () => api('/api/admin/support'),
    enabled: mockAuth.getRole() === 'admin',
    refetchInterval: 30000,
  });
  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: 'open' | 'resolved' }) => {
      return api(`/api/admin/support/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-support'] });
      toast.success('Request status updated!');
    },
    onError: (err) => toast.error('Failed to update status', { description: (err as Error).message }),
  });
  if (mockAuth.getRole() !== 'admin') {
    return <AppLayout container><Alert variant="destructive"><AlertTriangle /> <AlertTitle>Access Denied</AlertTitle><AlertDescription>You must be an admin to view this page.</AlertDescription></Alert></AppLayout>;
  }
  return (
    <AppLayout container>
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-display">Support Requests</h1>
        <p className="text-muted-foreground">View and manage user help requests.</p>
      </div>
      {isLoading && <Skeleton className="h-64 w-full" />}
      {error && <Alert variant="destructive"><AlertTriangle /> <AlertTitle>Error</AlertTitle><AlertDescription>{(error as Error).message}</AlertDescription></Alert>}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Message</TableHead><TableHead>Quote ID</TableHead><TableHead>User ID</TableHead><TableHead>Status</TableHead><TableHead>Timestamp</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {requests?.map(req => (
              <TableRow key={req.id}>
                <TableCell className="max-w-sm truncate">{req.message}</TableCell>
                <TableCell>{req.quoteId ? <Button variant="link" asChild className="p-0 h-auto"><Link to={`/quote/${req.quoteId}`}>{req.quoteId}</Link></Button> : 'N/A'}</TableCell>
                <TableCell className="font-mono text-xs">{req.userId}</TableCell>
                <TableCell>
                  <Badge variant={req.status === 'open' ? 'destructive' : 'default'} className={cn({'bg-green-500': req.status === 'resolved'})}>
                    {req.status}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(req.timestamp).toLocaleString()}</TableCell>
                <TableCell>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => mutation.mutate({ id: req.id, status: req.status === 'open' ? 'resolved' : 'open' })}
                  >
                    {req.status === 'open' ? <><Check className="mr-2 h-4 w-4" /> Mark Resolved</> : <><X className="mr-2 h-4 w-4" /> Mark Open</>}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AppLayout>
  );
}