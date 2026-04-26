import { useState, useEffect, useMemo } from 'react';
import { Calendar, Filter, Layers, Search, Star, Tag, X } from 'lucide-react';
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
import type { MediaFilters } from '@/hooks/useFilters';
import { mediaApi } from '@/api/media';
import { logger } from '@/utils/logger';
import { PREDEFINED_GENRES, PREDEFINED_TAGS } from '@/constants/media';
import { cn } from '@/lib/utils';

interface FilterPanelProps {
  filters: MediaFilters;
  onUpdateFilter: <K extends keyof MediaFilters>(
    key: K,
    value: MediaFilters[K],
  ) => void;
  onRemoveFilter: (key: keyof MediaFilters) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

type AccentColor = 'blue' | 'amber' | 'purple' | 'emerald' | 'rose';

const ACCENT_CLASSES: Record<AccentColor, string> = {
  blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/20',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20',
  purple:
    'bg-purple-500/10 text-purple-600 dark:text-purple-400 ring-purple-500/20',
  emerald:
    'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20',
  rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-rose-500/20',
};

interface FilterSectionProps {
  accent: AccentColor;
  icon: React.ReactNode;
  label: string;
  onReset?: () => void;
  children: React.ReactNode;
}

function FilterSection({
  accent,
  icon,
  label,
  onReset,
  children,
}: FilterSectionProps) {
  return (
    <div className="rounded-xl border bg-card/40 p-4 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-1.5 rounded-lg ring-1 ${ACCENT_CLASSES[accent]}`}
          >
            {icon}
          </div>
          <Label className="text-sm font-semibold">{label}</Label>
        </div>
        {onReset && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Сбросить
          </Button>
        )}
      </div>
      {children}
    </div>
  );
}

function SubLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <Label
      htmlFor={htmlFor}
      className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium"
    >
      {children}
    </Label>
  );
}

interface ChipSelectorProps {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  prefix?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  chipSelectedClass: string;
  chipIdleClass: string;
}

function ChipSelector({
  options,
  selected,
  onToggle,
  prefix = '',
  showSearch = false,
  searchPlaceholder = 'Поиск...',
  chipSelectedClass,
  chipIdleClass,
}: ChipSelectorProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <div className="space-y-2.5">
      {showSearch && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-8 pl-8 text-xs"
          />
        </div>
      )}
      {filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground py-1">Ничего не найдено</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {filtered.map((option) => {
            const isSelected = selected.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => onToggle(option)}
                className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border transition-colors cursor-pointer',
                  isSelected ? chipSelectedClass : chipIdleClass,
                )}
              >
                {prefix}
                {option}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

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

  const toggleGenre = (genre: string) => {
    const current = filters.genres || [];
    const next = current.includes(genre)
      ? current.filter((g) => g !== genre)
      : [...current, genre];
    onUpdateFilter('genres', next.length ? next : undefined);
  };

  const toggleTag = (tag: string) => {
    const current = filters.tags || [];
    const next = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];
    onUpdateFilter('tags', next.length ? next : undefined);
  };

  // Включаем в доступные варианты и предопределённый список, и уже выбранные
  // (на случай если у пользователя в фильтре остался кастомный тег/жанр,
  // которого нет в predefined — иначе он "пропадёт" из UI).
  const genreOptions = useMemo(() => {
    const all = new Set([...PREDEFINED_GENRES, ...(filters.genres || [])]);
    return Array.from(all);
  }, [filters.genres]);

  const tagOptions = useMemo(() => {
    const all = new Set([...PREDEFINED_TAGS, ...(filters.tags || [])]);
    return Array.from(all);
  }, [filters.tags]);

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
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="text-lg">Фильтры</SheetTitle>
          <SheetDescription>
            Настройте фильтры для поиска нужного контента
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          <FilterSection
            accent="blue"
            icon={<Layers className="h-4 w-4" />}
            label="Категория"
            onReset={
              filters.category ? () => onRemoveFilter('category') : undefined
            }
          >
            <Select
              value={filters.category ?? 'all'}
              onValueChange={(value) =>
                onUpdateFilter(
                  'category',
                  value === 'all' ? undefined : value,
                )
              }
              disabled={isLoadingCategories}
            >
              <SelectTrigger className="w-full">
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
          </FilterSection>

          <FilterSection
            accent="amber"
            icon={<Star className="h-4 w-4" />}
            label="Рейтинг"
            onReset={
              filters.minRating !== undefined ||
              filters.maxRating !== undefined
                ? () => {
                    onRemoveFilter('minRating');
                    onRemoveFilter('maxRating');
                  }
                : undefined
            }
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <SubLabel htmlFor="minRating">От</SubLabel>
                <div className="relative">
                  <Input
                    id="minRating"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={filters.minRating ?? ''}
                    onChange={(e) => {
                      const value = e.target.value
                        ? Number(e.target.value)
                        : undefined;
                      onUpdateFilter('minRating', value);
                    }}
                    placeholder="0"
                    className="pr-10"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    /10
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <SubLabel htmlFor="maxRating">До</SubLabel>
                <div className="relative">
                  <Input
                    id="maxRating"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={filters.maxRating ?? ''}
                    onChange={(e) => {
                      const value = e.target.value
                        ? Number(e.target.value)
                        : undefined;
                      onUpdateFilter('maxRating', value);
                    }}
                    placeholder="10"
                    className="pr-10"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    /10
                  </span>
                </div>
              </div>
            </div>
          </FilterSection>

          <FilterSection
            accent="purple"
            icon={<Calendar className="h-4 w-4" />}
            label="Период"
            onReset={
              filters.startDate || filters.endDate
                ? () => {
                    onRemoveFilter('startDate');
                    onRemoveFilter('endDate');
                  }
                : undefined
            }
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <SubLabel htmlFor="startDate">Начало</SubLabel>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate ?? ''}
                  onChange={(e) =>
                    onUpdateFilter('startDate', e.target.value || undefined)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <SubLabel htmlFor="endDate">Конец</SubLabel>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate ?? ''}
                  onChange={(e) =>
                    onUpdateFilter('endDate', e.target.value || undefined)
                  }
                />
              </div>
            </div>
          </FilterSection>

          <FilterSection
            accent="emerald"
            icon={<Tag className="h-4 w-4" />}
            label="Жанры"
            onReset={
              filters.genres && filters.genres.length > 0
                ? () => onRemoveFilter('genres')
                : undefined
            }
          >
            <ChipSelector
              options={genreOptions}
              selected={filters.genres || []}
              onToggle={toggleGenre}
              showSearch
              searchPlaceholder="Найти жанр..."
              chipSelectedClass="bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600"
              chipIdleClass="bg-transparent text-foreground border-border hover:bg-emerald-500/10 hover:border-emerald-500/40"
            />
          </FilterSection>

          <FilterSection
            accent="rose"
            icon={<Tag className="h-4 w-4" />}
            label="Теги"
            onReset={
              filters.tags && filters.tags.length > 0
                ? () => onRemoveFilter('tags')
                : undefined
            }
          >
            <ChipSelector
              options={tagOptions}
              selected={filters.tags || []}
              onToggle={toggleTag}
              prefix="#"
              chipSelectedClass="bg-rose-500 text-white border-rose-500 hover:bg-rose-600"
              chipIdleClass="bg-transparent text-foreground border-border hover:bg-rose-500/10 hover:border-rose-500/40"
            />
          </FilterSection>
        </div>

        {hasActiveFilters && (
          <div className="border-t bg-background/80 backdrop-blur px-6 py-4">
            <Button
              variant="outline"
              onClick={onClearFilters}
              className="w-full cursor-pointer"
            >
              <X className="mr-2 h-4 w-4" />
              Очистить все фильтры
              <Badge
                variant="secondary"
                className="ml-2 px-1.5 min-w-[20px] h-5"
              >
                {activeFiltersCount}
              </Badge>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
