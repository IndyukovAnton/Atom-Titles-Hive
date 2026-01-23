import { z } from 'zod';

/**
 * Схема валидации для создания медиа-записи
 */
export const mediaSchema = z.object({
  title: z
    .string()
    .min(1, 'Название обязательно')
    .max(200, 'Название не должно превышать 200 символов'),
  
  rating: z
    .number()
    .min(1, 'Минимальная оценка: 1')
    .max(10, 'Максимальная оценка: 10')
    .int('Оценка должна быть целым числом'),
  
  category: z.enum(['Movie', 'Series', 'Book', 'Game', 'Anime', 'Manga']),
  
  description: z.string().optional(),
  
  image: z.string().optional().or(z.literal('')),
  
  startDate: z.string().optional().nullable().or(z.literal('')),
  
  endDate: z.string().optional().nullable().or(z.literal('')),
  
  groupId: z.union([z.number(), z.string(), z.null()])
    .transform((val) => {
      if (val === 'null' || val === '' || val === null) return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    })
    .optional(),

  tags: z.array(z.string()).optional(),
  
  genres: z.array(z.string()).optional(),
});

export type MediaFormInput = z.input<typeof mediaSchema>;
export type MediaFormData = z.output<typeof mediaSchema>;
