import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { mediaApi } from '../api/media';
import { User, Star, Film, Book, Calendar, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface UserStats {
  totalItems: number;
  avgRating: number;
  byCategory: Record<string, number>;
  topCategory: string;
}

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    calculateStats();
  }, []);

  const calculateStats = async () => {
    try {
      const allMedia = await mediaApi.getAll();
      
      const totalItems = allMedia.length;
      const totalRating = allMedia.reduce((acc, curr) => acc + curr.rating, 0);
      const avgRating = totalItems > 0 ? (totalRating / totalItems).toFixed(1) : '0';
      
      const byCategory: Record<string, number> = {};
      allMedia.forEach(item => {
        const cat = item.category || 'Other';
        byCategory[cat] = (byCategory[cat] || 0) + 1;
      });

      const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

      setStats({
        totalItems,
        avgRating: Number(avgRating),
        byCategory,
        topCategory
      });
    } catch (e) {
      console.error('Failed to load stats', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-6 px-4 mx-auto space-y-6 animate-in fade-in">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-[200px]" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-[200px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-6 px-4 mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div>
        <Button 
          variant="ghost" 
          onClick={() => window.history.back()}
          className="hover:bg-muted/50 -ml-2 mb-2"
          size="sm"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Назад
        </Button>
      </div>

      <Card className="p-6 border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-row items-center gap-5">
          <Avatar className="h-20 w-20 border-2 border-muted">
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
              <User size={32} />
            </AvatarFallback>
          </Avatar>
          
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{user?.username}</h1>
            <p className="text-muted-foreground text-sm font-medium">{user?.email || 'No email provided'}</p>
            <div className="flex items-center text-xs text-muted-foreground pt-1">
              <Calendar className="mr-1.5 h-3 w-3" /> 
              Joined recently
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm hover:bg-muted/5 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Всего записей</CardTitle>
            <Film className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{stats?.totalItems}</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              в медиатеке
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:bg-muted/5 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Средний рейтинг</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{stats?.avgRating}</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              из 10
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:bg-muted/5 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Топ категория</CardTitle>
            <Book className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold truncate">{stats?.topCategory}</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              любимый жанр
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Detailed Stats */}
        <Card className="shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Film className="h-4 w-4 text-primary" />
              Категории
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {Object.entries(stats?.byCategory || {}).length === 0 ? (
               <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg text-sm">
                 <p>Нет данных</p>
               </div>
            ) : (
               Object.entries(stats?.byCategory || {})
                .sort((a, b) => b[1] - a[1])
                .map(([cat, count]) => (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{cat}</span>
                      <span className="text-muted-foreground text-xs">{count} шт.</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(count / (stats?.totalItems || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
            )}
          </CardContent>
        </Card>

        {/* Achievements Section */}
        <Card className="shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              Достижения
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Achievement 1: First Entry */}
              <div className="p-3 rounded-lg border bg-card hover:bg-muted/5 transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  <Film className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium text-xs">Первый шаг</span>
                </div>
                <div className="h-1 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full w-full bg-primary rounded-full" />
                </div>
              </div>

              {/* Achievement 2: Critic */}
              <div className="p-3 rounded-lg border bg-card hover:bg-muted/5 transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  <Star className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium text-xs">Критик</span>
                </div>
                <div className="h-1 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min((stats?.totalItems || 0) / 10 * 100, 100)}%` }} />
                </div>
              </div>

              {/* Achievement 3: Collector */}
              <div className="p-3 rounded-lg border bg-card hover:bg-muted/5 transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  <Book className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium text-xs">Коллекционер</span>
                </div>
                <div className="h-1 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min((stats?.totalItems || 0) / 50 * 100, 100)}%` }} />
                </div>
              </div>

              {/* Achievement 4: Diverse */}
              <div className="p-3 rounded-lg border bg-card hover:bg-muted/5 transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  <Film className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium text-xs">Разносторонний</span>
                </div>
                <div className="h-1 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(Object.keys(stats?.byCategory || {}).length / 5 * 100, 100)}%` }} />
                </div>
              </div>

              {/* Achievement 5: Perfectionist */}
              <div className="p-3 rounded-lg border bg-card hover:bg-muted/5 transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  <Star className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium text-xs">Перфекционист</span>
                </div>
                <div className="h-1 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${(stats?.avgRating || 0) >= 8 ? 100 : (stats?.avgRating || 0) / 8 * 100}%` }} />
                </div>
              </div>

              {/* Achievement 6: Explorer */}
              <div className="p-3 rounded-lg border bg-card hover:bg-muted/5 transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium text-xs">Исследователь</span>
                </div>
                <div className="h-1 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '25%' }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
