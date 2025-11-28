import { useState } from 'react';
import { LifeBuoy, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { motion } from 'framer-motion';
export function HelpButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const message = formData.get('message') as string;
    if (!message.trim()) {
      toast.error('Message is required.');
      setIsSubmitting(false);
      return;
    }
    try {
      await api('/api/client-errors', {
        method: 'POST',
        body: JSON.stringify({
          message: `HELP REQUEST: ${message}`,
          source: 'HelpButton',
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }),
      });
      toast.success('Help request sent!', {
        description: 'Our team will get back to you shortly.',
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      });
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to send request', {
        description: 'Please try again later or contact us directly.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            size="lg"
            className="rounded-full h-16 w-16 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 bg-[rgb(99,102,241)] hover:bg-[rgb(80,83,200)]"
          >
            <LifeBuoy className="h-8 w-8" />
          </Button>
        </SheetTrigger>
        <SheetContent>
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="h-full flex flex-col"
          >
            <SheetHeader>
              <SheetTitle>Need Help?</SheetTitle>
              <SheetDescription>
                Our experts are here to assist. Describe your issue or question below.
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={handleSubmit} className="py-4 space-y-4 flex-grow flex flex-col">
              <div className="space-y-2">
                <Label htmlFor="name">Name (Optional)</Label>
                <Input id="name" name="name" placeholder="Your Name" defaultValue="Demo User" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input id="email" name="email" type="email" placeholder="your@email.com" defaultValue="demo@luxquote.com" />
              </div>
              <div className="space-y-2 flex-grow flex flex-col">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="How can we help you with your design or quote?"
                  className="flex-grow"
                  required
                />
              </div>
              <SheetFooter>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  <Send className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Sending...' : 'Send Request'}
                </Button>
              </SheetFooter>
            </form>
          </motion.div>
        </SheetContent>
      </Sheet>
    </div>
  );
}