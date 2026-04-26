import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { CategoryTilePicker } from './CategoryTilePicker';

function Harness({ onChange }: { onChange?: (v: string) => void }) {
  const methods = useForm({ defaultValues: { category: 'Movie' } });
  const value = methods.watch('category');
  if (onChange) onChange(value);
  return (
    <FormProvider {...methods}>
      <CategoryTilePicker name="category" label="Категория" />
    </FormProvider>
  );
}

describe('CategoryTilePicker', () => {
  it('renders all 6 category tiles with labels', () => {
    render(<Harness />);
    expect(screen.getByRole('button', { name: /фильм/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /сериал/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /книга/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /игра/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /аниме/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /манга/i })).toBeInTheDocument();
  });

  it('marks the matching tile as selected', () => {
    render(<Harness />);
    expect(screen.getByRole('button', { name: /фильм/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: /сериал/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('updates form value when a tile is clicked', async () => {
    const user = userEvent.setup();
    const seen: string[] = [];
    render(<Harness onChange={(v) => seen.push(v)} />);
    await user.click(screen.getByRole('button', { name: /аниме/i }));
    expect(seen[seen.length - 1]).toBe('Anime');
  });
});
