import type { AICard, ClaudeContentType } from '@/api/recommendations';

const TYPE_TO_CATEGORY: Record<ClaudeContentType, string> = {
  movie: 'Фильм',
  series: 'Сериал',
  anime: 'Аниме',
  book: 'Книга',
  game: 'Игра',
  other: 'Другое',
};

export function aiCardToAddMediaInitial(card: AICard) {
  return {
    title: card.title,
    description: card.whyRecommended,
    image: card.posterUrl,
    rating: 0,
    genres: card.genres,
    category: TYPE_TO_CATEGORY[card.type],
  };
}
