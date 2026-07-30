import { describe, it, expect } from 'vitest';
import { aiCardToAddMediaInitial } from './aiCardMapping';
import type { AICard, ClaudeContentType } from '@/api/recommendations';

const baseCard: AICard = {
  title: 'Test Title',
  type: 'movie',
  genres: ['Action'],
  whyRecommended: 'Because reasons',
  posterUrl: 'https://example.com/poster.jpg',
};

const TYPE_CASES: [ClaudeContentType, string | undefined][] = [
  ['movie', 'Movie'],
  ['series', 'Series'],
  ['anime', 'Anime'],
  ['book', 'Book'],
  ['game', 'Game'],
  ['other', undefined],
];

describe('aiCardToAddMediaInitial', () => {
  it.each(TYPE_CASES)('maps type "%s" to category "%s"', (type, expected) => {
    const initial = aiCardToAddMediaInitial({ ...baseCard, type });
    expect(initial.category).toBe(expected);
  });

  it('maps common card fields', () => {
    const initial = aiCardToAddMediaInitial(baseCard);
    expect(initial).toMatchObject({
      title: baseCard.title,
      description: baseCard.whyRecommended,
      image: baseCard.posterUrl,
      rating: 0,
      genres: baseCard.genres,
    });
  });

  it('marks the entry as ai-sourced', () => {
    expect(aiCardToAddMediaInitial(baseCard).source).toBe('ai');
  });
});
