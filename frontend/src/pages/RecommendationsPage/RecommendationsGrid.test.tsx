import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/utils/test-utils';
import { RecommendationsGrid } from './RecommendationsGrid';
import type { RecommendationItem } from '@/api/recommendations';

const createItem = (
  overrides: Partial<RecommendationItem> = {},
): RecommendationItem => ({
  title: 'Название',
  genres: ['Драма'],
  ...overrides,
});

describe('RecommendationsGrid', () => {
  it('shows "В библиотеку" button for items not in library when onAdd is provided', () => {
    render(
      <RecommendationsGrid
        items={[createItem({ inLibrary: false })]}
        onAdd={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('button', { name: /в библиотеку/i }),
    ).toBeInTheDocument();
  });

  it('hides "В библиотеку" button for items already in library', () => {
    render(
      <RecommendationsGrid
        items={[createItem({ title: 'Уже в библиотеке', inLibrary: true })]}
        onAdd={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole('button', { name: /в библиотеку/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Уже в библиотеке')).toBeInTheDocument();
  });

  it('hides "В библиотеку" button entirely when onAdd is not provided', () => {
    render(<RecommendationsGrid items={[createItem()]} />);

    expect(
      screen.queryByRole('button', { name: /в библиотеку/i }),
    ).not.toBeInTheDocument();
  });

  it('renders genres passed as array', () => {
    render(<RecommendationsGrid items={[createItem()]} />);

    expect(screen.getByText('Драма')).toBeInTheDocument();
  });

  it('does not crash when genres arrive as a JSON string (legacy contract)', () => {
    const legacyItem = {
      ...createItem(),
      genres: '["Драма","Комедия"]',
    } as unknown as RecommendationItem;

    render(<RecommendationsGrid items={[legacyItem]} />);

    expect(screen.getByText('Драма')).toBeInTheDocument();
    expect(screen.getByText('Комедия')).toBeInTheDocument();
  });
});
