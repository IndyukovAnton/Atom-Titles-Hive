import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  BookMarked,
  BookOpen,
  Calendar,
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
import { toast } from 'sonner';
import { useAuthStore } from '../store/authStore';
import { profileApi, type ProfileStats } from '../api/profile';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
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
    unlockedCodes: stats.achievements.filter((a) => a.unlocked).map((a) => a.code),
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
      <div className="container max-w-5xl py-6 px-4 mx-auto space-y-6 animate-in fade-in">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-[300px] w-full rounded-xl" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container max-w-2xl mx-auto py-12 text-center text-muted-foreground">
        Не удалось загрузить статистику профиля.
      </div>
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
    <div className="container max-w-5xl py-6 px-4 mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <Button
          variant="ghost"
          asChild
          className="hover:bg-muted/50 -ml-2 mb-2"
          size="sm"
        >
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Назад
          </Link>
        </Button>
      </div>

      {/* Header card */}
      <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-background via-background to-primary/5">
        <CardContent className="p-6 flex flex-col md:flex-row gap-5 items-start md:items-center">
          <Avatar className="h-20 w-20 ring-2 ring-primary/30">
            <AvatarImage src={user?.preferences?.avatar || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
              <User size={32} />
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight">
              {user?.username}
            </h1>
            <p className="text-muted-foreground text-sm">{user?.email}</p>

            <Popover
              open={titlePopoverOpen}
              onOpenChange={setTitlePopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 mt-1 hover:bg-transparent"
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
                              ? CATEGORY_LABEL[t.basis] ?? t.basis
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

          <div className="text-right space-y-1 min-w-[120px]">
            <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-primary to-purple-500">
              {stats.level}
            </div>
            <div className="text-xs text-muted-foreground">уровень</div>
          </div>
        </CardContent>
      </Card>

      {/* Level progress */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  Прогресс до уровня {stats.level + 1}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {stats.totalXp} XP всего · {stats.levelProgress} /{' '}
                {stats.levelTarget} в этом уровне
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/levels-info">
                <HelpCircle className="mr-1.5 h-3.5 w-3.5" />
                Как это работает
              </Link>
            </Button>
          </div>
          <Progress value={levelPct} className="h-2" />
        </CardContent>
      </Card>

      {/* Top stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Всего записей
            </CardTitle>
            <Film className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{stats.totalEntries}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Средний рейтинг
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">
              {stats.averageRating || '—'}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              из 10 · оценено {stats.ratedEntries}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Достижений
            </CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">
              {unlockedCount}{' '}
              <span className="text-muted-foreground text-base font-normal">
                / {stats.achievements.length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Категории
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {Object.entries(stats.byCategory).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Пока нет данных
              </p>
            ) : (
              Object.entries(stats.byCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, count]) => {
                  const pct = (count / stats.totalEntries) * 100;
                  return (
                    <div key={cat} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">
                          {CATEGORY_LABEL[cat] ?? cat}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {count}
                        </span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
                  );
                })
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Топ-жанры
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {Object.entries(stats.byGenre).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Жанры не указаны в записях
              </p>
            ) : (
              Object.entries(stats.byGenre)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([genre, count]) => (
                  <div
                    key={genre}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="font-medium">{genre}</span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {count}
                    </Badge>
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              Достижения
            </CardTitle>
            <span className="text-xs text-muted-foreground">
              {unlockedCount} из {stats.achievements.length}
            </span>
          </div>
          <CardDescription>
            Открывайте за пополнение медиатеки и оценки
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-5">
          {Object.entries(achievementGroups).map(([group, items]) => (
            <div key={group} className="space-y-2.5">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                {GROUP_LABEL[group] ?? group}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                        'p-3 rounded-lg border transition-all',
                        ach.unlocked
                          ? 'bg-amber-500/5 border-amber-500/30 shadow-sm'
                          : 'bg-card border-border/50 opacity-90',
                      )}
                      title={ach.description}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div
                          className={cn(
                            'p-1.5 rounded-md',
                            ach.unlocked
                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                              : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {ach.unlocked ? (
                            <Icon className="h-3.5 w-3.5" />
                          ) : (
                            <Lock className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <span
                          className={cn(
                            'font-medium text-xs flex-1 truncate',
                            !ach.unlocked && 'text-muted-foreground',
                          )}
                        >
                          {ach.title}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          +{ach.xp}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2">
                        {ach.description}
                      </p>
                      <div className="flex items-center gap-2">
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

      <p className="text-center text-xs text-muted-foreground pt-4">
        <Info className="inline h-3 w-3 mr-1" />
        Уровни, опыт и достижения — это локальная геймификация. Никакие данные
        не покидают ваше устройство. Подробнее —{' '}
        <Link to="/levels-info" className="text-primary hover:underline">
          здесь
        </Link>
        .
      </p>
    </div>
  );
}
