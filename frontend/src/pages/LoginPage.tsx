import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import AuthLayout from '../layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      // Ошибка уже обработана в store
    }
  };

  return (
    <AuthLayout 
      title="Titles Tracker" 
      subtitle="Добро пожаловать" 
      error={error}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Имя пользователя</Label>
          <Input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Введите имя пользователя"
            required
            disabled={isLoading}
            autoFocus
            autoComplete="username"
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Пароль</Label>
            <Link 
              to="/forgot-password" 
              className="text-sm font-medium text-primary hover:underline"
              tabIndex={-1}
            >
              Забыли пароль?
            </Link>
          </div>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              required
              minLength={6}
              disabled={isLoading}
              autoComplete="current-password"
              className="pr-10 h-11"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full h-11 text-base shadow-lg hover:shadow-primary/25 transition-all" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Вход...' : 'Войти'}
        </Button>
      </form>

      <div className="text-center text-sm text-muted-foreground mt-6">
        Нет аккаунта?{' '}
        <Link to="/register" className="text-primary hover:underline font-medium">
          Зарегистрироваться
        </Link>
      </div>
    </AuthLayout>
  );
}
