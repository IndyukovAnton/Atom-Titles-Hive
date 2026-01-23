import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

import { AnimatedBackground } from '@/components/ui/AnimatedBackground';
import { AlertCircle } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  error?: string | null;
}

export default function AuthLayout({ children, title, subtitle, error }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900 p-4 relative overflow-hidden">
      {/* Background decoration */}
      {/* Background decoration */}
      <AnimatedBackground />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(var(--primary),0.05)_1px,transparent_1px)] bg-[length:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black,transparent)] opacity-30 animate-[spin_240s_linear_infinite]" />
      </div>

      <Card className="w-full max-w-[440px] shadow-2xl backdrop-blur-xl bg-card/80 border-white/20 dark:border-white/10 relative z-10 animate-in fade-in zoom-in-95 duration-500 slide-in-from-bottom-4">
        <CardHeader className="text-center space-y-2 pb-6">
          {title && <CardTitle className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">{title}</CardTitle>}
          {subtitle && <CardDescription className="text-lg font-medium">{subtitle}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-6">
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
