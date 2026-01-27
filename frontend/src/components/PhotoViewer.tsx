import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
} from 'lucide-react';

interface MediaFile {
  id: number;
  url: string;
  type: 'image' | 'video';
}

interface PhotoViewerProps {
  files: MediaFile[];
  currentIndex: number | null;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;

// Анимационные варианты
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const toolbarVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { delay: 0.1, duration: 0.3 } },
};

const imageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3 },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 100 : -100,
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  }),
};

export default function PhotoViewer({
  files,
  currentIndex,
  onClose,
  onIndexChange,
}: PhotoViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [direction, setDirection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  const currentFile = currentIndex !== null ? files[currentIndex] : null;
  const isOpen = currentIndex !== null;

  // Reset zoom/position when changing images
  useEffect(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [currentIndex]);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => {
      const newZoom = Math.max(prev - ZOOM_STEP, MIN_ZOOM);
      if (newZoom === 1) setPosition({ x: 0, y: 0 });
      return newZoom;
    });
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        handleZoomIn();
      } else {
        handleZoomOut();
      }
    },
    [handleZoomIn, handleZoomOut],
  );

  const goToPrev = useCallback(() => {
    if (currentIndex === null || currentIndex <= 0) return;
    setDirection(-1);
    onIndexChange?.(currentIndex - 1);
  }, [currentIndex, onIndexChange]);

  const goToNext = useCallback(() => {
    if (currentIndex === null || currentIndex >= files.length - 1) return;
    setDirection(1);
    onIndexChange?.(currentIndex + 1);
  }, [currentIndex, files.length, onIndexChange]);

  const handleDownload = useCallback(() => {
    if (!currentFile) return;
    const link = document.createElement('a');
    link.href = currentFile.url;
    link.download = `media-${currentFile.id}.${currentFile.type === 'video' ? 'mp4' : 'jpg'}`;
    link.click();
  }, [currentFile]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrev();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case '0':
          handleResetZoom();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    onClose,
    goToPrev,
    goToNext,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
  ]);

  // Mouse drag for panning
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (zoom <= 1) return;
      e.preventDefault();
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        posX: position.x,
        posY: position.y,
      };
    },
    [zoom, position],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || zoom <= 1) return;

      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      setPosition({
        x: dragStartRef.current.posX + deltaX,
        y: dragStartRef.current.posY + deltaY,
      });
    },
    [isDragging, zoom],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClose = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    onClose();
  }, [onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        handleClose();
      }
    },
    [handleClose],
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="fixed inset-0 z-[100] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop с blur */}
          <motion.div
            variants={overlayVariants}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            onClick={handleBackdropClick}
          />

          {/* Toolbar - улучшенный */}
          <motion.div
            variants={toolbarVariants}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-2 py-1.5 bg-background/95 backdrop-blur-md border border-border/50 rounded-2xl shadow-2xl"
          >
            {/* Counter Badge */}
            <Badge
              variant="secondary"
              className="px-3 py-1 text-sm font-medium bg-primary/10 text-primary border-0"
            >
              {currentIndex !== null && `${currentIndex + 1} / ${files.length}`}
            </Badge>

            <div className="w-px h-6 bg-border/50" />

            {/* Zoom Controls */}
            <div className="flex items-center gap-0.5 px-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-xl hover:bg-primary/10"
                onClick={handleZoomOut}
                disabled={zoom <= MIN_ZOOM}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <div className="px-2 min-w-[52px] text-center">
                <span className="text-xs font-medium text-muted-foreground tabular-nums">
                  {Math.round(zoom * 100)}%
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-xl hover:bg-primary/10"
                onClick={handleZoomIn}
                disabled={zoom >= MAX_ZOOM}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-xl hover:bg-primary/10"
                onClick={handleResetZoom}
                disabled={zoom === 1}
                title="Сбросить масштаб"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            <div className="w-px h-6 bg-border/50" />

            {/* Download Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl hover:bg-primary/10"
              onClick={handleDownload}
              title="Скачать"
            >
              <Download className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-border/50" />

            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl hover:bg-destructive/20 hover:text-destructive transition-colors"
              onClick={handleClose}
              title="Закрыть (Esc)"
            >
              <X className="h-4 w-4" />
            </Button>
          </motion.div>

          {/* Navigation Buttons - улучшенные */}
          <AnimatePresence>
            {currentIndex !== null && currentIndex > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-40"
              >
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-14 w-14 rounded-2xl shadow-2xl bg-background/90 backdrop-blur-md border border-border/50 hover:bg-primary/10 hover:border-primary/50 transition-all hover:scale-105"
                  onClick={goToPrev}
                >
                  <ChevronLeft className="h-7 w-7" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {currentIndex !== null && currentIndex < files.length - 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-40"
              >
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-14 w-14 rounded-2xl shadow-2xl bg-background/90 backdrop-blur-md border border-border/50 hover:bg-primary/10 hover:border-primary/50 transition-all hover:scale-105"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-7 w-7" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Image/Video Container */}
          <div
            ref={containerRef}
            className="relative z-10 flex items-center justify-center w-full h-full p-16"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleBackdropClick}
            style={{
              cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
            }}
          >
            <AnimatePresence mode="wait" custom={direction}>
              {currentFile && (
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  variants={imageVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="relative"
                  style={{
                    transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                    transformOrigin: 'center center',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {currentFile.type === 'video' ? (
                    <video
                      src={currentFile.url}
                      controls
                      autoPlay
                      className="max-h-[80vh] max-w-[90vw] rounded-2xl shadow-2xl ring-1 ring-white/10"
                    />
                  ) : (
                    <img
                      src={currentFile.url}
                      alt=""
                      draggable={false}
                      className="max-h-[80vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl ring-1 ring-white/10 select-none"
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Thumbnails Strip - улучшенный */}
          {files.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 px-3 py-2 bg-background/95 backdrop-blur-md border border-border/50 rounded-2xl shadow-2xl"
            >
              <div className="flex items-center gap-2">
                {files.map((file, index) => (
                  <motion.button
                    key={file.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setDirection(index > (currentIndex ?? 0) ? 1 : -1);
                      onIndexChange?.(index);
                    }}
                    className={`
                      shrink-0 w-14 h-14 rounded-xl overflow-hidden 
                      transition-all duration-200
                      ${
                        index === currentIndex
                          ? 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg shadow-primary/20'
                          : 'opacity-50 hover:opacity-100 ring-1 ring-border/50'
                      }
                    `}
                  >
                    {file.type === 'video' ? (
                      <video
                        src={file.url}
                        className="w-full h-full object-cover"
                        muted
                      />
                    ) : (
                      <img
                        src={file.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Keyboard hints */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-4 right-4 z-50 hidden lg:flex items-center gap-2 text-xs text-muted-foreground/50"
          >
            <kbd className="px-2 py-1 rounded bg-background/50 border border-border/30">
              ←
            </kbd>
            <kbd className="px-2 py-1 rounded bg-background/50 border border-border/30">
              →
            </kbd>
            <span>навигация</span>
            <kbd className="px-2 py-1 rounded bg-background/50 border border-border/30 ml-2">
              Esc
            </kbd>
            <span>закрыть</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
