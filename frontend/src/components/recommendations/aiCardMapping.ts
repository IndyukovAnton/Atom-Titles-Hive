import type { AICard, ClaudeContentType } from '@/api/recommendations';
import type { MediaFormData } from '@/schemas/mediaSchema';

type MediaCategory = MediaFormData['category'];

// 'other' не имеет аналога в mediaSchema — категорию выберет пользователь.
const TYPE_TO_CATEGORY: Record<ClaudeContentType, MediaCategory | undefined> = {
  movie: 'Movie',
  series: 'Series',
  anime: 'Anime',
  book: 'Book',
  game: 'Game',
  other: undefined,
};

export function aiCardToAddMediaInitial(card: AICard) {
  return {
    title: card.title,
    description: card.whyRecommended,
    image: card.posterUrl,
    rating: 0,
    genres: card.genres,
    category: TYPE_TO_CATEGORY[card.type],
    source: 'ai',
  };
}
