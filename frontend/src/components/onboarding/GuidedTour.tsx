
import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';

export interface TourStep {
  targetId?: string; // If undefined, show as modal in center
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface GuidedTourProps {
  steps: TourStep[];
  onComplete: () => void;
  onSkip: () => void;
  isOpen: boolean;
}

export function GuidedTour({ steps, onComplete, onSkip, isOpen }: GuidedTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const currentStep = steps[currentStepIndex];

  const updateTargetRect = useCallback(() => {
    if (currentStep.targetId) {
      const element = document.getElementById(currentStep.targetId);
      if (element) {
        setTargetRect(element.getBoundingClientRect());
        // Scroll into view if needed
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setTargetRect(null);
      }
    } else {
        setTargetRect(null);
    }
  }, [currentStep]);

  useEffect(() => {
    if (isOpen) {
      // Small delay to allow UI to settle
      setTimeout(updateTargetRect, 100);
      window.addEventListener('resize', updateTargetRect);
      return () => window.removeEventListener('resize', updateTargetRect);
    }
  }, [isOpen, currentStepIndex, updateTargetRect]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  if (!isOpen) return null;

  // Calculate tooltip position
  let tooltipStyle = {};
  if (targetRect && currentStep.targetId) {
    const gap = 12;
    const tooltipWidth = 320;
    const tooltipHeight = 200; // Estimated max height

    // Default: try bottom center
    let top = targetRect.bottom + gap;
    let left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);

    // Smart vertical positioning: if bottom goes off-screen, show at top
    if (top + tooltipHeight > window.innerHeight) {
        top = targetRect.top - tooltipHeight - gap;
        // If still off-screen at top (e.g. very large target), stick to bottom but adjust
        if (top < 10) top = targetRect.bottom + gap;
    }

    // Horizontal Boundary checks
    if (left < 10) left = 10;
    if (left + tooltipWidth > window.innerWidth - 10) left = window.innerWidth - tooltipWidth - 10;

    tooltipStyle = {
        top: top,
        left: left,
        position: 'fixed' as const,
    };
  } else {
    // Center screen
    tooltipStyle = {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        position: 'fixed' as const,
    };
  }

  return (
    <div className="fixed inset-0 z-[100] isolate pointer-events-auto">
        {/* Overlay with cutout */}
        {targetRect ? (
             <>
                <div className="absolute inset-0 bg-black/60 transition-all duration-300 ease-in-out" 
                     style={{ 
                        clipPath: `polygon(
                            0% 0%, 
                            0% 100%, 
                            100% 100%, 
                            100% 0%, 
                            ${targetRect.left}px 0%, 
                            ${targetRect.left}px ${targetRect.top}px, 
                            ${targetRect.right}px ${targetRect.top}px, 
                            ${targetRect.right}px ${targetRect.bottom}px, 
                            ${targetRect.left}px ${targetRect.bottom}px, 
                            ${targetRect.left}px 0%
                        )`
                     }}
                />
                {/* Highlight ring */}
                <motion.div 
                    layoutId="highlight-ring"
                    className="absolute border-2 border-primary rounded-md shadow-[0_0_20px_rgba(var(--primary),0.5)] pointer-events-none"
                    style={{
                        top: targetRect.top - 4,
                        left: targetRect.left - 4,
                        width: targetRect.width + 8,
                        height: targetRect.height + 8,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
             </>
        ) : (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        )}

      {/* Tooltip Card */}
      <AnimatePresence mode="wait">
        <motion.div
            key={currentStepIndex}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            style={tooltipStyle as React.CSSProperties}
            className="z-[101] w-[320px]"
        >
            <Card className="shadow-2xl border-primary/20">
                <CardHeader>
                    <CardTitle className="flex justify-between items-center text-lg">
                        {currentStep.title}
                        <span className="text-xs font-normal text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                            {currentStepIndex + 1} / {steps.length}
                        </span>
                    </CardTitle>
                    <CardDescription>
                        {currentStep.description}
                    </CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-between gap-2">
                    <Button variant="ghost" size="sm" onClick={onSkip}>
                        Пропустить
                    </Button>
                    <div className="flex gap-2">
                        {currentStepIndex > 0 && (
                            <Button variant="outline" size="sm" onClick={handlePrev}>
                                Назад
                            </Button>
                        )}
                        <Button size="sm" onClick={handleNext}>
                            {currentStepIndex === steps.length - 1 ? 'Завершить' : 'Далее'}
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
