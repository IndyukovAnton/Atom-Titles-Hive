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
        <Label className="text-sm font-semibold text-foreground">Группа</Label>
        <div className="flex gap-2">
          <div className="flex-1 min-w-0">
            <FormSelect
              name="groupId"
              options={groupOptions}
              placeholder="Без группы"
              disabled={isSubmitting}
              className="w-full"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onOpenCreateGroup}
            disabled={isSubmitting}
            className="shrink-0 cursor-pointer border-dashed hover:border-primary hover:bg-primary/5 hover:text-primary"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Новая
          </Button>
        </div>
      </div>

      <StarRating name="rating" label="Ваша оценка" className="w-full" />
    </div>
  );
}
