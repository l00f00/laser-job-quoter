import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { mockAuth } from '@/lib/auth-utils';
import FullPageLoader from '@/components/common/FullPageLoader';
export default function AdminLayout() {
  const navigate = useNavigate();
  const isAuthenticated = mockAuth.isAuthenticated();
  const isAdmin = mockAuth.getRole() === 'admin';
  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      toast.error('Admin access required.', {
        description: 'You have been redirected.',
      });
      navigate('/quotes');
    }
  }, [isAuthenticated, isAdmin, navigate]);
  if (!isAuthenticated || !isAdmin) {
    return <FullPageLoader />;
  }
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <Outlet />
        </div>
      </div>
    </AppLayout>
  );
}