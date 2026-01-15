import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingSplashProps {
  onComplete: () => void;
  minDuration?: number;
}

export function LoadingSplash({ onComplete, minDuration = 3500 }: LoadingSplashProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 600);
    }, minDuration);

    return () => clearTimeout(timer);
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
            className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-blue-600/10 to-cyan-600/10"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center space-y-12">
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
                className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 blur-2xl opacity-40"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.4, 0.6, 0.4],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Logo circle */}
              <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 via-blue-600 to-cyan-500 p-1">
                <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                  <svg
                    className="w-16 h-16 text-primary"
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
              className="flex flex-col items-center space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
                Atom Titles-Hive
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">
                Ваша персональная медиатека
              </p>
            </motion.div>

            {/* Loading dots */}
            <motion.div
              className="flex items-center space-x-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500"
                  animate={{
                    y: [0, -12, 0],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </motion.div>
          </div>

          {/* Version info */}
          <motion.div
            className="absolute bottom-8 text-xs text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 2 }}
          >
            v1.0.0
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
