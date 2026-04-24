import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePhotoViewerControls } from './usePhotoViewerControls';
import { PhotoViewerToolbar } from './PhotoViewerToolbar';
import { PhotoViewerThumbnails } from './PhotoViewerThumbnails';
import type { MediaFile } from './types';

interface PhotoViewerProps {
  files: MediaFile[];
  currentIndex: number | null;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
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
  const {
    zoom,
    position,
    isDragging,
    direction,
    containerRef,
    currentFile,
    isOpen,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    goToPrev,
    goToNext,
    goToIndex,
    handleDownload,
    handleClose,
    handleBackdropClick,
  } = usePhotoViewerControls({ files, currentIndex, onClose, onIndexChange });

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
          <motion.div
            variants={overlayVariants}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            onClick={handleBackdropClick}
          />

          <PhotoViewerToolbar
            currentIndex={currentIndex}
            totalFiles={files.length}
            zoom={zoom}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetZoom={handleResetZoom}
            onDownload={handleDownload}
            onClose={handleClose}
          />

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

          <div
            ref={containerRef}
            className="relative z-10 flex items-center justify-center w-full h-full p-16"
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

          <PhotoViewerThumbnails
            files={files}
            currentIndex={currentIndex}
            onSelect={goToIndex}
          />

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
