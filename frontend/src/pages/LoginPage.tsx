import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuthStore } from '../store/authStore';
import AuthLayout from '../layouts/AuthLayout';
import '../styles/Auth.css';

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
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="username">Имя пользователя</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Введите имя пользователя"
            required
            disabled={isLoading}
            autoFocus
            autoComplete="username"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Пароль</label>
          <div className="password-input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              required
              minLength={6}
              disabled={isLoading}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
            >
              {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
            </button>
          </div>
        </div>

        <div className="forgot-password">
          <Link to="/forgot-password">Забыли пароль?</Link>
        </div>

        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading && <span className="spinner"></span>}
          {isLoading ? 'Вход...' : 'Войти'}
        </button>
      </form>

      <p className="auth-footer">
        Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
      </p>
    </AuthLayout>
  );
}
