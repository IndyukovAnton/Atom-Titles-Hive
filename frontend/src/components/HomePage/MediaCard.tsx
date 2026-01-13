import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from 'lucide-react';
import type { MediaEntry } from '../../api/media';

interface MediaCardProps {
  media: MediaEntry;
}

export const MediaCard = React.memo(({ media }: MediaCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all hover:scale-[1.02] group border-muted">
      <div className="aspect-[2/3] relative bg-muted overflow-hidden">
        {media.image ? (
          <img 
            src={media.image} 
            alt={media.title} 
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary/50 text-muted-foreground">
            No Image
          </div>
        )}
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-md flex items-center">
          <Star className="h-3 w-3 text-yellow-400 mr-1 fill-yellow-400" />
          {media.rating}
        </div>
        {media.category && (
          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md">
            {media.category}
          </div>
        )}
      </div>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="leading-tight text-base line-clamp-1" title={media.title}>
            {media.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 h-20">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {media.description || 'Нет описания'}
        </p>
      </CardContent>
    </Card>
  );
});
