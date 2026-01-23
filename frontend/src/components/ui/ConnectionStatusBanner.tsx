import { useAuthStore } from '../../store/authStore';
import { WifiOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ConnectionStatusBanner = () => {
  const isServerAvailable = useAuthStore((state) => state.isServerAvailable);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  return (
    <AnimatePresence>
      {!isServerAvailable && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-destructive/15 border-b border-destructive/20 relative overflow-hidden"
        >
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-destructive">
              <div className="flex-shrink-0">
                <WifiOff className="h-4 w-4" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="font-semibold text-sm">Нет соединения с сервером</span>
                <span className="text-xs opacity-80 decoration-dotted underline-offset-4">
                  Проверьте подключение к интернету или попробуйте позже
                </span>
              </div>
            </div>
            
            <button
              onClick={() => initializeAuth()}
              className="flex items-center gap-2 px-3 py-1 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors text-xs font-medium whitespace-nowrap"
            >
              <RefreshCw className="h-3 w-3" />
              Повторить попытку
            </button>
          </div>
          
          {/* Subtle animated background pulse */}
          <motion.div
            animate={{ 
              opacity: [0.05, 0.1, 0.05],
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute inset-0 bg-destructive pointer-events-none"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
