import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { mockAuth } from '@/lib/auth-utils';
import { api } from '@/lib/api-client';
import type { Article } from '@shared/types';
import { toast } from 'sonner';
import { PlusCircle, Edit, Trash2, AlertTriangle } from 'lucide-react';
const ArticleForm = ({ article, onSave, onCancel }: { article?: Article | null, onSave: (data: Partial<Article>) => void, onCancel: () => void }) => {
  const [formData, setFormData] = useState<Partial<Article>>(article || {});
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><Label>Title</Label><Input name="title" value={formData.title || ''} onChange={handleChange} required /></div>
      <div><Label>Content (Markdown supported)</Label><Textarea name="content" value={formData.content || ''} onChange={handleChange} rows={10} /></div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save Article</Button>
      </DialogFooter>
    </form>
  );
};
export default function AdminHelpCenterPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const { data: articles, isLoading, error } = useQuery<Article[]>({
    queryKey: ['admin-articles'],
    queryFn: () => api('/api/admin/articles'),
    enabled: mockAuth.getRole() === 'admin',
  });
  const mutation = useMutation({
    mutationFn: (data: Partial<Article>) => {
      const url = data.id ? `/api/admin/articles/${data.id}` : '/api/admin/articles';
      const method = data.id ? 'PUT' : 'POST';
      return api(url, { method, body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      toast.success('Article saved!');
      setIsModalOpen(false);
    },
    onError: (err) => toast.error('Failed to save article', { description: (err as Error).message }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/api/admin/articles/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      toast.success('Article deleted!');
    },
    onError: (err) => toast.error('Failed to delete article', { description: (err as Error).message }),
  });
  if (mockAuth.getRole() !== 'admin') {
    return <AppLayout container><Alert variant="destructive"><AlertTriangle /> <AlertTitle>Access Denied</AlertTitle><AlertDescription>You must be an admin to view this page.</AlertDescription></Alert></AppLayout>;
  }
  return (
    <AppLayout container>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold font-display">Help Center</h1>
          <p className="text-muted-foreground">Manage help articles for users.</p>
        </div>
        <Button onClick={() => { setEditingArticle(null); setIsModalOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Add Article</Button>
      </div>
      {isLoading && <Skeleton className="h-64 w-full" />}
      {error && <Alert variant="destructive"><AlertTriangle /> <AlertTitle>Error</AlertTitle><AlertDescription>{(error as Error).message}</AlertDescription></Alert>}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Created</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {articles?.map(article => (
              <TableRow key={article.id}>
                <TableCell className="font-medium">{article.title}</TableCell>
                <TableCell>{new Date(article.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => { setEditingArticle(article); setIsModalOpen(true); }}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => window.confirm('Are you sure?') && deleteMutation.mutate(article.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingArticle ? 'Edit' : 'Add'} Article</DialogTitle></DialogHeader>
          <ArticleForm article={editingArticle} onSave={(data) => mutation.mutate(data)} onCancel={() => setIsModalOpen(false)} />
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}