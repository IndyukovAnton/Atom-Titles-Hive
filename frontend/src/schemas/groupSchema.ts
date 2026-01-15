import { z } from 'zod';

/**
 * Схема валидации для создания/редактирования группы
 */
export const groupSchema = z.object({
  name: z
    .string()
    .min(1, 'Название группы обязательно')
    .max(100, 'Название не должно превышать 100 символов')
    .trim(),
  parentId: z.number().optional(),
});

export type GroupFormData = z.infer<typeof groupSchema>;
