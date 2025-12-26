import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { FaMoon, FaSun, FaLock, FaSignOutAlt } from 'react-icons/fa';
import '../styles/Settings.css';
import { Link } from "react-router-dom";

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
    <div className="settings-container">

      <Link to="/" style={{ color: 'var(--text-secondary)', fontSize: 13, textDecoration: 'none' }}>
         ← Назад
      </Link>

      <h1>Настройки</h1>

      <section className="settings-section">
        <h2>Внешний вид</h2>
        <div className="setting-item toggle-setting">
          <div className="setting-info">
            <span className="setting-label">Тема оформления</span>
            <span className="setting-desc">Переключение между темной и светлой темой</span>
          </div>
          <button className="btn-toggle-theme" onClick={toggleTheme}>
            {theme === 'dark' ? <FaMoon /> : <FaSun />}
            {theme === 'dark' ? 'Темная' : 'Светлая'}
          </button>
        </div>
      </section>

      <section className="settings-section">
        <h2>Безопасность</h2>
        <div className="setting-item">
          <h3><FaLock /> Смена пароля</h3>
          <form onSubmit={handlePasswordChange} className="password-form">
            <input 
              type="password" 
              placeholder="Текущий пароль"
              value={passwordData.currentPassword}
              onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})}
              required
            />
            <input 
              type="password" 
              placeholder="Новый пароль"
              value={passwordData.newPassword}
              onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
              required
            />
            <input 
              type="password" 
              placeholder="Подтвердите пароль"
              value={passwordData.confirmPassword}
              onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
              required
            />
            <button type="submit" className="btn-secondary">Обновить пароль</button>
          </form>
          {message && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}
        </div>
      </section>

      <section className="settings-section">
        <h2>Аккаунт</h2>
        <div className="setting-item">
          <div className="user-details">
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Username:</strong> {user?.username}</p>
          </div>
          <button className="btn-logout-large" onClick={logout}>
            <FaSignOutAlt /> Выйти из аккаунта
          </button>
        </div>
      </section>
    </div>
  );
}
