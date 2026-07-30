import { Home, Settings, User, type LucideIcon } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SubPageNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const NAV_ITEMS: SubPageNavItem[] = [
  { to: '/', label: 'Главная', icon: Home, end: true },
  { to: '/profile', label: 'Профиль', icon: User },
  { to: '/settings', label: 'Настройки', icon: Settings },
];

/**
 * Sticky-панель для подстраниц (Профиль, Настройки, справочные страницы):
 * логотип-ссылка на главную + быстрые переходы между разделами с подсветкой
 * активного. Заменяет одиночную кнопку «Назад».
 */
export function SubPageNav() {
  return (
    <header className="sticky top-0 z-10 h-12 border-b bg-background/80 backdrop-blur-sm transition-colors duration-300">
      <div className="container mx-auto flex h-full max-w-5xl items-center justify-between gap-3 px-4">
        <Link
          to="/"
          className="font-bold tracking-tight bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent"
        >
          Seen
        </Link>

        <nav
          aria-label="Основная навигация"
          className="flex items-center gap-1"
        >
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                )
              }
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
