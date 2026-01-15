# Система поиска и фильтрации

## Обзор

Реализована продвинутая система поиска и фильтрации медиа записей с поддержкой автодополнения и комбинированных фильтров.

## Компоненты

### Хуки

#### `useDebounce(value, delay)`
Оптимизирует частые обновления, добавляя задержку перед применением нового значения.

```typescript
const debouncedSearchQuery = useDebounce(searchQuery, 300);
```

#### `useSearch()`
Управляет поисковыми запросами и автодополнением.

**Возвращаемые значения:**
- `searchQuery` - текущий поисковый запрос
- `setSearchQuery` - функция обновления запроса
- `suggestions` - массив подсказок (до 5 элементов)
- `isSearching` - флаг состояния загрузки
- `clearSearch` - функция очистки поиска

#### `useFilters()`
Управляет фильтрами медиа записей.

**Возвращаемые значения:**
- `filters` - объект активных фильтров
- `updateFilter` - обновить фильтр
- `removeFilter` - удалить фильтр
- `clearFilters` - очистить все фильтры
- `hasActiveFilters` - наличие активных фильтров
- `isFilterPanelOpen` - состояние панели фильтров
- `toggleFilterPanel` - переключить панель
- `setIsFilterPanelOpen` - установить состояние панели

#### `useMediaData` (обновлён)
Загружает медиа с учётом поиска и фильтров.

**Новый API:**
```typescript
const { mediaList, isLoading, error, loadMedia } = useMediaData({
  selectedGroupId,
  searchQuery,
  filters,
});
```

### UI Компоненты

#### `SearchBar`
Строка поиска с автодополнением.

**Props:**
- `value` - значение поиска
- `onChange` - обработчик изменения
- `onClear` - обработчик очистки
- `suggestions` - массив подсказок
- `isSearching` - флаг загрузки
- `onSelectSuggestion` - обработчик выбора подсказки

**Возможности:**
- Клавиатурная навигация (↑/↓ для выбора, Enter для подтверждения, Escape для закрытия)
- Превью результатов с изображением, описанием и рейтингом
- Индикатор загрузки
- Кнопка очистки

#### `FilterPanel`
Выдвижная панель фильтрации.

**Props:**
- `filters` - объект фильтров
- `onUpdateFilter` - обновление фильтра
- `onRemoveFilter` - удаление фильтра
- `onClearFilters` - очистка всех фильтров
- `hasActiveFilters` - наличие активных фильтров
- `isOpen` - состояние панели
- `onOpenChange` - обработчик изменения состояния

**Доступные фильтры:**
- Категория (выбор из списка)
- Рейтинг (минимум/максимум)
- Период дат (начало/конец)
- Жанры (список через запятую)
- Теги (список через запятую)

## Использование

### Базовый пример

```typescript
import { useSearch, useFilters, useMediaData } from '@/hooks';
import { SearchBar, FilterPanel } from '@/components/HomePage';

function MediaPage() {
  const { searchQuery, setSearchQuery, suggestions, isSearching, clearSearch } = useSearch();
  const { filters, updateFilter, clearFilters, hasActiveFilters, isFilterPanelOpen, setIsFilterPanelOpen } = useFilters();
  
  const { mediaList, isLoading } = useMediaData({
    selectedGroupId: 'all',
    searchQuery,
    filters,
  });

  return (
    <div>
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        onClear={clearSearch}
        suggestions={suggestions}
        isSearching={isSearching}
      />
      
      <FilterPanel
        filters={filters}
        onUpdateFilter={updateFilter}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
        isOpen={isFilterPanelOpen}
        onOpenChange={setIsFilterPanelOpen}
      />
      
      {/* ... отображение медиа */}
    </div>
  );
}
```

## Производительность

### Оптимизации
1. **Debounce** - задержка 300мс перед отправкой запроса
2. **Мемоизация** - использование `useMemo` и `useCallback`
3. **Клиентская фильтрация** - фильтры применяются на клиенте после загрузки
4. **Ограничение подсказок** - максимум 5 результатов в автодополнении

### Рекомендации
- Используйте `searchQuery` для серверного поиска
- Используйте `filters` для точной фильтрации на клиенте
- Комбинируйте оба подхода для оптимальной производительности

## Тестирование

Созданы тесты для всех новых хуков:
- `useDebounce.test.ts` - проверка работы debounce
- `useSearch.test.ts` - проверка поиска и автодополнения
- `useFilters.test.ts` - проверка управления фильтрами

Запуск тестов:
```bash
npm test
```

## Адаптивность

Все компоненты адаптированы для различных размеров экрана:
- Мобильные устройства (< 640px)
- Планшеты (640px - 1024px)
- Десктоп (> 1024px)

## Доступность

- Поддержка клавиатурной навигации
- ARIA-атрибуты для скрин-ридеров
- Фокус-индикаторы для всех интерактивных элементов
