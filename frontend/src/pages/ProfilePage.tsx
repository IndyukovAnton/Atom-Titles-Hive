import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  BookMarked,
  BookOpen,
  Check,
  Crown,
  Film,
  Gamepad2,
  Gem,
  Ghost,
  Globe,
  Heart,
  HelpCircle,
  Info,
  Layers,
  Library,
  Lock,
  Notebook,
  PlaySquare,
  Search,
  Sparkles,
  Star,
  Trophy,
  Tv,
  User,
  Wand2,
  type LucideIcon,
} from 'lucide-react';
import { toast } from '@/utils/app-toast';
import { useAuthStore } from '../store/authStore';
import { profileApi, type ProfileStats } from '../api/profile';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { SubPageNav } from '@/components/SubPageNav';
import { logger } from '@/utils/logger';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles,
  Library,
  BookMarked,
  Trophy,
  Crown,
  Star,
  Award,
  Gem,
  Layers,
  Globe,
  Film,
  Tv,
  BookOpen,
  Gamepad2,
  PlaySquare,
  Notebook,
  Wand2,
  Heart,
  Search,
  Ghost,
};

const CATEGORY_LABEL: Record<string, string> = {
  Movie: 'Фильмы',
  Series: 'Сериалы',
  Book: 'Книги',
  Game: 'Игры',
  Anime: 'Аниме',
  Manga: 'Манга',
};

const GROUP_LABEL: Record<string, string> = {
  collection: 'Коллекция',
  rating: 'Оценки',
  diversity: 'Разнообразие',
  category: 'Категории',
  genre: 'Жанры',
};

interface StatsSnapshot {
  level: number;
  unlockedCodes: string[];
  earnedTitleCodes: string[];
}

const SNAPSHOT_KEY = 'seen-stats-snapshot';

function loadSnapshot(): StatsSnapshot | null {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    return raw ? (JSON.parse(raw) as StatsSnapshot) : null;
  } catch {
    return null;
  }
}

function saveSnapshot(stats: ProfileStats) {
  const snap: StatsSnapshot = {
    level: stats.level,
    unlockedCodes: stats.achievements
      .filter((a) => a.unlocked)
      .map((a) => a.code),
    earnedTitleCodes: stats.earnedTitles.map((t) => t.code),
  };
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snap));
}

/** Сравнивает текущие stats с предыдущим снэпшотом и стреляет тостами
 *  на каждое реально новое событие. */
function notifyDiff(stats: ProfileStats, prev: StatsSnapshot | null) {
  if (!prev) return; // первый запуск — снэпшот нулевой, ничего не показываем
  if (stats.level > prev.level) {
    toast.success(`Новый уровень: ${stats.level}`, {
      description: 'Так держать! Продолжайте пополнять медиатеку.',
      icon: '⭐',
    });
  }
  const prevUnlocked = new Set(prev.unlockedCodes);
  for (const a of stats.achievements) {
    if (a.unlocked && !prevUnlocked.has(a.code)) {
      toast.success(`Достижение: ${a.title}`, {
        description: `${a.description} +${a.xp} XP`,
        icon: '🏆',
      });
    }
  }
  const prevTitles = new Set(prev.earnedTitleCodes);
  for (const t of stats.earnedTitles) {
    if (!prevTitles.has(t.code)) {
      toast.success(`Новое звание: ${t.label}`, {
        description: 'Закрепите его в профиле, если хотите.',
        icon: '👑',
      });
    }
  }
}

export default function ProfilePage() {
  const { user, updateProfile } = useAuthStore();
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [titlePopoverOpen, setTitlePopoverOpen] = useState(false);
  // Чтобы тосты не дублировались между ремаунтами одной сессии.
  const notifiedOnce = useRef(false);

  useEffect(() => {
    profileApi
      .getStats()
      .then((s) => {
        setStats(s);
        if (!notifiedOnce.current) {
          notifyDiff(s, loadSnapshot());
          saveSnapshot(s);
          notifiedOnce.current = true;
        }
      })
      .catch((e) => logger.error('Failed to load profile stats', e))
      .finally(() => setIsLoading(false));
  }, []);

  const pinTitle = async (code: string | null) => {
    setTitlePopoverOpen(false);
    try {
      await updateProfile({
        preferences: { ...user?.preferences, selectedTitle: code },
      });
      // Перечитываем статистику, чтобы applied title в шапке обновился.
      const fresh = await profileApi.getStats();
      setStats(fresh);
      toast.success(
        code === null ? 'Звание сброшено на авто' : 'Звание закреплено',
      );
    } catch (e) {
      logger.error('Failed to pin title', e);
      toast.error('Не удалось сохранить звание');
    }
  };

  if (isLoading) {
    return (
      <>
        <SubPageNav />
        <div className="container max-w-3xl py-4 px-4 mx-auto space-y-3 animate-in fade-in">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-[320px] w-full rounded-xl" />
        </div>
      </>
    );
  }

  if (!stats) {
    return (
      <>
        <SubPageNav />
        <div className="container max-w-2xl mx-auto py-12 text-center text-muted-foreground">
          Не удалось загрузить статистику профиля.
        </div>
      </>
    );
  }

  const levelPct = Math.round((stats.levelProgress / stats.levelTarget) * 100);
  const unlockedCount = stats.achievements.filter((a) => a.unlocked).length;

  const achievementGroups = stats.achievements.reduce<
    Record<string, ProfileStats['achievements']>
  >((acc, a) => {
    (acc[a.group] = acc[a.group] || []).push(a);
    return acc;
  }, {});

  return (
    <>
      <SubPageNav />
      <div className="container max-w-3xl py-4 px-4 mx-auto space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Шапка: личность + уровень + прогресс одной плотной карточкой */}
        <Card className="gap-0 overflow-hidden border-0 shadow-md bg-gradient-to-br from-background via-background to-primary/5">
          <CardContent className="p-3 sm:p-4 flex items-center gap-3">
            <Avatar className="h-14 w-14 ring-2 ring-primary/30 shrink-0">
              <AvatarImage src={user?.preferences?.avatar || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                <User size={22} />
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold tracking-tight truncate">
                {user?.username}
              </h1>
              {user?.email && (
                <p className="text-muted-foreground text-sm truncate">
                  {user.email}
                </p>
              )}

              <Popover
                open={titlePopoverOpen}
                onOpenChange={setTitlePopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 mt-0.5 hover:bg-transparent"
                  >
                    {stats.title ? (
                      <Badge
                        variant="secondary"
                        className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 cursor-pointer hover:bg-amber-500/25 transition-colors"
                      >
                        <Crown className="mr-1.5 h-3 w-3" />
                        {stats.title.label}
                        <span className="ml-1.5 text-[10px] opacity-70">
                          изменить
                        </span>
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-dashed text-muted-foreground cursor-pointer hover:bg-muted/30"
                      >
                        <Crown className="mr-1.5 h-3 w-3" />
                        {stats.earnedTitles.length > 0
                          ? 'Выбрать звание'
                          : 'Звание ещё не получено'}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-2" align="start">
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Полученные звания
                  </div>
                  {stats.earnedTitles.length === 0 ? (
                    <p className="px-2 pb-2 pt-1 text-xs text-muted-foreground">
                      Ещё ни одного звания. Добавьте записи в нужной категории
                      (10+) или жанре (15+) — звание разблокируется
                      автоматически.{' '}
                      <Link
                        to="/levels-info"
                        className="text-primary hover:underline"
                      >
                        Подробнее
                      </Link>
                    </p>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => pinTitle(null)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted/50 text-left"
                      >
                        <span className="flex-1">Авто (по топу)</span>
                        {!user?.preferences?.selectedTitle && (
                          <Check className="h-3.5 w-3.5 text-primary" />
                        )}
                      </button>
                      <div className="my-1 h-px bg-border" />
                      {stats.earnedTitles.map((t) => (
                        <button
                          key={t.code}
                          type="button"
                          onClick={() => pinTitle(t.code)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted/50 text-left"
                        >
                          <Crown className="h-3.5 w-3.5 text-amber-500" />
                          <span className="flex-1">
                            <span className="font-medium">{t.label}</span>
                            <span className="ml-1.5 text-[10px] text-muted-foreground">
                              {t.source === 'category'
                                ? (CATEGORY_LABEL[t.basis] ?? t.basis)
                                : t.basis}
                            </span>
                          </span>
                          {user?.preferences?.selectedTitle === t.code && (
                            <Check className="h-3.5 w-3.5 text-primary" />
                          )}
                        </button>
                      ))}
                    </>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            <div className="shrink-0 flex flex-col items-end gap-1.5">
              <div className="text-right">
                <div className="text-2xl font-bold leading-none bg-clip-text text-transparent bg-gradient-to-br from-primary to-purple-500">
                  {stats.level}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  уровень
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Progress
                  value={levelPct}
                  className="h-1.5 w-16 sm:w-28"
                  title={`Прогресс до уровня ${stats.level + 1}`}
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap font-mono">
                  {stats.levelProgress}/{stats.levelTarget} XP
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="h-6 w-6 shrink-0"
                  title="Как работают уровни и звания"
                >
                  <Link to="/levels-info" aria-label="Как работают уровни">
                    <HelpCircle className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ключевые числа — одной полосой */}
        <Card className="shadow-sm">
          <CardContent className="p-0 grid grid-cols-3 divide-x divide-border/60">
            <div className="px-3 py-3 text-center">
              <div className="text-xs uppercase tracking-wide text-muted-foreground flex items-center justify-center gap-1">
                <Film className="h-3.5 w-3.5" /> Записей
              </div>
              <div className="text-xl font-bold leading-tight mt-0.5">
                {stats.totalEntries}
              </div>
            </div>
            <div className="px-3 py-3 text-center">
              <div className="text-xs uppercase tracking-wide text-muted-foreground flex items-center justify-center gap-1">
                <Star className="h-3.5 w-3.5" /> Средний рейтинг
              </div>
              <div className="text-xl font-bold leading-tight mt-0.5">
                {stats.averageRating || '—'}
              </div>
            </div>
            <div className="px-3 py-3 text-center">
              <div className="text-xs uppercase tracking-wide text-muted-foreground flex items-center justify-center gap-1">
                <Trophy className="h-3.5 w-3.5" /> Достижений
              </div>
              <div className="text-xl font-bold leading-tight mt-0.5">
                {unlockedCount}
                <span className="text-sm font-normal text-muted-foreground">
                  {' '}
                  / {stats.achievements.length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Категории и жанры — одна карточка, две колонки */}
        <Card className="gap-0 shadow-sm">
          <CardContent className="p-4 grid gap-4 sm:gap-0 sm:grid-cols-2 sm:divide-x sm:divide-border/60">
            <section className="sm:pr-4">
              <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5 mb-2.5">
                <Layers className="h-4 w-4 text-primary" />
                Категории
              </h2>
              {Object.entries(stats.byCategory).length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  Пока нет данных
                </p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(stats.byCategory)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, count]) => {
                      const pct = (count / stats.totalEntries) * 100;
                      return (
                        <div key={cat} className="flex items-center gap-2">
                          <span className="text-sm font-medium w-16 shrink-0 truncate">
                            {CATEGORY_LABEL[cat] ?? cat}
                          </span>
                          <Progress value={pct} className="h-1.5 flex-1" />
                          <span className="text-xs text-muted-foreground font-mono w-7 shrink-0 text-right">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </section>

            <section className="sm:pl-4">
              <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5 mb-2.5">
                <BookOpen className="h-4 w-4 text-primary" />
                Топ-жанры
              </h2>
              {Object.entries(stats.byGenre).length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  Жанры не указаны в записях
                </p>
              ) : (
                <div className="space-y-1.5">
                  {Object.entries(stats.byGenre)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 6)
                    .map(([genre, count]) => (
                      <div
                        key={genre}
                        className="flex items-center justify-between gap-2 text-sm"
                      >
                        <span className="font-medium truncate">{genre}</span>
                        <Badge
                          variant="outline"
                          className="font-mono text-xs px-1.5 py-0 shrink-0"
                        >
                          {count}
                        </Badge>
                      </div>
                    ))}
                </div>
              )}
            </section>
          </CardContent>
        </Card>

        {/* Достижения */}
        <Card className="gap-0 shadow-sm">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                <Trophy className="h-4 w-4 text-primary" />
                Достижения
              </h2>
              <span className="text-xs text-muted-foreground">
                {unlockedCount} из {stats.achievements.length}
              </span>
            </div>

            {Object.entries(achievementGroups).map(([group, items]) => (
              <div key={group}>
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground/80 font-medium mb-1.5">
                  {GROUP_LABEL[group] ?? group}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {items.map((ach) => {
                    const Icon = ICON_MAP[ach.icon] ?? Star;
                    const pct = Math.min(
                      100,
                      Math.round((ach.value / ach.target) * 100),
                    );
                    return (
                      <div
                        key={ach.code}
                        className={cn(
                          'p-2.5 rounded-md border transition-all',
                          ach.unlocked
                            ? 'bg-amber-500/5 border-amber-500/30'
                            : 'bg-card border-border/50 opacity-90',
                        )}
                        title={ach.description}
                      >
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span
                            className={cn(
                              'shrink-0',
                              ach.unlocked
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-muted-foreground',
                            )}
                          >
                            {ach.unlocked ? (
                              <Icon className="h-3.5 w-3.5" />
                            ) : (
                              <Lock className="h-3.5 w-3.5" />
                            )}
                          </span>
                          <span
                            className={cn(
                              'font-medium text-xs flex-1 truncate leading-tight',
                              !ach.unlocked && 'text-muted-foreground',
                            )}
                          >
                            {ach.title}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                            +{ach.xp}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Progress value={pct} className="h-1 flex-1" />
                          <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                            {ach.value}/{ach.target}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground pb-1">
          <Info className="inline h-3 w-3 mr-1" />
          Уровни, опыт и достижения — локальная геймификация, данные не покидают
          устройство. Подробнее —{' '}
          <Link to="/levels-info" className="text-primary hover:underline">
            здесь
          </Link>
          .
        </p>
      </div>
    </>
  );
}
