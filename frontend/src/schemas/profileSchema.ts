import { z } from 'zod';

/**
 * Схема валидации для обновления профиля
 */
export const profileSchema = z.object({
  username: z
    .string()
    .min(3, 'Имя пользователя должно содержать минимум 3 символа')
    .max(50, 'Имя пользователя слишком длинное')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Только латинские буквы, цифры, _ и -')
    .optional(),
  
  email: z
    .string()
    .email('Введите корректный email')
    .optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

/**
 * Схема валидации для изменения пароля
 */
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Введите текущий пароль'),
  
  newPassword: z
    .string()
    .min(6, 'Новый пароль должен содержать минимум 6 символов')
    .max(100, 'Пароль слишком длинный'),
  
  confirmPassword: z
    .string()
    .min(1, 'Подтвердите новый пароль'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
});

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
