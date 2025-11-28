import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mockAuth } from '@/lib/auth-utils';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginSuccess: () => void;
}
export function LoginModal({ open, onOpenChange, onLoginSuccess }: LoginModalProps) {
  const [email, setEmail] = useState('demo@luxquote.com');
  const [password, setPassword] = useState('demo123');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get('role') === 'admin') {
      setEmail('admin@luxquote.com');
      setPassword('admin123');
    }
  }, [searchParams]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await mockAuth.login(email, password);
      const user = mockAuth.getUser();
      const role = user?.role || 'user';
      toast.success(`Welcome, ${role.charAt(0).toUpperCase() + role.slice(1)}!`, {
        description: 'Redirecting to your dashboard...',
      });
      onLoginSuccess();
      setTimeout(() => {
        if (role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/quotes');
        }
        onOpenChange(false);
      }, 1000);
    } catch (error) {
      toast.error('Login Failed', {
        description: (error as Error).message,
      });
      setIsLoading(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <form onSubmit={handleSubmit}>
            <DialogHeader className="p-6">
              <DialogTitle>Login to Continue</DialogTitle>
              <DialogDescription>
                Please log in to save your quote. Use the demo credentials to proceed.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 px-6">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center px-6">
              Demo: demo@luxquote.com / demo123 | Admin: admin@luxquote.com / admin123
            </p>
            <DialogFooter className="mt-4 p-6 bg-muted/50">
              <Button type="submit" disabled={isLoading} className="w-full bg-[rgb(245,128,37)] hover:bg-[rgb(230,90,27)] text-white">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </DialogFooter>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}