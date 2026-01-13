import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { Moon, Sun, Lock, LogOut, ArrowLeft, User, Shield } from 'lucide-react';
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Пароли не совпадают' });
      return;
    }
    // Mock API call
    setMessage({ type: 'success', text: 'Пароль успешно обновлен (демо)' });
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  return (
    <div className="container max-w-2xl py-10 px-4 mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Настройки</h1>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="ml-6">Внешний вид</span>
            </CardTitle>
            <CardDescription>
              Настройте тему оформления приложения
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Темная тема</Label>
              <p className="text-sm text-muted-foreground">
                Включить темный режим для комфортной работы ночью
              </p>
            </div>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={toggleTheme}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Безопасность
            </CardTitle>
            <CardDescription>
              Управление паролем и доступом
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current">Текущий пароль</Label>
                <Input 
                  id="current"
                  type="password" 
                  value={passwordData.currentPassword}
                  onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new">Новый пароль</Label>
                <Input 
                  id="new"
                  type="password" 
                  value={passwordData.newPassword}
                  onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Подтвердите пароль</Label>
                <Input 
                  id="confirm"
                  type="password" 
                  value={passwordData.confirmPassword}
                  onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  required
                />
              </div>

              {message && (
                <Alert variant={message.type === 'error' ? "destructive" : "default"} className={message.type === 'success' ? "bg-green-500/15 text-green-600 border-green-500/20" : ""}>
                   <AlertDescription>{message.text}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full sm:w-auto">
                <Lock className="mr-2 h-4 w-4" /> Обновить пароль
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Аккаунт
            </CardTitle>
            <CardDescription>
              Информация о текущем пользователе
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                   <Label className="text-muted-foreground">Username</Label>
                   <p className="font-medium">{user?.username}</p>
                </div>
                <div className="space-y-1">
                   <Label className="text-muted-foreground">Email</Label>
                   <p className="font-medium">{user?.email}</p>
                </div>
             </div>
             
             <Separator className="my-4" />
             
             <Button variant="destructive" className="w-full sm:w-auto" onClick={logout}>
               <LogOut className="mr-2 h-4 w-4" /> Выйти из аккаунта
             </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
