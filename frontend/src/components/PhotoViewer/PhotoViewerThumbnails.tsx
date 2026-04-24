import { motion } from 'framer-motion';
import type { MediaFile } from './types';

interface PhotoViewerThumbnailsProps {
  files: MediaFile[];
  currentIndex: number | null;
  onSelect: (index: number) => void;
}

export function PhotoViewerThumbnails({
  files,
  currentIndex,
  onSelect,
}: PhotoViewerThumbnailsProps) {
  if (files.length <= 1) return null;

  return (
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
            onClick={() => onSelect(index)}
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
  );
}
