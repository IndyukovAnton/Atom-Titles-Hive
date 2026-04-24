import { useState, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Save, User, Mail, Calendar, LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export function AccountSettings() {
  const { user, updateProfile, logout } = useAuthStore();
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    birthDate: user?.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : '',
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast.error('Файл слишком большой (макс. 2MB)');
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        // Save to preferences as a "poor man's" avatar storage
        // ideally this should be a real file upload endpoint
        await updateProfile({
          preferences: {
            ...user?.preferences,
            avatar: base64
          }
        });
        toast.success('Аватар обновлен');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      logger.error(error);
      toast.error('Ошибка загрузки аватара');
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      if (!formData.username.trim() || !formData.email.trim()) {
        toast.error('Заполните обязательные поля');
        return;
      }

      await updateProfile({
        username: formData.username,
        email: formData.email,
        birthDate: formData.birthDate || undefined
      });
      toast.success('Профиль обновлен');
    } catch (error: any) {
        logger.error(error);
        if (error.response?.status === 409) {
             toast.error('Имя пользователя или Email уже заняты');
        } else {
             toast.error('Не удалось обновить профиль');
        }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-background/60 backdrop-blur-sm md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-400">
              <User className="h-5 w-5" />
            </div>
            Профиль пользователя
          </CardTitle>
          <CardDescription>Управление личной информацией</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start animate-in fade-in duration-500">
            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
              <Avatar className="h-32 w-32 border-4 border-background shadow-2xl transition-transform group-hover:scale-105 group-hover:ring-4 ring-primary/20">
                <AvatarImage src={user?.preferences?.avatar || undefined} className="object-cover" />
                <AvatarFallback className="text-4xl font-bold bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                  {user?.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                <Camera className="w-8 h-8 text-white drop-shadow-md" />
              </div>
              
              {isUploading && (
                  <div className="absolute inset-0 bg-background/60 rounded-full flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
              )}
              
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/jpeg,image/png,image/webp" 
                className="hidden" 
                onChange={handleFileChange}
              />
            </div>

            <div className="space-y-5 flex-1 w-full max-w-md">
              <div className="grid gap-2">
                 <Label htmlFor="username" className="text-muted-foreground">Имя пользователя</Label>
                 <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({...prev, username: e.target.value}))}
                        className="pl-9"
                    />
                 </div>
              </div>
              
              <div className="grid gap-2">
                 <Label htmlFor="email" className="text-muted-foreground">Email адрес</Label>
                 <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                        className="pl-9"
                    />
                 </div>
              </div>
              
               <div className="grid gap-2">
                    <Label htmlFor="birth-date" className="text-muted-foreground">Дата рождения</Label>
                     <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="birth-date"
                            type="date"
                            className="flex h-10 w-full rounded-lg border border-input bg-background/50 pl-9 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all font-mono"
                            value={formData.birthDate}
                            onChange={(e) => setFormData(prev => ({...prev, birthDate: e.target.value}))}
                        />
                    </div>
                </div>

              <div className="pt-2">
                  <Button onClick={handleSaveProfile} className="w-full sm:w-auto min-w-[140px]">
                      <Save className="w-4 h-4 mr-2" /> Сохранить
                  </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-6">     
        <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-background/60 backdrop-blur-sm h-fit">
            <CardContent className="p-6">
                 <Button variant="destructive" className="w-full justify-start pl-4" onClick={logout}>
                    <LogOut className="mr-3 h-5 w-5" /> Выйти из аккаунта
                </Button>
                <p className="text-xs text-muted-foreground mt-4 text-center px-4">
                    Выход из аккаунта на этом устройстве. Ваши данные останутся сохранены.
                </p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
