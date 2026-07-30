import { describe, it, expect } from 'vitest';
import {
  ACHIEVEMENT_GROUPS,
  ACHIEVEMENT_TOTAL_COUNT,
  CATEGORY_LABELS,
  CATEGORY_TITLES,
  GENRE_TITLES,
  LEVEL_BASE,
  LEVEL_TABLE,
  TITLE_CATEGORY_THRESHOLD,
  TITLE_GENRE_THRESHOLD,
  TITLE_MIN_ENTRIES,
  XP_PER_ENTRY,
  XP_RULES,
  xpForLevel,
} from './index';

describe('gamification data', () => {
  it('has unique category and genre title labels', () => {
    const categoryLabels = Object.values(CATEGORY_TITLES);
    expect(new Set(categoryLabels).size).toBe(categoryLabels.length);

    const genreLabels = Object.values(GENRE_TITLES);
    expect(new Set(genreLabels).size).toBe(genreLabels.length);
  });

  it('maps every category title key to a display label', () => {
    for (const key of Object.keys(CATEGORY_TITLES)) {
      expect(CATEGORY_LABELS[key]).toBeTruthy();
    }
  });

  it('covers all backend genre titles (18)', () => {
    expect(Object.keys(GENRE_TITLES)).toHaveLength(18);
    expect(Object.keys(CATEGORY_TITLES)).toHaveLength(6);
  });

  it('keeps title thresholds consistent with backend', () => {
    expect(TITLE_MIN_ENTRIES).toBe(5);
    expect(TITLE_CATEGORY_THRESHOLD).toBe(10);
    expect(TITLE_GENRE_THRESHOLD).toBe(15);
  });

  it('builds a monotonic XP level table', () => {
    expect(LEVEL_TABLE).toHaveLength(10);
    expect(LEVEL_TABLE[0]).toEqual({ level: 1, xp: 0, delta: LEVEL_BASE });

    for (let i = 1; i < LEVEL_TABLE.length; i++) {
      expect(LEVEL_TABLE[i].xp).toBeGreaterThan(LEVEL_TABLE[i - 1].xp);
      expect(LEVEL_TABLE[i].xp).toBe(xpForLevel(LEVEL_TABLE[i].level));
    }
  });

  it('matches xpForLevel formula (N-1)^2 * LEVEL_BASE', () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(50);
    expect(xpForLevel(3)).toBe(200);
    expect(xpForLevel(4)).toBe(450);
  });

  it('exposes XP rules and achievement groups for the info page', () => {
    expect(XP_PER_ENTRY).toBe(10);
    expect(XP_RULES.length).toBeGreaterThanOrEqual(2);
    expect(ACHIEVEMENT_GROUPS).toHaveLength(5);
    expect(ACHIEVEMENT_TOTAL_COUNT).toBe(20);
  });
});
