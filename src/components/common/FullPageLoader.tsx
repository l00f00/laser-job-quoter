import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
const FullPageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="w-full max-w-md p-8 space-y-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-10 w-1/2 mx-auto" />
    </div>
  </div>
);
export default React.memo(FullPageLoader);