import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FallingTextProps {
  text?: string;
}

export function FallingText({ text = 'ATOM TITLES-HIVE' }: FallingTextProps) {
  const [isActive, setIsActive] = useState(false);
  const [letters, setLetters] = useState<Array<{ char: string; id: number }>>([]);

  useEffect(() => {
    if (!isActive) {
      setLetters([]);
      return;
    }

    const chars = text.split('');
    const newLetters = chars.map((char, index) => ({
      char,
      id: Date.now() + index,
    }));

    setLetters(newLetters);

    const timer = setTimeout(() => {
      setIsActive(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [isActive, text]);

  const activate = useCallback(() => {
    setIsActive(true);
  }, []);

  return {
    FallingTextComponent: (
      <AnimatePresence>
        {isActive && (
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {letters.map((letter, index) => (
              <motion.div
                key={letter.id}
                className="absolute text-6xl font-bold text-primary/80"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: -100,
                  rotate: Math.random() * 360,
                }}
                animate={{
                  y: window.innerHeight + 100,
                  rotate: Math.random() * 360 + 720,
                }}
                exit={{
                  opacity: 0,
                }}
                transition={{
                  duration: Math.random() * 2 + 3,
                  delay: index * 0.1,
                  ease: 'easeIn',
                }}
              >
                {letter.char}
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    ),
    activate,
  };
}
