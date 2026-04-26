import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Crown,
  HelpCircle,
  Sparkles,
  Star,
  Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const LEVEL_TABLE = Array.from({ length: 10 }, (_, i) => {
  const level = i + 1;
  const xp = (level - 1) * (level - 1) * 50;
  const xpForNext = level * level * 50;
  return { level, xp, delta: xpForNext - xp };
});

export default function LevelsInfoPage() {
  return (
    <div className="container max-w-3xl py-8 px-4 mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link to="/profile">
            <ArrowLeft className="mr-2 h-4 w-4" /> К профилю
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <HelpCircle className="h-7 w-7 text-primary" />
          Как работают уровни и звания
        </h1>
        <p className="text-muted-foreground mt-2">
          Краткий путеводитель по локальной геймификации в Seen.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Опыт (XP)
          </CardTitle>
          <CardDescription>За что начисляется опыт</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ul className="space-y-2 list-disc list-outside pl-5 text-muted-foreground">
            <li>
              <span className="text-foreground font-medium">+10 XP</span> за
              каждую запись, добавленную в медиатеку.
            </li>
            <li>
              <span className="text-foreground font-medium">+10…+250 XP</span>{' '}
              за каждое разблокированное достижение — чем сложнее, тем больше.
            </li>
            <li>
              Если запись удаляется, накопленный опыт за неё уходит — статистика
              всегда отражает текущее состояние коллекции.
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Уровни
          </CardTitle>
          <CardDescription>
            Формула: на уровень N нужно (N − 1)² × 50 XP
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Звания
          </CardTitle>
          <CardDescription>
            Как зарабатываются и от чего зависят
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Звание — это короткий ярлык под именем профиля, который
            автоматически отражает вашу самую популярную категорию или жанр.
          </p>
          <div className="space-y-2">
            <h3 className="text-foreground font-medium">
              По категориям (приоритет):
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {[
                ['Фильмы', 'Киноман'],
                ['Сериалы', 'Сериаломан'],
                ['Книги', 'Книголюб'],
                ['Игры', 'Геймер'],
                ['Аниме', 'Анимешник'],
                ['Манга', 'Мангака'],
              ].map(([cat, title]) => (
                <div
                  key={cat}
                  className="flex items-center justify-between rounded-md border bg-card/40 px-3 py-1.5"
                >
                  <span className="text-muted-foreground">{cat}</span>
                  <span className="font-medium">{title}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2 pt-2">
            <h3 className="text-foreground font-medium">
              По жанрам (если категории распределены поровну):
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {[
                ['Фэнтези', 'Маг'],
                ['Ужасы', 'Бесстрашный'],
                ['Детектив', 'Сыщик'],
                ['Романтика', 'Романтик'],
                ['Фантастика', 'Космонавт'],
                ['Комедия', 'Шут'],
                ['Драма', 'Драматург'],
                ['Экшен', 'Боец'],
                ['Триллер', 'Хладнокровный'],
              ].map(([g, title]) => (
                <div
                  key={g}
                  className="flex items-center justify-between rounded-md border bg-card/40 px-3 py-1.5"
                >
                  <span className="text-muted-foreground">{g}</span>
                  <span className="font-medium">{title}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            Звание появится после 5 записей в коллекции — раньше оно ещё не
            показательно.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Достижения
          </CardTitle>
          <CardDescription>20 достижений в 5 группах</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ul className="space-y-2 list-disc list-outside pl-5 text-muted-foreground">
            <li>
              <span className="text-foreground font-medium">Коллекция</span> —
              за число записей: 1, 10, 50, 100, 250.
            </li>
            <li>
              <span className="text-foreground font-medium">Оценки</span> — за
              количество и качество поставленных оценок.
            </li>
            <li>
              <span className="text-foreground font-medium">Разнообразие</span>{' '}
              — за записи в разных категориях.
            </li>
            <li>
              <span className="text-foreground font-medium">Категории</span> —
              отдельный значок для каждой популярной категории (25 записей).
            </li>
            <li>
              <span className="text-foreground font-medium">Жанры</span> — за 15
              записей в любимом жанре (Фэнтези, Ужасы, Детектив, Романтика).
            </li>
          </ul>
          <p className="text-xs text-muted-foreground pt-1">
            Все достижения видны на странице профиля — заблокированные показаны
            прозрачно с замком, разблокированные подсвечены янтарным.
          </p>
        </CardContent>
      </Card>

      <Card className="border-dashed bg-muted/30">
        <CardContent className="p-5 text-sm text-muted-foreground space-y-2">
          <p>
            <span className="text-foreground font-medium">Приватность.</span>{' '}
            Уровни, опыт, достижения и звания вычисляются исключительно на
            основе вашей локальной коллекции. Эти данные нигде не публикуются и
            никому не передаются.
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
  );
}
