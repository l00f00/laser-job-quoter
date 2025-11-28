import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { mockAuth } from '@/lib/auth-utils';
import { api } from '@/lib/api-client';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
export default function AdminStripePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'unknown' | 'connected' | 'failed'>('unknown');
  if (mockAuth.getRole() !== 'admin') {
    return <AppLayout container><Alert variant="destructive"><AlertTriangle /> <AlertTitle>Access Denied</AlertTitle><AlertDescription>You must be an admin to view this page.</AlertDescription></Alert></AppLayout>;
  }
  const handleTestConnection = async () => {
    setIsLoading(true);
    try {
      const res = await api<{ connected: boolean }>('/api/admin/stripe/test', { method: 'POST' });
      if (res.connected) {
        setStatus('connected');
        toast.success('Stripe connection successful!');
      } else {
        setStatus('failed');
        toast.error('Stripe connection failed. Secret key may be missing.');
      }
    } catch (e) {
      setStatus('failed');
      toast.error('Failed to test connection', { description: (e as Error).message });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <AppLayout container>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold font-display">Stripe Configuration</h1>
          <p className="text-muted-foreground">Test your Stripe integration status.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
            <CardDescription>
              Stripe secrets are managed via Cloudflare Worker secrets and are not exposed here.
              Use the button below to verify if the secret key is set correctly in your environment.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <Badge variant={status === 'connected' ? 'default' : 'secondary'} className={status === 'connected' ? 'bg-green-500 text-white' : ''}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
            <Button onClick={handleTestConnection} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test Connection
            </Button>
          </CardContent>
        </Card>
        <Alert className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>How to Configure Secrets</AlertTitle>
          <AlertDescription>
            To set your Stripe keys for production, use the Wrangler CLI:
            <code className="block bg-muted p-2 rounded-md my-2 text-sm font-mono">
              wrangler secret put STRIPE_SECRET_KEY
            </code>
            This securely stores the secret without exposing it in your code.
          </AlertDescription>
        </Alert>
      </div>
    </AppLayout>
  );
}