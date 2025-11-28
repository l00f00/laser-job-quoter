import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { mockAuth } from '@/lib/auth-utils';
import { api } from '@/lib/api-client';
import type { Material } from '@shared/types';
import { toast } from 'sonner';
import { PlusCircle, Edit, Trash2, AlertTriangle } from 'lucide-react';
const MaterialForm = ({ material, onSave, onCancel }: { material?: Material | null, onSave: (data: Partial<Material>) => void, onCancel: () => void }) => {
  const [formData, setFormData] = useState<Partial<Material>>(material || {});
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const isNumeric = ['costPerSqMm', 'kerfMm', 'minFeatureMm'].includes(name);
    setFormData(prev => ({ ...prev, [name]: isNumeric ? Number(value) : value }));
  };
  const handleThicknessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, thicknessesMm: e.target.value.split(',').map(Number).filter(Boolean) }));
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><Label>Name</Label><Input name="name" value={formData.name || ''} onChange={handleChange} required /></div>
      <div><Label>Description</Label><Input name="description" value={formData.description || ''} onChange={handleChange} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Cost/SqMm</Label><Input type="number" name="costPerSqMm" value={formData.costPerSqMm || ''} onChange={handleChange} step="0.0001" /></div>
        <div><Label>Kerf (mm)</Label><Input type="number" name="kerfMm" value={formData.kerfMm || ''} onChange={handleChange} step="0.01" /></div>
        <div><Label>Min Feature (mm)</Label><Input type="number" name="minFeatureMm" value={formData.minFeatureMm || ''} onChange={handleChange} step="0.1" /></div>
        <div><Label>Thicknesses (mm, comma-sep)</Label><Input name="thicknessesMm" value={formData.thicknessesMm?.join(',') || ''} onChange={handleThicknessChange} /></div>
      </div>
      <div><Label>Thumbnail URL</Label><Input name="thumbnailUrl" value={formData.thumbnailUrl || ''} onChange={handleChange} /></div>
      <div><Label>Texture URL</Label><Input name="textureUrl" value={formData.textureUrl || ''} onChange={handleChange} /></div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save Material</Button>
      </DialogFooter>
    </form>
  );
};
export default function AdminMaterialsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const { data: materials, isLoading, error } = useQuery<Material[]>({
    queryKey: ['admin-materials'],
    queryFn: () => api('/api/admin/materials'),
    enabled: mockAuth.getRole() === 'admin',
  });
  const mutation = useMutation({
    mutationFn: (data: Partial<Material>) => {
      const url = data.id ? `/api/admin/materials/${data.id}` : '/api/admin/materials';
      const method = data.id ? 'PUT' : 'POST';
      return api(url, { method, body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-materials'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success('Material saved!');
      setIsModalOpen(false);
    },
    onError: (err) => toast.error('Failed to save material', { description: (err as Error).message }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/api/admin/materials/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-materials'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success('Material deleted!');
    },
    onError: (err) => toast.error('Failed to delete material', { description: (err as Error).message }),
  });
  if (mockAuth.getRole() !== 'admin') {
    return <AppLayout container><Alert variant="destructive"><AlertTriangle /> <AlertTitle>Access Denied</AlertTitle><AlertDescription>You must be an admin to view this page.</AlertDescription></Alert></AppLayout>;
  }
  return (
    <AppLayout container>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold font-display">Manage Materials</h1>
          <p className="text-muted-foreground">Add, edit, or delete materials available for quotes.</p>
        </div>
        <Button onClick={() => { setEditingMaterial(null); setIsModalOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Add Material</Button>
      </div>
      {isLoading && <Skeleton className="h-64 w-full" />}
      {error && <Alert variant="destructive"><AlertTriangle /> <AlertTitle>Error</AlertTitle><AlertDescription>{(error as Error).message}</AlertDescription></Alert>}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Cost/SqMm</TableHead><TableHead>Kerf</TableHead><TableHead>Thicknesses</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {materials?.map(mat => (
              <TableRow key={mat.id}>
                <TableCell className="font-medium">{mat.name}</TableCell>
                <TableCell>${mat.costPerSqMm.toFixed(4)}</TableCell>
                <TableCell>{mat.kerfMm}mm</TableCell>
                <TableCell>{mat.thicknessesMm.join(', ')}mm</TableCell>
                <TableCell className="space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => { setEditingMaterial(mat); setIsModalOpen(true); }}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => window.confirm('Are you sure?') && deleteMutation.mutate(mat.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingMaterial ? 'Edit' : 'Add'} Material</DialogTitle></DialogHeader>
          <MaterialForm material={editingMaterial} onSave={(data) => mutation.mutate(data)} onCancel={() => setIsModalOpen(false)} />
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}