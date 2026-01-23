import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw 
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

export default function PhotoViewer({ 
  files, 
  currentIndex, 
  onClose,
  onIndexChange 
}: PhotoViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  const currentFile = currentIndex !== null ? files[currentIndex] : null;
  const isOpen = currentIndex !== null;

  // Reset zoom/position when changing images
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [currentIndex]);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => {
      const newZoom = Math.max(prev - ZOOM_STEP, MIN_ZOOM);
      if (newZoom === 1) setPosition({ x: 0, y: 0 });
      return newZoom;
    });
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  }, [handleZoomIn, handleZoomOut]);

  const goToPrev = useCallback(() => {
    if (currentIndex === null || currentIndex <= 0) return;
    const newIndex = currentIndex - 1;
    onIndexChange?.(newIndex);
  }, [currentIndex, onIndexChange]);

  const goToNext = useCallback(() => {
    if (currentIndex === null || currentIndex >= files.length - 1) return;
    const newIndex = currentIndex + 1;
    onIndexChange?.(newIndex);
  }, [currentIndex, files.length, onIndexChange]);

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
  }, [isOpen, onClose, goToPrev, goToNext, handleZoomIn, handleZoomOut, handleResetZoom]);

  // Mouse drag for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y
    };
  }, [zoom, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    
    setPosition({
      x: dragStartRef.current.posX + deltaX,
      y: dragStartRef.current.posY + deltaY
    });
  }, [isDragging, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClose = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    onClose();
  }, [onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-[95vw] w-full p-0 bg-black/95 border-none h-[95vh] flex flex-col overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <VisuallyHidden>
          <DialogTitle>Просмотр изображений</DialogTitle>
        </VisuallyHidden>
        
        {/* Toolbar */}
        <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
          <div className="text-white/80 text-sm font-medium">
            {currentIndex !== null && `${currentIndex + 1} / ${files.length}`}
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white/80 hover:text-white hover:bg-white/10"
              onClick={handleZoomOut}
              disabled={zoom <= MIN_ZOOM}
            >
              <ZoomOut className="h-5 w-5" />
            </Button>
            <span className="text-white/60 text-sm min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white/80 hover:text-white hover:bg-white/10"
              onClick={handleZoomIn}
              disabled={zoom >= MAX_ZOOM}
            >
              <ZoomIn className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white/80 hover:text-white hover:bg-white/10"
              onClick={handleResetZoom}
              disabled={zoom === 1}
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
            <div className="w-px h-6 bg-white/20 mx-2" />
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white/80 hover:text-white hover:bg-white/10"
              onClick={handleClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Navigation Buttons */}
        {currentIndex !== null && currentIndex > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-40 h-12 w-12 rounded-full bg-black/40 text-white/80 hover:bg-black/60 hover:text-white"
            onClick={goToPrev}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
        )}
        
        {currentIndex !== null && currentIndex < files.length - 1 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-40 h-12 w-12 rounded-full bg-black/40 text-white/80 hover:bg-black/60 hover:text-white"
            onClick={goToNext}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        )}

        {/* Image/Video Container */}
        <div 
          ref={containerRef}
          className="flex-1 flex items-center justify-center overflow-hidden"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
        >
          <AnimatePresence mode="wait">
            {currentFile && (
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="relative"
                style={{
                  transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                  transformOrigin: 'center center',
                }}
              >
                {currentFile.type === 'video' ? (
                  <video
                    src={currentFile.url}
                    controls
                    className="max-h-[85vh] max-w-[90vw] rounded-lg shadow-2xl"
                    autoPlay
                  />
                ) : (
                  <img
                    src={currentFile.url}
                    alt=""
                    className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl select-none"
                    draggable={false}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Thumbnails Strip */}
        {files.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center justify-center gap-2 overflow-x-auto py-2">
              {files.map((file, index) => (
                <button
                  key={file.id}
                  onClick={() => onIndexChange?.(index)}
                  className={`
                    relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden 
                    transition-all duration-200 ring-2
                    ${index === currentIndex 
                      ? 'ring-white scale-110' 
                      : 'ring-transparent opacity-60 hover:opacity-100'
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
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
