import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
} from 'lucide-react';
import { MIN_ZOOM, MAX_ZOOM } from './usePhotoViewerControls';

const toolbarVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { delay: 0.1, duration: 0.3 } },
};

interface PhotoViewerToolbarProps {
  currentIndex: number | null;
  totalFiles: number;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onDownload: () => void;
  onClose: () => void;
}

export function PhotoViewerToolbar({
  currentIndex,
  totalFiles,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onDownload,
  onClose,
}: PhotoViewerToolbarProps) {
  return (
    <motion.div
      variants={toolbarVariants}
      className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-2 py-1.5 bg-background/95 backdrop-blur-md border border-border/50 rounded-2xl shadow-2xl"
    >
      <Badge
        variant="secondary"
        className="px-3 py-1 text-sm font-medium bg-primary/10 text-primary border-0"
      >
        {currentIndex !== null && `${currentIndex + 1} / ${totalFiles}`}
      </Badge>

      <div className="w-px h-6 bg-border/50" />

      <div className="flex items-center gap-0.5 px-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-xl hover:bg-primary/10"
          onClick={onZoomOut}
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
          onClick={onZoomIn}
          disabled={zoom >= MAX_ZOOM}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-xl hover:bg-primary/10"
          onClick={onResetZoom}
          disabled={zoom === 1}
          title="Сбросить масштаб"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      <div className="w-px h-6 bg-border/50" />

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-xl hover:bg-primary/10"
        onClick={onDownload}
        title="Скачать"
      >
        <Download className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border/50" />

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-xl hover:bg-destructive/20 hover:text-destructive transition-colors"
        onClick={onClose}
        title="Закрыть (Esc)"
      >
        <X className="h-4 w-4" />
      </Button>
    </motion.div>
  );
}
