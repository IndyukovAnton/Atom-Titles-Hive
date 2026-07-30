import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';

import { AnimatedBackground } from '@/components/ui/AnimatedBackground';
import { UpdateChecker } from '@/components/ui/UpdateChecker';
import { AlertCircle, Layers } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
  error?: string | null;
}

export default function AuthLayout({ children, error }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900 p-4 relative overflow-hidden">
      {/* Background decoration */}
      <AnimatedBackground />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(var(--primary),0.05)_1px,transparent_1px)] bg-[length:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black,transparent)] opacity-30 animate-[spin_240s_linear_infinite]" />
      </div>

      <div className="absolute top-3 left-3 z-20 flex items-center gap-2.5 bg-background/40 backdrop-blur-md rounded-full pl-1.5 pr-4 py-1.5">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 via-blue-600 to-cyan-500 p-px shadow-md">
          <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
            <Layers className="w-4 h-4 text-primary" />
          </div>
        </div>
        <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
          Seen
        </span>
      </div>

      <div className="absolute top-3 right-3 z-20">
        <UpdateChecker className="bg-background/40 backdrop-blur-md hover:bg-background/60 rounded-full" />
      </div>

      <Card className="w-full max-w-[440px] py-6 shadow-2xl backdrop-blur-xl bg-card/80 border-white/20 dark:border-white/10 relative z-10 animate-in fade-in zoom-in-95 duration-500 slide-in-from-bottom-4">
        <CardContent className="space-y-5 px-6">
          {error && (
            <div className="bg-destructive/15 text-destructive border border-destructive/20 text-sm p-3 rounded-md flex items-center gap-2 animate-in slide-in-from-top-2 fade-in">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          {children}
        </CardContent>
      </Card>
    </div>
  );
}
