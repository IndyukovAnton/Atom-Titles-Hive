import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '../test/utils/test-utils';
import { SubPageNav } from './SubPageNav';

describe('SubPageNav', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('should render brand link and all nav items', () => {
    render(<SubPageNav />);

    expect(screen.getByRole('link', { name: 'Seen' })).toHaveAttribute(
      'href',
      '/',
    );
    expect(screen.getByRole('link', { name: /главная/i })).toHaveAttribute(
      'href',
      '/',
    );
    expect(screen.getByRole('link', { name: /профиль/i })).toHaveAttribute(
      'href',
      '/profile',
    );
    expect(screen.getByRole('link', { name: /настройки/i })).toHaveAttribute(
      'href',
      '/settings',
    );
  });

  it('should highlight the active route', () => {
    window.history.pushState({}, '', '/profile');
    render(<SubPageNav />);

    expect(screen.getByRole('link', { name: /профиль/i }).className).toContain(
      'bg-primary/10',
    );
    expect(
      screen.getByRole('link', { name: /настройки/i }).className,
    ).not.toContain('bg-primary/10');
    expect(
      screen.getByRole('link', { name: /главная/i }).className,
    ).not.toContain('bg-primary/10');
  });

  it('should not highlight home on nested routes', () => {
    window.history.pushState({}, '', '/settings');
    render(<SubPageNav />);

    expect(
      screen.getByRole('link', { name: /главная/i }).className,
    ).not.toContain('bg-primary/10');
    expect(
      screen.getByRole('link', { name: /настройки/i }).className,
    ).toContain('bg-primary/10');
  });
});
