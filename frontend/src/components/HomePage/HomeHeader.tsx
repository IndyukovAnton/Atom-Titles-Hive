import { Plus, User, Settings, LogOut } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HomeHeaderProps {
  title: string;
  username?: string;
  onAddMedia: () => void;
  onNavigateToProfile: () => void;
  onNavigateToSettings: () => void;
  onLogout: () => void;
}

export const HomeHeader = ({ 
  title, 
  username, 
  onAddMedia, 
  onNavigateToProfile, 
  onNavigateToSettings, 
  onLogout 
}: HomeHeaderProps) => {
  return (
    <header className="h-14 border-b flex items-center justify-between px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
      <h1 className="font-bold text-lg tracking-tight hidden md:block">Atom Titles-Hive</h1>
      <h2 className="text-base font-medium md:hidden">{title}</h2>
      
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-medium text-muted-foreground hidden md:block border-r pr-4 mr-2">
          {title}
        </h2>

        <Button onClick={onAddMedia} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Добавить
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{username}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onNavigateToProfile}>
              <User className="mr-2 h-4 w-4" /> Профиль
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onNavigateToSettings}>
              <Settings className="mr-2 h-4 w-4" /> Настройки
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" /> Выйти
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
