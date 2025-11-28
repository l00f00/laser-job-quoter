import { AppLayout } from '@/components/layout/AppLayout';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Upload, Gem, Zap, LifeBuoy, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
const featureCards = [
  {
    icon: Upload,
    title: 'Instant Upload',
    description: 'Drag and drop your SVG, PNG, or JPG files to get started in seconds.',
  },
  {
    icon: Gem,
    title: 'Rich Material Library',
    description: 'Choose from a wide variety of woods, acrylics, and plastics.',
  },
  {
    icon: Zap,
    title: 'Live Pricing',
    description: 'Our smart engine calculates your price instantly as you make changes.',
  },
  {
    icon: LifeBuoy,
    title: 'Expert Help',
    description: 'Get assistance from our team at any step of the process.',
  },
];
export function HomePage() {
  return (
    <AppLayout>
      <ThemeToggle />
      <div className="relative overflow-hidden">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-24 md:py-32 lg:py-40 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-block bg-indigo-100 text-[rgb(99,102,241)] font-semibold rounded-full px-4 py-1 text-sm mb-4">
                LuxQuote — Instant Laser Job Quoter
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-foreground text-balance">
                Beautiful Laser Cutting Quotes, <span className="text-gradient bg-gradient-to-r from-[rgb(245,128,37)] to-[rgb(230,90,27)]">Instantly</span>
              </h1>
              <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground text-balance">
                From prototype to production, get precise pricing for your laser cutting and engraving projects in real-time. Upload your design and see the magic happen.
              </p>
              <div className="mt-10 flex justify-center">
                <Button asChild size="lg" className="text-lg px-8 py-6 bg-[rgb(245,128,37)] hover:bg-[rgb(230,90,27)] text-white shadow-primary hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                  <Link to="/quote">
                    Start a Quote <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
        {/* Features Section */}
        <div className="bg-muted/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-16 md:py-24 lg:py-32">
              <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-display font-bold">A Seamless Quoting Experience</h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  We've streamlined every step to make getting a quote as simple and transparent as possible.
                </p>
              </div>
              <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {featureCards.map((feature, i) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                  >
                    <Card className="h-full text-center shadow-soft hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
                      <CardHeader>
                        <div className="mx-auto bg-indigo-100 text-[rgb(99,102,241)] h-12 w-12 rounded-lg flex items-center justify-center">
                          <feature.icon className="h-6 w-6" />
                        </div>
                        <CardTitle className="mt-4">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{feature.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <footer className="text-center py-8 text-muted-foreground/80">
          <p>Built with ❤��� at Cloudflare</p>
        </footer>
      </div>
    </AppLayout>
  );
}