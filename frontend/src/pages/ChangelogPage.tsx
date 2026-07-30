import { useEffect, useMemo, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MarkdownLite } from '@/components/MarkdownLite';
import { SubPageNav } from '@/components/SubPageNav';
import { changelog, latestVersion } from '@/utils/changelog';
import { cn } from '@/lib/utils';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const formatShortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

export default function ChangelogPage() {
  // Помечаем последнюю версию как «увиденную» — индикатор «Новое» в шапке гаснет.
  useEffect(() => {
    if (latestVersion) {
      localStorage.setItem('lastSeenVersion', latestVersion);
    }
  }, []);

  const [selectedVersion, setSelectedVersion] = useState(
    () => latestVersion || changelog[0]?.version || '',
  );

  const selected = useMemo(
    () => changelog.find((e) => e.version === selectedVersion) ?? changelog[0],
    [selectedVersion],
  );

  return (
    <>
      <SubPageNav />
      <div className="container max-w-5xl py-6 px-4 mx-auto space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">История версий</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Список изменений по релизам
            {typeof __APP_VERSION__ !== 'undefined' && (
              <>
                {' '}
                · приложение{' '}
                <span className="font-mono text-foreground">
                  v{__APP_VERSION__}
                </span>
              </>
            )}
          </p>
        </div>

        {changelog.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">
            Записи об изменениях пока не добавлены.
          </p>
        ) : (
          <div className="grid gap-5 md:grid-cols-[220px_1fr]">
            {/* Mobile: горизонтальные chips */}
            <div className="md:hidden -mx-4 px-4">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {changelog.map((entry) => {
                  const isActive = entry.version === selected?.version;
                  const isLatest = entry.version === latestVersion;
                  return (
                    <button
                      key={entry.version}
                      type="button"
                      onClick={() => setSelectedVersion(entry.version)}
                      className={cn(
                        'shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      v{entry.version}
                      {isLatest && (
                        <Badge
                          variant="default"
                          className="ml-1.5 h-4 px-1.5 text-[10px]"
                        >
                          NEW
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Desktop: sticky sidebar */}
            <aside className="hidden md:block">
              <ScrollArea className="h-[min(70vh,560px)] sticky top-16 pr-2">
                <nav aria-label="Версии" className="flex flex-col gap-0.5">
                  {changelog.map((entry) => {
                    const isActive = entry.version === selected?.version;
                    const isLatest = entry.version === latestVersion;
                    return (
                      <button
                        key={entry.version}
                        type="button"
                        onClick={() => setSelectedVersion(entry.version)}
                        className={cn(
                          'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block font-medium font-mono">
                            v{entry.version}
                          </span>
                          <span className="block text-xs text-muted-foreground/80 truncate">
                            {formatShortDate(entry.date)}
                          </span>
                        </span>
                        {isLatest && (
                          <Badge
                            variant="default"
                            className="h-4 shrink-0 px-1.5 text-[10px]"
                          >
                            NEW
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </ScrollArea>
            </aside>

            {/* Content */}
            {selected && (
              <article className="min-w-0 space-y-3 rounded-xl border bg-card/40 p-4 sm:p-5">
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs uppercase tracking-wider">
                    {formatDate(selected.date)}
                  </p>
                  <h2 className="text-lg font-semibold leading-snug">
                    <span className="font-mono text-primary mr-2">
                      v{selected.version}
                    </span>
                    {selected.title}
                  </h2>
                </div>
                <MarkdownLite source={selected.body} />
              </article>
            )}
          </div>
        )}
      </div>
    </>
  );
}
