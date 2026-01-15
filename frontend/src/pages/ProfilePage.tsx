import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { mediaApi } from '../api/media';
import { User, Star, Film, Book, Calendar, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
    <div className="container max-w-4xl py-10 px-4 mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
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

      <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/10 shadow-sm">
        <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center text-primary shadow-inner">
          <User size={48} />
        </div>
        <div className="text-center md:text-left space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{user?.username}</h1>
          <p className="text-muted-foreground font-medium">{user?.email || 'No email provided'}</p>
          <div className="flex items-center justify-center md:justify-start text-xs text-muted-foreground bg-background/50 px-2 py-1 rounded-full w-fit mx-auto md:mx-0 border">
            <Calendar className="mr-1 h-3 w-3" /> 
            Joined recently
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Film className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalItems}</div>
            <p className="text-xs text-muted-foreground">
              titles in library
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgRating}</div>
            <p className="text-xs text-muted-foreground">
              out of 10
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
            <Book className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">{stats?.topCategory}</div>
            <p className="text-xs text-muted-foreground">
              favorite genre
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
          <CardDescription>Distribution of your library by category</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(stats?.byCategory || {}).length === 0 ? (
             <div className="text-center py-8 text-muted-foreground">No data available</div>
          ) : (
             Object.entries(stats?.byCategory || {})
              .sort((a, b) => b[1] - a[1]) // Sort by count desc
              .map(([cat, count]) => (
              <div key={cat} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="font-medium flex items-center">
                     {cat}
                  </div>
                  <span className="text-muted-foreground">{count} items</span>
                </div>
                <Progress value={(count / (stats?.totalItems || 1)) * 100} className="h-2" />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
