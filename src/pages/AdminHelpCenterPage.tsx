import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
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
import { motion, AnimatePresence } from 'framer-motion';
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
  const [deleteConfirm, setDeleteConfirm] = useState<Article | null>(null);
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
      setDeleteConfirm(null);
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
      {error && <Alert variant="destructive"><AlertTriangle /> <AlertTitle>Error</AlertTitle><AlertDescription>{(error as Error).message}</AlertDescription></Alert>}
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Created</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-64" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                </TableRow>
              ))
            ) : (
              <AnimatePresence>
                {articles?.map((article, i) => (
                  <motion.tr key={article.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <TableCell className="font-medium">{article.title}</TableCell>
                    <TableCell>{new Date(article.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingArticle(article); setIsModalOpen(true); }}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(article)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </TableBody>
        </Table>
      </div>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingArticle ? 'Edit' : 'Add'} Article</DialogTitle></DialogHeader>
          <ArticleForm article={editingArticle} onSave={(data) => mutation.mutate(data)} onCancel={() => setIsModalOpen(false)} />
        </DialogContent>
      </Dialog>
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm Deletion</DialogTitle></DialogHeader>
          <DialogDescription>Are you sure you want to delete the article "{deleteConfirm?.title}"?</DialogDescription>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}