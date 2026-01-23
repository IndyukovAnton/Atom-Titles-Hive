import { useEffect } from 'react';
import { Timeline } from '@/components/ui/timeline';
import changelogData from '../data/changelog.json';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function ChangelogPage() {
  const data = changelogData.map((entry) => ({
    title: entry.version,
    content: (
      <div>
        <p className="text-muted-foreground text-sm mb-4">
          {new Date(entry.date).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
        <p className="text-foreground text-lg font-medium mb-4">
            {entry.title}
        </p>
        <div className="grid gap-4">
            {entry.changes.map((change, idx) => (
                <div key={idx} className="flex gap-2 items-start text-sm text-neutral-600 dark:text-neutral-400">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                    <span>{change}</span>
                </div>
            ))}
        </div>
        <p className="text-neutral-500 text-xs mt-6">
           {entry.description} 
        </p>
      </div>
    ),
  }));

  // Mark as seen on mount
  useEffect(() => {
    if (changelogData.length > 0) {
        localStorage.setItem('lastSeenVersion', changelogData[0].version);
    }
  }, []);

  return (
    <div className="w-full bg-background min-h-screen">
      <div className="container max-w-4xl py-6 px-4 mx-auto">
        <div className="flex items-center space-x-4 mb-4">
            <Button variant="ghost" size="icon" asChild>
            <Link to="/">
                <ArrowLeft className="h-5 w-5" />
            </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Назад</h1>
        </div>
      </div>
      <Timeline data={data} />
    </div>
  );
}
