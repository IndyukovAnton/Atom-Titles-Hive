import { Link } from 'react-router-dom';
import { Crown, HelpCircle, Sparkles, Star, Trophy } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SubPageNav } from '@/components/SubPageNav';
import {
  ACHIEVEMENT_GROUPS,
  ACHIEVEMENT_TOTAL_COUNT,
  CATEGORY_LABELS,
  CATEGORY_TITLES,
  GENRE_TITLES,
  LEVEL_TABLE,
  TITLE_CATEGORY_THRESHOLD,
  TITLE_GENRE_THRESHOLD,
  TITLE_MIN_ENTRIES,
  XP_RULES,
} from '@/data/gamification';

export default function LevelsInfoPage() {
  return (
    <>
      <SubPageNav />
      <div className="container max-w-3xl py-6 px-4 mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <HelpCircle className="h-6 w-6 text-primary" />
            Как работают уровни и звания
          </h1>
          <p className="text-muted-foreground mt-2">
            Краткий путеводитель по локальной геймификации в Seen.
          </p>
        </div>

        <Card className="gap-3">
          <CardHeader className="px-4 pb-2">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Опыт (XP)
            </CardTitle>
            <CardDescription>За что начисляется опыт</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2.5 text-sm">
            <ul className="space-y-2 list-disc list-outside pl-5 text-muted-foreground">
              {XP_RULES.map((rule) => (
                <li key={rule.highlight ?? rule.text}>
                  {rule.highlight ? (
                    <>
                      <span className="text-foreground font-medium">
                        {rule.highlight}
                      </span>{' '}
                      {rule.text}
                    </>
                  ) : (
                    rule.text
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="gap-3">
          <CardHeader className="px-4 pb-2">
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Уровни
            </CardTitle>
            <CardDescription>
              Формула: на уровень N нужно (N − 1)² × 50 XP
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {LEVEL_TABLE.map((row) => (
                <div
                  key={row.level}
                  className="rounded-md border bg-card/40 p-3 text-center space-y-1"
                >
                  <div className="text-2xl font-bold text-primary">
                    {row.level}
                  </div>
                  <div className="text-muted-foreground font-mono">
                    {row.xp} XP
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Чем выше уровень, тем медленнее он растёт — это нормально.
              Достижения помогают «подталкивать» опыт скачками.
            </p>
          </CardContent>
        </Card>

        <Card className="gap-3">
          <CardHeader className="px-4 pb-2">
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Звания
            </CardTitle>
            <CardDescription>
              Как зарабатываются и от чего зависят
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2.5 text-sm">
            <p className="text-muted-foreground">
              Звание — это короткий ярлык под именем профиля, который
              автоматически отражает вашу самую популярную категорию или жанр.
            </p>
            <div className="space-y-2">
              <h3 className="text-foreground font-medium">
                По категориям (от {TITLE_CATEGORY_THRESHOLD} записей):
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {Object.entries(CATEGORY_TITLES).map(([cat, title]) => (
                  <div
                    key={cat}
                    className="flex items-center justify-between rounded-md border bg-card/40 px-3 py-1.5"
                  >
                    <span className="text-muted-foreground">
                      {CATEGORY_LABELS[cat] ?? cat}
                    </span>
                    <span className="font-medium">{title}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <h3 className="text-foreground font-medium">
                По жанрам (от {TITLE_GENRE_THRESHOLD} записей, если категории
                распределены поровну):
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {Object.entries(GENRE_TITLES).map(([genre, title]) => (
                  <div
                    key={genre}
                    className="flex items-center justify-between rounded-md border bg-card/40 px-3 py-1.5"
                  >
                    <span className="text-muted-foreground">{genre}</span>
                    <span className="font-medium">{title}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Звание появится после {TITLE_MIN_ENTRIES} записей в коллекции —
              раньше оно ещё не показательно.
            </p>
          </CardContent>
        </Card>

        <Card className="gap-3">
          <CardHeader className="px-4 pb-2">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Достижения
            </CardTitle>
            <CardDescription>
              {ACHIEVEMENT_TOTAL_COUNT} достижений в{' '}
              {ACHIEVEMENT_GROUPS.length} группах
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2.5 text-sm">
            <ul className="space-y-2 list-disc list-outside pl-5 text-muted-foreground">
              {ACHIEVEMENT_GROUPS.map((group) => (
                <li key={group.id}>
                  <span className="text-foreground font-medium">
                    {group.title}
                  </span>{' '}
                  — {group.description}
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground pt-1">
              Все достижения видны на странице профиля — заблокированные
              показаны прозрачно с замком, разблокированные подсвечены янтарным.
            </p>
          </CardContent>
        </Card>

        <Card className="gap-3 border-dashed bg-muted/30">
          <CardContent className="p-4 text-sm text-muted-foreground space-y-2">
            <p>
              <span className="text-foreground font-medium">Приватность.</span>{' '}
              Уровни, опыт, достижения и звания вычисляются исключительно на
              основе вашей локальной коллекции. Эти данные нигде не публикуются
              и никому не передаются.
            </p>
            <p>
              Полная политика —{' '}
              <Link to="/privacy" className="text-primary hover:underline">
                на отдельной странице
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
