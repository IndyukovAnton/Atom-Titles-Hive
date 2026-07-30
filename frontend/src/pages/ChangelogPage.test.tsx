import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import ChangelogPage from './ChangelogPage';
import { changelog, latestVersion } from '@/utils/changelog';

describe('ChangelogPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders version list and latest entry by default', () => {
    render(<ChangelogPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'История версий' }),
    ).toBeInTheDocument();

    // Latest version appears in nav (desktop + mobile) and content heading.
    expect(screen.getAllByText(`v${latestVersion}`).length).toBeGreaterThan(0);
    expect(
      screen.getByRole('heading', {
        name: new RegExp(changelog[0].title),
      }),
    ).toBeInTheDocument();
  });

  it('marks latestVersion as seen in localStorage', () => {
    render(<ChangelogPage />);
    expect(localStorage.getItem('lastSeenVersion')).toBe(latestVersion);
  });

  it('switches content when another version is selected', async () => {
    const user = userEvent.setup();
    render(<ChangelogPage />);

    const older = changelog.find((e) => e.version !== latestVersion);
    expect(older).toBeDefined();
    if (!older) return;

    // Multiple buttons (mobile chips + desktop sidebar) share the same label.
    const buttons = screen.getAllByRole('button', {
      name: new RegExp(`v${older.version}`),
    });
    await user.click(buttons[0]);

    expect(
      screen.getByRole('heading', { name: new RegExp(older.title) }),
    ).toBeInTheDocument();
  });

  it('shows NEW badge on the latest version', () => {
    render(<ChangelogPage />);
    expect(screen.getAllByText('NEW').length).toBeGreaterThan(0);
  });
});
