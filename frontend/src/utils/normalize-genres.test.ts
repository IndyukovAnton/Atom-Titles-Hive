import { describe, it, expect } from 'vitest';
import { normalizeGenres } from './normalize-genres';

describe('normalizeGenres', () => {
  it('returns arrays as-is, filtering out non-strings', () => {
    expect(normalizeGenres(['Драма', 'Комедия'])).toEqual([
      'Драма',
      'Комедия',
    ]);
    expect(normalizeGenres(['Драма', 42, null])).toEqual(['Драма']);
  });

  it('parses JSON strings', () => {
    expect(normalizeGenres('["Драма","Комедия"]')).toEqual([
      'Драма',
      'Комедия',
    ]);
    expect(normalizeGenres('[]')).toEqual([]);
  });

  it('falls back to CSV split for plain strings', () => {
    expect(normalizeGenres('Драма, Комедия')).toEqual(['Драма', 'Комедия']);
    expect(normalizeGenres('Драма')).toEqual(['Драма']);
  });

  it('returns empty array for empty or invalid payloads', () => {
    expect(normalizeGenres('')).toEqual([]);
    expect(normalizeGenres(null)).toEqual([]);
    expect(normalizeGenres(undefined)).toEqual([]);
    expect(normalizeGenres(42)).toEqual([]);
    expect(normalizeGenres('{"genre":"Драма"}')).toEqual([]);
  });
});
