import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { QuotesList } from '@/components/quotes/QuotesList';
import { HelpButton } from '@/components/HelpButton';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { mockAuth } from '@/lib/auth-utils';
import { LoginModal } from '@/components/auth/LoginModal';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
const EmptyStateCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        // Draw a simple laser icon
        ctx.strokeStyle = '#9ca3af'; // gray-400
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(10, 30, 20, 40); // Laser body
        ctx.moveTo(30, 40);
        ctx.lineTo(40, 40); // Nozzle
        ctx.moveTo(30, 60);
        ctx.lineTo(40, 60);
        ctx.stroke();
        // Draw a laser beam with glow
        ctx.beginPath();
        ctx.moveTo(45, 50);
        ctx.lineTo(85, 50);
        ctx.strokeStyle = '#f59e0b'; // amber-500
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 10;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }
  }, []);
  return <canvas ref={canvasRef} className="w-24 h-24 mx-auto" />;
};
export function QuotesListPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(mockAuth.isAuthenticated());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  useEffect(() => {
    const checkAuth = () => setIsAuthenticated(mockAuth.isAuthenticated());
    window.addEventListener('storage', checkAuth);
    if (!mockAuth.isAuthenticated()) {
      setIsLoginModalOpen(true);
    }
    return () => window.removeEventListener('storage', checkAuth);
  }, []);
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
            <div className="text-left">
              <h1 className="text-4xl md:text-5xl font-display font-bold">Your Saved Quotes</h1>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
                Review, duplicate, or export your saved projects.
              </p>
            </div>
            <Button asChild size="lg" className="bg-[rgb(245,128,37)] hover:bg-[rgb(230,90,27)] text-white">
              <Link to="/quote">
                Create New Quote <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          {isAuthenticated ? (
            <QuotesList />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center py-16 border-2 border-dashed rounded-lg"
            >
              <EmptyStateCanvas />
              <h3 className="mt-4 text-lg font-medium">Please Log In</h3>
              <p className="mt-1 text-sm text-muted-foreground">You need to be logged in to view your saved quotes.</p>
              <Button onClick={() => setIsLoginModalOpen(true)} className="mt-6 bg-[rgb(99,102,241)] hover:bg-[rgb(80,83,200)] text-white">
                Login
              </Button>
            </motion.div>
          )}
        </div>
      </div>
      <LoginModal
        open={isLoginModalOpen}
        onOpenChange={setIsLoginModalOpen}
        onLoginSuccess={() => setIsAuthenticated(true)}
      />
      <HelpButton />
      <Toaster richColors closeButton />
    </AppLayout>
  );
}