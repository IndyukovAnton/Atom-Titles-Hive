import type { ReactNode } from 'react';
import ThemeToggle from '../components/ThemeToggle';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="main-layout">
      <ThemeToggle />
      {children}
    </div>
  );
}
