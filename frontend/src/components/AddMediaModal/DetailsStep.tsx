import {
  DatePicker,
  FormTextarea,
  TagInput,
} from '@/components/Form';

const PREDEFINED_TAGS = [
  'Избранное',
  'В планах',
  'Читаю',
  'Завершено',
  'Брошено',
  'Отложено',
  'Пересматриваю',
];

const PREDEFINED_GENRES = [
  'Экшен',
  'Приключения',
  'Комедия',
  'Драма',
  'Фэнтези',
  'Ужасы',
  'Мистика',
  'Романтика',
  'Фантастика',
  'Повседневность',
  'Спорт',
  'Триллер',
  'Военный',
  'Вестерн',
  'Детектив',
  'Исторический',
  'Музыка',
  'Психология',
  'Семейный',
  'Биография',
  'Документальный',
];

interface DetailsStepProps {
  isSubmitting: boolean;
  dateLabels: { start: string; end: string; showEnd: boolean };
}

export function DetailsStep({ isSubmitting, dateLabels }: DetailsStepProps) {
  return (
    <div className="grid gap-6 py-4">
      <div className="space-y-4">
        <TagInput
          name="genres"
          label="Жанры"
          placeholder="Добавьте жанры..."
          suggestions={PREDEFINED_GENRES}
          disabled={isSubmitting}
        />

        <TagInput
          name="tags"
          label="Теги и списки"
          placeholder="Добавьте теги..."
          suggestions={PREDEFINED_TAGS}
          disabled={isSubmitting}
        />

        <FormTextarea
          name="description"
          label="Заметки и впечатления"
          placeholder="О чем этот тайтл? Что вам понравилось или не понравилось..."
          disabled={isSubmitting}
          className="min-h-[100px] resize-none"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-muted/20">
          <DatePicker name="startDate" label={dateLabels.start} />
          {dateLabels.showEnd && (
            <DatePicker name="endDate" label={dateLabels.end} />
          )}
        </div>
      </div>
    </div>
  );
}
