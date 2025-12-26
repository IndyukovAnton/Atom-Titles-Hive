import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';
import AuthLayout from '../layouts/AuthLayout';
import '../styles/Auth.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsSuccess(true);
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError('Не удалось отправить письмо. Попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout title="Письмо отправлено!">
        <div className="success-content" style={{ textAlign: 'center', padding: '20px 0' }}>
          <FaCheckCircle size={64} className="success-icon" style={{ color: 'var(--btn-primary-bg)', marginBottom: 24 }} />
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
            Проверьте ваш email для инструкций по восстановлению пароля.
          </p>
          <Link to="/login" className="btn-primary" style={{ display: 'block', textDecoration: 'none' }}>
            Вернуться к входу
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Titles Tracker" 
      subtitle="Восстановление пароля" 
      error={error}
    >
      <p className="auth-description" style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 24, fontSize: 14 }}>
        Введите email вашего аккаунта, и мы отправим инструкции по восстановлению пароля
      </p>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Введите ваш email"
            required
            disabled={isLoading}
            autoFocus
            autoComplete="email"
          />
        </div>

        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading && <span className="spinner"></span>}
          {isLoading ? 'Отправка...' : 'Отправить'}
        </button>
      </form>

      <p className="auth-footer" style={{ marginTop: 32 }}>
        Вспомнили пароль? <Link to="/login">Войти</Link>
      </p>
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <Link to="/login" style={{ color: 'var(--text-secondary)', fontSize: 13, textDecoration: 'none' }}>
           ← Назад
        </Link>
      </div>
    </AuthLayout>
  );
}
