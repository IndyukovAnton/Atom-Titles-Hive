import type { ReactNode } from 'react';
import '../styles/Auth.css';

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  error?: string | null;
}

export default function AuthLayout({ children, title, subtitle, error }: AuthLayoutProps) {
  return (
    <div className="auth-container">
      <div className="auth-card">
        {title && <h1>{title}</h1>}
        {subtitle && <h2>{subtitle}</h2>}
        
        {error && <div className="error-message">{error}</div>}
        
        {children}
      </div>
    </div>
  );
}
