import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingSplashProps {
  onComplete: () => void;
  minDuration?: number;
}

export function LoadingSplash({ onComplete, minDuration = 3500 }: LoadingSplashProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 100 / (minDuration / 50);
      });
    }, 50);

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 600);
    }, minDuration);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [minDuration, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        >
          {/* Animated gradient background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-blue-600/15 to-cyan-600/20"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Floating orbs */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-32 h-32 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${['#8b5cf6', '#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b'][i]}40 0%, transparent 70%)`,
                  left: `${[10, 80, 20, 70, 40, 60][i]}%`,
                  top: `${[20, 30, 70, 80, 50, 10][i]}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  x: [0, 15, 0],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 3 + i * 0.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.3,
                }}
              />
            ))}
          </div>

          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center space-y-10">
            {/* Logo container */}
            <motion.div
              className="relative"
              initial={{ scale: 0, rotate: -180, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ 
                duration: 1.2, 
                ease: [0.175, 0.885, 0.32, 1.275],
                delay: 0.2
              }}
            >
              {/* Outer glow ring */}
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 blur-2xl"
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.4, 0.7, 0.4],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Logo circle */}
              <div className="relative w-36 h-36 rounded-full bg-gradient-to-br from-purple-500 via-blue-600 to-cyan-500 p-1 shadow-2xl">
                <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                  <svg
                    className="w-18 h-18 text-primary"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <motion.path
                      d="M12 2L2 7l10 5 10-5-10-5z"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 1.5, delay: 0.5 }}
                    />
                    <motion.path
                      d="M2 17l10 5 10-5"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 1.5, delay: 0.8 }}
                    />
                    <motion.path
                      d="M2 12l10 5 10-5"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 1.5, delay: 1.1 }}
                    />
                  </svg>
                </div>
              </div>
            </motion.div>

            {/* Title */}
            <motion.div
              className="flex flex-col items-center space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
                Seen
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">
                Ваша персональная медиатека
              </p>
              
              {/* Progress bar */}
              <motion.div 
                className="w-48 h-1 bg-muted/30 rounded-full overflow-hidden mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                <motion.div 
                  className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 rounded-full"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </motion.div>
            </motion.div>
          </div>

          {/* Version info */}
          <motion.div
            className="absolute bottom-8 text-xs bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: 2 }}
          >
            v1.0.0
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

