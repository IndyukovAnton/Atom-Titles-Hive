import { Plus, User, Settings, LogOut, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { useMemo } from 'react';
import { latestVersion } from '@/utils/changelog';
import { Link } from 'react-router-dom';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface HomeHeaderProps {
  title: string;
  username?: string;
  avatar?: string;
  onAddMedia: () => void;
  onNavigateToProfile: () => void;
  onNavigateToSettings: () => void;
  onLogout: () => void;
}

export const HomeHeader = ({ 
  title, 
  username, 
  avatar,
  onAddMedia, 
  onNavigateToProfile, 
  onNavigateToSettings, 
  onLogout 
}: HomeHeaderProps) => {
  // Вычисляем hasUpdate без useEffect
  const hasUpdate = useMemo(() => {
    const lastSeenVersion = localStorage.getItem('lastSeenVersion');
    return latestVersion && lastSeenVersion !== latestVersion;
  }, []);

  return (
    <header className="h-14 border-b flex items-center justify-between px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-10 transition-colors duration-300">
      <h1 className="font-bold text-lg tracking-tight hidden md:block bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
        Atom Titles-Hive
      </h1>
      <h2 className="text-base font-medium md:hidden">{title}</h2>
      
      <div className="flex items-center gap-4">
        {hasUpdate && (
            <Button variant="ghost" size="sm" className="hidden md:flex gap-2 text-amber-500 hover:text-amber-600 hover:bg-amber-100/10" asChild>
                <Link to="/changelog">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-xs font-semibold">Новое!</span>
                </Link>
            </Button>
        )}

        <h2 className="text-sm font-medium text-muted-foreground hidden md:block border-r pr-4 mr-2">
          {title}
        </h2>

        <Button
          id="add-media-btn"
          onClick={onAddMedia}
          size="sm"
          aria-label="Добавить"
          className="shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Добавить</span>
        </Button>

        <NotificationCenter />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 relative">
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatar} alt={username} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                   {username?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              {hasUpdate && (
                <span className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-red-500 rounded-full border-2 border-background md:hidden" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
             {hasUpdate && (
                <>
                  <DropdownMenuItem asChild className="md:hidden">
                    <Link to="/changelog" className="text-amber-500 focus:text-amber-600">
                      <Sparkles className="mr-2 h-4 w-4" /> Что нового?
                    </Link>
                  </DropdownMenuItem>
                   <DropdownMenuSeparator className="md:hidden" />
                </>
             )}
            <DropdownMenuItem onClick={onNavigateToProfile}>
              <User className="mr-2 h-4 w-4" /> Профиль
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onNavigateToSettings}>
              <Settings className="mr-2 h-4 w-4" /> Настройки
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" /> Выйти
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
