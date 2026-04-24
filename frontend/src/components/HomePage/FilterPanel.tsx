import { useState, useEffect } from 'react';
import { Filter, X, Calendar, Star, Tag, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import type { MediaFilters } from '@/hooks/useFilters';
import { mediaApi } from '@/api/media';
import { logger } from '@/utils/logger';

interface FilterPanelProps {
  filters: MediaFilters;
  onUpdateFilter: <K extends keyof MediaFilters>(key: K, value: MediaFilters[K]) => void;
  onRemoveFilter: (key: keyof MediaFilters) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Предопределенные статусы для фильтрации


export const FilterPanel = ({
  filters,
  onUpdateFilter,
  onRemoveFilter,
  onClearFilters,
  hasActiveFilters,
  isOpen,
  onOpenChange,
}: FilterPanelProps) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const data = await mediaApi.getCategories();
        setCategories(data);
      } catch (error) {
        logger.error('Failed to load categories:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    loadCategories();
  }, []);

  const activeFiltersCount = Object.keys(filters).length;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Filter className="mr-2 h-4 w-4" />
          Фильтры
          {activeFiltersCount > 0 && (
            <Badge 
              variant="default" 
              className="ml-2 px-1.5 min-w-[20px] h-5 flex items-center justify-center"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Фильтры</SheetTitle>
          <SheetDescription>
            Настройте фильтры для поиска нужного контента
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Категория */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Layers className="h-4 w-4 text-muted-foreground" />
                Категория
              </Label>
              {filters.category && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveFilter('category')}
                  className="h-6 px-2 text-xs"
                >
                  Сбросить
                </Button>
              )}
            </div>
            <Select
              value={filters.category ?? "all"}
              onValueChange={(value) => onUpdateFilter('category', value === "all" ? undefined : value)}
              disabled={isLoadingCategories}
            >
              <SelectTrigger>
                <SelectValue placeholder="Все категории" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Рейтинг */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Star className="h-4 w-4 text-muted-foreground" />
              Рейтинг
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="minRating" className="text-xs text-muted-foreground">
                  Минимум
                </Label>
                <Input
                  id="minRating"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={filters.minRating ?? ''}
                  onChange={(e) => {
                    const value = e.target.value ? Number(e.target.value) : undefined;
                    onUpdateFilter('minRating', value);
                  }}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxRating" className="text-xs text-muted-foreground">
                  Максимум
                </Label>
                <Input
                  id="maxRating"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={filters.maxRating ?? ''}
                  onChange={(e) => {
                    const value = e.target.value ? Number(e.target.value) : undefined;
                    onUpdateFilter('maxRating', value);
                  }}
                  placeholder="10"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Период дат */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Период
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-xs text-muted-foreground">
                  Начало
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate ?? ''}
                  onChange={(e) => onUpdateFilter('startDate', e.target.value || undefined)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-xs text-muted-foreground">
                  Конец
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate ?? ''}
                  onChange={(e) => onUpdateFilter('endDate', e.target.value || undefined)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Жанры */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Tag className="h-4 w-4 text-muted-foreground" />
                Жанры
              </Label>
              {filters.genres && filters.genres.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveFilter('genres')}
                  className="h-6 px-2 text-xs"
                >
                  Сбросить
                </Button>
              )}
            </div>
            <Input
              placeholder="Введите жанры через запятую"
              value={filters.genres?.join(', ') ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                const genres = value
                  ? value.split(',').map(g => g.trim()).filter(Boolean)
                  : undefined;
                onUpdateFilter('genres', genres);
              }}
            />
            {filters.genres && filters.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {filters.genres.map((genre, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {genre}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Теги */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Tag className="h-4 w-4 text-muted-foreground" />
                Теги
              </Label>
              {filters.tags && filters.tags.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveFilter('tags')}
                  className="h-6 px-2 text-xs"
                >
                  Сбросить
                </Button>
              )}
            </div>
            <Input
              placeholder="Введите теги через запятую"
              value={filters.tags?.join(', ') ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                const tags = value
                  ? value.split(',').map(t => t.trim()).filter(Boolean)
                  : undefined;
                onUpdateFilter('tags', tags);
              }}
            />
            {filters.tags && filters.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {filters.tags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {hasActiveFilters && (
          <div className="mt-6 pt-6 border-t">
            <Button
              variant="outline"
              onClick={onClearFilters}
              className="w-full"
            >
              <X className="mr-2 h-4 w-4" />
              Очистить все фильтры
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
