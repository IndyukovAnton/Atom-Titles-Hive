import { motion } from 'framer-motion';
import {
  Calendar,
  Edit2,
  Image as ImageIcon,
  Maximize2,
  Star,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { MediaEntry } from '@/api/media';
import { localizeCategory } from '@/utils/localization';
import { getCategoryIcon, getRatingColor } from './mediaHelpers';

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

interface MediaDetailPosterProps {
  media: MediaEntry;
  onOpenLightbox: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function MediaDetailPoster({
  media,
  onOpenLightbox,
  onEdit,
  onDelete,
}: MediaDetailPosterProps) {
  return (
    <motion.div variants={itemVariants} className="space-y-6 select-none">
      <div
        className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-muted cursor-pointer shadow-2xl ring-1 ring-white/10 group"
        onClick={() => media.image && onOpenLightbox()}
      >
        {media.image ? (
          <>
            <img
              src={media.image}
              alt={media.title}
              className="w-full h-full object-cover transition-transform duration-200 ease-out group-hover:scale-105"
              draggable={false}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center">
              <div className="p-3 rounded-full bg-white/90 shadow-lg">
                <Maximize2 className="h-6 w-6 text-black" />
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
            <ImageIcon className="h-12 w-12 opacity-30 mb-2" />
            <span className="text-sm opacity-50">Нет обложки</span>
          </div>
        )}

        {media.rating > 0 && (
          <div
            className={`absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-gradient-to-br ${getRatingColor(media.rating)} text-white font-bold flex items-center gap-1.5 shadow-lg`}
          >
            <Star className="w-4 h-4 fill-current" />
            {media.rating}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button onClick={onEdit} className="flex-1 gap-2 cursor-pointer">
          <Edit2 className="h-4 w-4" />
          Редактировать
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onDelete}
          className="text-destructive hover:bg-destructive hover:text-destructive-foreground cursor-pointer"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="hidden lg:grid grid-cols-2 gap-3">
        {media.category && (
          <Card className="bg-gradient-to-br from-card to-muted/30 border-primary/10 hover:border-primary/30 transition-colors">
            <CardContent className="p-2 text-center">
              <div className="mb-2 flex justify-center">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {getCategoryIcon(media.category)}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-1">Категория</p>
              <p className="font-semibold text-sm">
                {localizeCategory(media.category)}
              </p>
            </CardContent>
          </Card>
        )}
        {media.startDate && (
          <Card className="bg-gradient-to-br from-card to-muted/30 border-primary/10 hover:border-primary/30 transition-colors">
            <CardContent className="p-2 text-center">
              <div className="mb-2 flex justify-center">
                <div className="p-2 rounded-lg bg-accent-purple/10 text-accent-purple">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-1">Год</p>
              <p className="font-semibold text-sm">
                {new Date(media.startDate).getFullYear()}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  );
}
