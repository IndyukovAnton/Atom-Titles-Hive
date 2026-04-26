import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Timeline } from '@/components/ui/timeline';
import { Button } from '@/components/ui/button';
import { MarkdownLite } from '@/components/MarkdownLite';
import { changelog, latestVersion } from '@/utils/changelog';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

export default function ChangelogPage() {
  // Помечаем последнюю версию как «увиденную» — индикатор «Новое» в шапке гаснет.
  useEffect(() => {
    if (latestVersion) {
      localStorage.setItem('lastSeenVersion', latestVersion);
    }
  }, []);

  const data = changelog.map((entry) => ({
    title: `v${entry.version}`,
    content: (
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs uppercase tracking-wider">
          {formatDate(entry.date)}
        </p>
        <p className="text-foreground text-lg font-semibold">{entry.title}</p>
        <MarkdownLite source={entry.body} />
      </div>
    ),
  }));

  return (
    <div className="w-full bg-background min-h-screen">
      <div className="container max-w-4xl py-6 px-4 mx-auto">
        <div className="flex items-center space-x-4 mb-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">История версий</h1>
        </div>
      </div>
      {data.length === 0 ? (
        <div className="container max-w-4xl mx-auto px-4 py-12 text-center text-muted-foreground">
          Записи об изменениях пока не добавлены.
        </div>
      ) : (
        <Timeline data={data} />
      )}
    </div>
  );
}
