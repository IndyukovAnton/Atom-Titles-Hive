import { z } from 'zod';
/**
 * Схема валидации для входа
 */
export const loginSchema = z.object({
    username: z
        .string()
        .min(1, 'Введите имя пользователя')
        .max(50, 'Имя пользователя слишком длинное'),
    password: z
        .string()
        .min(6, 'Пароль должен содержать минимум 6 символов')
        .max(100, 'Пароль слишком длинный'),
});
/**
 * Схема валидации для регистрации
 */
export const registerSchema = z.object({
    username: z
        .string()
        .min(3, 'Имя пользователя должно содержать минимум 3 символа')
        .max(50, 'Имя пользователя слишком длинное')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Только латинские буквы, цифры, _ и -'),
    // Email необязателен: пустая строка допустима, непустая должна быть валидным email.
    // refine вместо union с z.literal(''), чтобы сохранить читаемое сообщение об ошибке.
    email: z
        .string()
        .max(100, 'Email слишком длинный')
        .refine((value) => value === '' || z.string().email().safeParse(value).success, 'Введите корректный email'),
    password: z
        .string()
        .min(6, 'Пароль должен содержать минимум 6 символов')
        .max(100, 'Пароль слишком длинный'),
    confirmPassword: z
        .string()
        .min(1, 'Подтвердите пароль'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
});
