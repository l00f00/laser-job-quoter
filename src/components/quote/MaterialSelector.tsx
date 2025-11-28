import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Material } from '@shared/types';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';
interface MaterialSelectorProps {
  selectedMaterialId?: string;
  onSelectMaterial: (material: Material) => void;
}
export function MaterialSelector({ selectedMaterialId, onSelectMaterial }: MaterialSelectorProps) {
  const { data: materials, isLoading, error } = useQuery<Material[]>({
    queryKey: ['materials'],
    queryFn: () => api('/api/materials'),
  });
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }
  if (error) {
    return <div className="text-destructive">Failed to load materials.</div>;
  }
  return (
    <div className="space-y-3">
      {materials?.map((material) => (
        <Card
          key={material.id}
          onClick={() => onSelectMaterial(material)}
          className={cn(
            'cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
            selectedMaterialId === material.id
              ? 'ring-2 ring-[rgb(99,102,241)] shadow-lg'
              : 'shadow-soft'
          )}
        >
          <CardContent className="p-4 flex items-center gap-4 relative">
            {selectedMaterialId === material.id && (
              <div className="absolute top-2 right-2 text-white bg-[rgb(99,102,241)] rounded-full p-0.5 z-10">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            )}
            <div
              className="h-16 w-16 rounded-md flex-shrink-0 bg-cover bg-center relative overflow-hidden"
              style={{ backgroundImage: `url(${material.thumbnailUrl})` }}
            >
              {material.textureUrl && (
                 <div
                    className="absolute inset-0 bg-cover bg-center opacity-30"
                    style={{ backgroundImage: `url(${material.textureUrl})` }}
                 />
              )}
            </div>
            <div>
              <p className="font-semibold text-foreground">{material.name}</p>
              <p className="text-sm text-muted-foreground line-clamp-2">{material.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}