import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FormInput, FormSelect, StarRating } from '@/components/Form';
import { CategoryTilePicker } from './CategoryTilePicker';

interface InfoStepProps {
  isSubmitting: boolean;
  groupOptions: { value: string; label: string }[];
  onOpenCreateGroup: () => void;
}

export function InfoStep({
  isSubmitting,
  groupOptions,
  onOpenCreateGroup,
}: InfoStepProps) {
  return (
    <div className="space-y-5">
      <FormInput
        name="title"
        label="Что добавим?"
        placeholder="Название фильма, книги или игры..."
        disabled={isSubmitting}
        className="h-12 text-lg"
      />

      <CategoryTilePicker
        name="category"
        label="Категория"
        disabled={isSubmitting}
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold text-foreground">Группа</Label>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs"
            onClick={onOpenCreateGroup}
          >
            <Plus className="h-3 w-3 mr-1" />
            Новая
          </Button>
        </div>
        <FormSelect
          name="groupId"
          options={groupOptions}
          placeholder="Без группы"
          disabled={isSubmitting}
        />
      </div>

      <StarRating name="rating" label="Ваша оценка" />
    </div>
  );
}
