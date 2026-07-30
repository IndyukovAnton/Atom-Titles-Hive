import { User } from '../entities/user.entity';
import { toPublicPreferences, toPublicUser } from './public-user.util';

describe('toPublicPreferences', () => {
  it('should return null when preferences are missing', () => {
    expect(toPublicPreferences(undefined)).toBeNull();
    expect(toPublicPreferences(null)).toBeNull();
  });

  it('should replace secret keys with presence flags', () => {
    const result = toPublicPreferences({
      theme: 'dark',
      aiKey: 'secret-ai-key',
      anthropicApiKey: 'sk-ant-secret',
      tmdbApiKey: 'tmdb-secret',
    });

    expect(result).toMatchObject({
      theme: 'dark',
      hasAiKey: true,
      hasAnthropicApiKey: true,
      hasTmdbApiKey: true,
    });

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('secret-ai-key');
    expect(serialized).not.toContain('sk-ant-secret');
    expect(serialized).not.toContain('tmdb-secret');
  });

  it('should report false flags when keys are not set', () => {
    expect(toPublicPreferences({ theme: 'light' })).toEqual({
      theme: 'light',
      hasAiKey: false,
      hasAnthropicApiKey: false,
      hasTmdbApiKey: false,
    });
  });
});

describe('toPublicUser', () => {
  const buildUser = (overrides?: Partial<User>): User =>
    Object.assign(new User(), {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      ...overrides,
    });

  it('should map the full public profile including onboarding status', () => {
    const birthDate = new Date('2000-01-01');
    const user = buildUser({
      birthDate,
      preferences: { theme: 'dark' },
      hasCompletedOnboarding: true,
    });

    expect(toPublicUser(user)).toEqual({
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      birthDate,
      preferences: {
        theme: 'dark',
        hasAiKey: false,
        hasAnthropicApiKey: false,
        hasTmdbApiKey: false,
      },
      hasCompletedOnboarding: true,
    });
  });

  it('should default onboarding status to false for fresh entities', () => {
    // У entity после repository.create() default из БД ещё не подставлен —
    // маппер не должен отдавать undefined, иначе клиент снова покажет тур.
    const user = buildUser();

    expect(toPublicUser(user).hasCompletedOnboarding).toBe(false);
  });

  it('should normalize missing email to null', () => {
    const user = buildUser({ email: undefined });

    expect(toPublicUser(user).email).toBeNull();
  });
});
