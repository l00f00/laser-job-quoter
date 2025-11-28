import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { mockAuth } from '@/lib/auth-utils';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
const cardVariants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: { scale: 1, opacity: 1 },
};
export default function AdminPricingPage() {
  const [packages, setPackages] = useState([
    { name: 'Economy', leadTime: '5-7 days', machineTimeMultiplier: 1.0 },
    { name: 'Standard', leadTime: '3-4 days', machineTimeMultiplier: 1.5 },
    { name: 'Express', leadTime: '1-2 days', machineTimeMultiplier: 2.5 },
  ]);
  const handleSave = () => {
    // In a real app, this would be a mutation.
    toast.info("Save is disabled in this demo.", {
      description: "Pricing logic is currently client-side."
    });
  };
  if (mockAuth.getRole() !== 'admin') {
    return <AppLayout container><Alert variant="destructive"><AlertTriangle /> <AlertTitle>Access Denied</AlertTitle><AlertDescription>You must be an admin to view this page.</AlertDescription></Alert></AppLayout>;
  }
  return (
    <AppLayout container>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold font-display">Pricing Configuration</h1>
          <p className="text-muted-foreground">Adjust pricing multipliers and lead times.</p>
        </div>
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-6"
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        initial="hidden"
        animate="visible"
      >
        {packages.map((pkg, index) => (
          <motion.div key={pkg.name} variants={cardVariants}>
            <Card>
              <CardHeader><CardTitle>{pkg.name}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Lead Time</Label>
                  <Input
                    value={pkg.leadTime}
                    onChange={(e) => {
                      const newPackages = [...packages];
                      newPackages[index].leadTime = e.target.value;
                      setPackages(newPackages);
                    }}
                    required
                  />
                </div>
                <div>
                  <Label>Multiplier: {pkg.machineTimeMultiplier.toFixed(1)}x</Label>
                  <Slider
                    value={[pkg.machineTimeMultiplier]}
                    onValueChange={([val]) => {
                      const newPackages = [...packages];
                      newPackages[index].machineTimeMultiplier = val;
                      setPackages(newPackages);
                    }}
                    min={0.5}
                    max={3}
                    step={0.1}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
      <Alert className="mt-8">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Developer Note</AlertTitle>
        <AlertDescription>
          Pricing logic is currently managed on the client-side for this demo. A production implementation would involve saving these values to a backend configuration.
        </AlertDescription>
      </Alert>
    </AppLayout>
  );
}