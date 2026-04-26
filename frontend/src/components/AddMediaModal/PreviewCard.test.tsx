import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils/test-utils';
import { FormProvider, useForm } from 'react-hook-form';
import { PreviewCard } from './PreviewCard';
import { usePersonalization } from '@/hooks/usePersonalization';

vi.mock('@/hooks/usePersonalization', () => ({
  usePersonalization: vi.fn(),
}));

const mockedUsePersonalization = vi.mocked(usePersonalization);

function Harness({
  values,
}: {
  values: { title?: string; category?: string; rating?: number; image?: string };
}) {
  const methods = useForm({ defaultValues: values });
  return (
    <FormProvider {...methods}>
      <PreviewCard />
    </FormProvider>
  );
}

function mockStyle(style: 'mirror' | 'poster') {
  mockedUsePersonalization.mockReturnValue({
    addEntryPreviewStyle: style,
  } as unknown as ReturnType<typeof usePersonalization>);
}

beforeEach(() => {
  mockedUsePersonalization.mockReset();
});

describe('PreviewCard', () => {
  it('Mirror: renders title, localized category, and rating value', () => {
    mockStyle('mirror');
    render(<Harness values={{ title: 'Breaking Bad', category: 'Series', rating: 9 }} />);
    expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
    expect(screen.getByText(/сериал/i)).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
  });

  it('Mirror: shows empty-title placeholder when title is blank', () => {
    mockStyle('mirror');
    render(<Harness values={{ title: '', category: 'Movie' }} />);
    expect(screen.getByText(/название записи/i)).toBeInTheDocument();
  });

  it('Mirror: uses image when provided', () => {
    mockStyle('mirror');
    render(
      <Harness
        values={{ title: 'Inception', category: 'Movie', image: 'data:image/png;base64,AAA' }}
      />,
    );
    const img = screen.getByRole('img', { name: /inception/i }) as HTMLImageElement;
    expect(img.src).toContain('data:image/png');
  });

  it('Poster: renders the poster variant with gradient header', () => {
    mockStyle('poster');
    render(<Harness values={{ title: 'Witcher 3', category: 'Game', rating: 10 }} />);
    expect(screen.getByText('Witcher 3')).toBeInTheDocument();
    expect(screen.getByTestId('preview-poster')).toBeInTheDocument();
  });

  it('Mirror: hides rating badge when rating is 0 or missing', () => {
    mockStyle('mirror');
    render(<Harness values={{ title: 'Test', rating: 0 }} />);
    expect(screen.queryByTestId('preview-rating')).not.toBeInTheDocument();
  });
});
