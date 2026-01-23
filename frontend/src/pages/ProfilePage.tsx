import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { mediaApi } from '../api/media';
import { User, Star, Film, Book, Calendar, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

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
      <div className="container max-w-4xl py-10 px-4 mx-auto space-y-8 animate-in fade-in">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="h-[300px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-10 px-4 mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10 bg-background/80 backdrop-blur-sm rounded-2xl my-4 shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => window.history.back()}
          className="hover:bg-muted/50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Назад
        </Button>
      </div>

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-purple-500/10 to-cyan-500/10 border border-primary/10 shadow-xl p-8">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-cyan-500/20 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative flex flex-col md:flex-row items-center gap-6">
          {/* Gradient Avatar */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-primary to-cyan-500 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity animate-pulse" />
            <div className="relative h-28 w-28 rounded-full bg-gradient-to-br from-purple-500 via-primary to-cyan-500 p-1 shadow-2xl">
              <div className="h-full w-full rounded-full bg-background flex items-center justify-center">
                <User size={48} className="text-primary" />
              </div>
            </div>
          </div>
          
          <div className="text-center md:text-left space-y-2">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">{user?.username}</h1>
            <p className="text-muted-foreground font-medium">{user?.email || 'No email provided'}</p>
            <div className="flex items-center justify-center md:justify-start text-xs text-muted-foreground bg-background/60 backdrop-blur-sm px-3 py-1.5 rounded-full w-fit mx-auto md:mx-0 border border-border/50 shadow-sm">
              <Calendar className="mr-1.5 h-3 w-3" /> 
              Joined recently
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-all hover:-translate-y-1 border-0 shadow-md overflow-hidden group">
          <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего записей</CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 group-hover:scale-110 transition-transform">
              <Film className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{stats?.totalItems}</div>
            <p className="text-xs text-muted-foreground mt-1">
              в медиатеке
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-all hover:-translate-y-1 border-0 shadow-md overflow-hidden group">
          <div className="h-1 bg-gradient-to-r from-amber-500 to-yellow-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Средний рейтинг</CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20 group-hover:scale-110 transition-transform">
              <Star className="h-4 w-4 text-amber-600 dark:text-amber-400 fill-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">{stats?.avgRating}</div>
            <p className="text-xs text-muted-foreground mt-1">
              из 10
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-all hover:-translate-y-1 border-0 shadow-md overflow-hidden group">
          <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Топ категория</CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 group-hover:scale-110 transition-transform">
              <Book className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent truncate">{stats?.topCategory}</div>
            <p className="text-xs text-muted-foreground mt-1">
              любимый жанр
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
              <Film className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            Распределение по категориям
          </CardTitle>
          <CardDescription>Статистика вашей медиатеки</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {Object.entries(stats?.byCategory || {}).length === 0 ? (
             <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl">
               <Film className="h-10 w-10 mx-auto mb-3 opacity-30" />
               <p>Нет данных для отображения</p>
             </div>
          ) : (
             Object.entries(stats?.byCategory || {})
              .sort((a, b) => b[1] - a[1])
              .map(([cat, count], index) => {
                const colors = [
                  'from-blue-500 to-cyan-500',
                  'from-purple-500 to-pink-500', 
                  'from-amber-500 to-orange-500',
                  'from-green-500 to-emerald-500',
                  'from-red-500 to-rose-500',
                  'from-indigo-500 to-violet-500'
                ];
                const colorClass = colors[index % colors.length];
                
                return (
                  <div key={cat} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="font-semibold flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${colorClass}`} />
                        {cat}
                      </div>
                      <span className="text-muted-foreground font-medium">{count} шт.</span>
                    </div>
                    <div className="h-2.5 bg-muted/50 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${colorClass} rounded-full transition-all duration-500`}
                        style={{ width: `${(count / (stats?.totalItems || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })
          )}
        </CardContent>
      </Card>

      {/* Achievements Section */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20">
              <Star className="h-4 w-4 text-amber-600 dark:text-amber-400 fill-amber-500" />
            </div>
            Достижения
          </CardTitle>
          <CardDescription>Ваши награды и прогресс</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Achievement 1: First Entry */}
            <div className="group p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-all hover:-translate-y-0.5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/25">
                  <Film className="h-4 w-4" />
                </div>
                <span className="font-semibold text-sm">Первый шаг</span>
              </div>
              <p className="text-xs text-muted-foreground">Добавьте первую запись</p>
              <div className="mt-2 h-1.5 bg-emerald-500/20 rounded-full overflow-hidden">
                <div className="h-full w-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full" />
              </div>
            </div>

            {/* Achievement 2: Critic */}
            <div className="group p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-all hover:-translate-y-0.5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-500 text-white shadow-lg shadow-amber-500/25">
                  <Star className="h-4 w-4" />
                </div>
                <span className="font-semibold text-sm">Критик</span>
              </div>
              <p className="text-xs text-muted-foreground">Оцените 10 записей</p>
              <div className="mt-2 h-1.5 bg-amber-500/20 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full" style={{ width: `${Math.min((stats?.totalItems || 0) / 10 * 100, 100)}%` }} />
              </div>
            </div>

            {/* Achievement 3: Collector */}
            <div className="group p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-all hover:-translate-y-0.5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25">
                  <Book className="h-4 w-4" />
                </div>
                <span className="font-semibold text-sm">Коллекционер</span>
              </div>
              <p className="text-xs text-muted-foreground">Соберите 50 записей</p>
              <div className="mt-2 h-1.5 bg-purple-500/20 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: `${Math.min((stats?.totalItems || 0) / 50 * 100, 100)}%` }} />
              </div>
            </div>

            {/* Achievement 4: Diverse */}
            <div className="group p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 hover:border-blue-500/40 transition-all hover:-translate-y-0.5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25">
                  <Film className="h-4 w-4" />
                </div>
                <span className="font-semibold text-sm">Разносторонний</span>
              </div>
              <p className="text-xs text-muted-foreground">5 категорий</p>
              <div className="mt-2 h-1.5 bg-blue-500/20 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" style={{ width: `${Math.min(Object.keys(stats?.byCategory || {}).length / 5 * 100, 100)}%` }} />
              </div>
            </div>

            {/* Achievement 5: Perfectionist */}
            <div className="group p-4 rounded-xl bg-gradient-to-br from-rose-500/10 to-red-500/10 border border-rose-500/20 hover:border-rose-500/40 transition-all hover:-translate-y-0.5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-rose-500 to-red-500 text-white shadow-lg shadow-rose-500/25">
                  <Star className="h-4 w-4" />
                </div>
                <span className="font-semibold text-sm">Перфекционист</span>
              </div>
              <p className="text-xs text-muted-foreground">Рейтинг выше 8</p>
              <div className="mt-2 h-1.5 bg-rose-500/20 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-rose-500 to-red-500 rounded-full" style={{ width: `${(stats?.avgRating || 0) >= 8 ? 100 : (stats?.avgRating || 0) / 8 * 100}%` }} />
              </div>
            </div>

            {/* Achievement 6: Explorer */}
            <div className="group p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 hover:border-indigo-500/40 transition-all hover:-translate-y-0.5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25">
                  <Calendar className="h-4 w-4" />
                </div>
                <span className="font-semibold text-sm">Исследователь</span>
              </div>
              <p className="text-xs text-muted-foreground">30 дней подряд</p>
              <div className="mt-2 h-1.5 bg-indigo-500/20 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" style={{ width: '25%' }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
