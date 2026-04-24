import { motion } from 'framer-motion';
import { Library, Plus, Star } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { RecommendationItem } from '@/api/recommendations';

const GENRE_COLORS = [
  'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
  'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
  'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30',
  'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
];

interface RecommendationsGridProps {
  items: RecommendationItem[];
  type?: 'internal' | 'external' | 'ai';
  onAdd: (item: RecommendationItem) => void;
}

export function RecommendationsGrid({
  items,
  onAdd,
}: RecommendationsGridProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item, idx) => (
        <motion.div
          key={`${item.title}-${idx}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: idx * 0.05 }}
        >
          <Card className="h-full flex flex-col hover:shadow-2xl transition-all duration-300 overflow-hidden group border-0 shadow-md bg-card/80 backdrop-blur-sm hover:-translate-y-1">
            <div className="relative aspect-[2/3] overflow-hidden bg-muted">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.title}
                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-muted to-muted/50">
                  <Library className="w-12 h-12 text-muted-foreground/30" />
                </div>
              )}
              <div className="absolute top-2 right-2 flex gap-1">
                {item.rating && (
                  <Badge className="bg-black/70 text-white backdrop-blur-md shadow-lg font-bold border-0 px-2.5 py-1">
                    <Star className="w-3 h-3 mr-1 fill-amber-400 text-amber-400" />
                    {item.rating}
                  </Badge>
                )}
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-4">
                <Button
                  size="lg"
                  className="w-full gap-2 font-semibold shadow-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  onClick={() => onAdd(item)}
                >
                  <Plus className="w-5 h-5" />
                  Add to Library
                </Button>
              </div>
            </div>
            <CardHeader className="p-4 pb-2 space-y-2">
              <CardTitle
                className="line-clamp-1 text-base font-bold"
                title={item.title}
              >
                {item.title}
              </CardTitle>
              <div className="flex flex-wrap gap-1.5">
                {(item.genres || []).slice(0, 2).map((g: string, i: number) => (
                  <Badge
                    key={g}
                    variant="outline"
                    className={`text-[10px] h-5 px-2 font-medium ${GENRE_COLORS[i % GENRE_COLORS.length]}`}
                  >
                    {g}
                  </Badge>
                ))}
                {item.category && (
                  <Badge
                    variant="outline"
                    className="text-[10px] h-5 px-2 bg-muted/50"
                  >
                    {item.category}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2 flex-grow">
              {item.description && (
                <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                  {item.description}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

export function RecommendationsGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col space-y-3">
          <Skeleton className="h-[300px] w-full rounded-xl" />
          <div className="space-y-2 p-2">
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-4 w-[60%]" />
            <Skeleton className="h-16 w-full mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}
