# Руководство по работе с формами

## Обзор

В проекте используется **react-hook-form** с валидацией через **Zod** для создания производительных и типобезопасных форм.

## Преимущества подхода

- ✅ **Минимальные ре-рендеры**: react-hook-form использует uncontrolled компоненты
- ✅ **Централизованная валидация**: Zod схемы обеспечивают типобезопасность и переиспользуемость
- ✅ **Автоматическая обработка ошибок**: Форм-компоненты автоматически отображают ошибки валидации
- ✅ **Улучшенный DX**: TypeScript автокомплит для полей формы
- ✅ **Accessibility**: Все компоненты следуют стандартам a11y

## Структура

```
src/
├── schemas/              # Zod схемы валидации
│   ├── mediaSchema.ts
│   ├── groupSchema.ts
│   ├── authSchema.ts
│   └── profileSchema.ts
└── components/Form/      # Переиспользуемые форм-компоненты
    ├── FormInput.tsx
    ├── FormSelect.tsx
    ├── FormTextarea.tsx
    ├── FormDateInput.tsx
    └── index.ts
```

## Создание новой формы

### Шаг 1: Создайте Zod схему

```typescript
// src/schemas/exampleSchema.ts
import { z } from 'zod';

export const exampleSchema = z.object({
  name: z.string().min(1, 'Имя обязательно'),
  email: z.string().email('Некорректный email'),
  age: z.number().min(18, 'Минимальный возраст: 18'),
});

export type ExampleFormData = z.infer<typeof exampleSchema>;
```

### Шаг 2: Используйте в компоненте

```typescript
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormInput } from '@/components/Form';
import { exampleSchema, type ExampleFormData } from '@/schemas/exampleSchema';

export function ExampleForm() {
  const methods = useForm<ExampleFormData>({
    resolver: zodResolver(exampleSchema),
    defaultValues: {
      name: '',
      email: '',
      age: 18,
    },
  });

  const { handleSubmit, formState: { isSubmitting } } = methods;

  const onSubmit = async (data: ExampleFormData) => {
    // Обработка отправки формы
    console.log(data);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormInput
          name="name"
          label="Имя"
          required
          disabled={isSubmitting}
        />
        
        <FormInput
          name="email"
          label="Email"
          type="email"
          required
          disabled={isSubmitting}
        />
        
        <FormInput
          name="age"
          label="Возраст"
          type="number"
          required
          disabled={isSubmitting}
        />
        
        <button type="submit" disabled={isSubmitting}>
          Отправить
        </button>
      </form>
    </FormProvider>
  );
}
```

## Доступные форм-компоненты

### FormInput

Обёртка над `Input` с автоматической обработкой ошибок.

```typescript
<FormInput
  name="fieldName"
  label="Название поля"
  type="text"
  placeholder="Введите значение"
  required
  disabled={isSubmitting}
  description="Дополнительная подсказка"
/>
```

**Props:**
- `name` (обязательно): Имя поля в форме
- `label`: Текст метки
- `required`: Отображает звёздочку обязательности
- `description`: Текст подсказки под полем
- Все стандартные HTML атрибуты `input`

### FormSelect

Обёртка над `Select` с Controller для react-hook-form.

```typescript
<FormSelect
  name="category"
  label="Категория"
  placeholder="Выберите категорию"
  options={[
    { value: 'option1', label: 'Опция 1' },
    { value: 'option2', label: 'Опция 2' },
  ]}
  required
  disabled={isSubmitting}
/>
```

**Props:**
- `name` (обязательно): Имя поля в форме
- `options` (обязательно): Массив опций `{ value, label }[]`
- `label`: Текст метки
- `placeholder`: Текст плейсхолдера
- `required`: Отображает звёздочку обязательности
- `disabled`: Блокирует выбор

### FormTextarea

Обёртка над `Textarea` для многострочного текста.

```typescript
<FormTextarea
  name="description"
  label="Описание"
  placeholder="Введите описание..."
  rows={4}
  disabled={isSubmitting}
/>
```

### FormDateInput

Обёртка над `Input type="date"` для выбора даты.

```typescript
<FormDateInput
  name="startDate"
  label="Дата начала"
  disabled={isSubmitting}
/>
```

## Валидация с Zod

### Базовые типы

```typescript
// Строка
z.string()
  .min(3, 'Минимум 3 символа')
  .max(100, 'Максимум 100 символов')
  .email('Некорректный email')
  .url('Некорректный URL')
  .regex(/^[a-z]+$/, 'Только строчные буквы')

// Число
z.number()
  .min(1, 'Минимум 1')
  .max(10, 'Максимум 10')
  .int('Должно быть целым числом')

// Enum
z.enum(['option1', 'option2'], {
  required_error: 'Выберите опцию',
})

// Опциональные поля
z.string().optional()
z.string().optional().or(z.literal(''))

// Nullable
z.number().nullable()
```

### Кастомная валидация

```typescript
const schema = z.object({
  password: z.string().min(6),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'], // Путь к полю с ошибкой
});
```

## Best Practices

### 1. Используйте useCallback для обработчиков

```typescript
const handleClose = useCallback(() => {
  if (!isSubmitting) {
    onClose();
  }
}, [isSubmitting, onClose]);
```

### 2. Очищайте форму при открытии модалки

```typescript
useEffect(() => {
  if (isOpen) {
    reset(); // Сброс формы
    setError(null);
  }
}, [isOpen, reset]);
```

### 3. Обрабатывайте клавиатурные шорткаты

```typescript
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen && !isSubmitting) {
      handleClose();
    }
  };

  if (isOpen) {
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }
}, [isOpen, isSubmitting, handleClose]);
```

### 4. Отключайте кнопки во время отправки

```typescript
<Button type="submit" disabled={isSubmitting}>
  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {isSubmitting ? 'Сохранение...' : 'Сохранить'}
</Button>
```

### 5. Используйте автофокус

```typescript
<FormInput
  name="title"
  autoFocus
  // ...
/>
```

## Примеры использования

Смотрите реальные примеры в:
- `src/components/AddMediaModal.tsx` - Сложная форма с множеством полей
- `src/components/CreateGroupModal.tsx` - Простая форма
- `src/pages/LoginPage.tsx` - Форма с кастомным полем пароля
- `src/pages/RegisterPage.tsx` - Форма с валидацией совпадения паролей
- `src/pages/SettingsPage.tsx` - Форма смены пароля

## Производительность

### До оптимизации
- Каждое изменение input вызывало `setState`
- Множественные ре-рендеры всего компонента
- Отсутствие централизованной валидации

### После оптимизации
- Минимальные ре-рендеры (только при изменении конкретного поля)
- Валидация на уровне схемы
- Переиспользуемые компоненты
- Улучшенный UX (автофокус, клавиатурные шорткаты, индикаторы загрузки)

## Troubleshooting

### Ошибка: "Cannot read property 'register' of undefined"

Убедитесь, что компонент обёрнут в `FormProvider`:

```typescript
<FormProvider {...methods}>
  <FormInput name="field" />
</FormProvider>
```

### Поле не валидируется

Проверьте, что имя поля в `FormInput` совпадает с именем в схеме:

```typescript
// Схема
const schema = z.object({
  email: z.string().email(),
});

// Компонент
<FormInput name="email" /> // ✅ Правильно
<FormInput name="mail" />  // ❌ Неправильно
```

### Значение не обновляется

Для `type="number"` убедитесь, что используете `valueAsNumber`:

```typescript
// FormInput автоматически обрабатывает это
<FormInput name="age" type="number" />
```

## Дополнительные ресурсы

- [React Hook Form документация](https://react-hook-form.com/)
- [Zod документация](https://zod.dev/)
- [Radix UI документация](https://www.radix-ui.com/)
