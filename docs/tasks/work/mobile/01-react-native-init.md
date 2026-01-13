# Задача MB-01: Инициализация React Native проекта

## Зависимости
- FE-04: Вынос API URL в переменные окружения (для правильной конфигурации API)
- BE-05: Вынос секретов в переменные окружения (для безопасной работы с API)

## Описание проблемы
React Native приложение полностью отсутствует. Необходимо создать mobile версию приложения для iOS и Android.

## Цель задачи
Инициализировать React Native проект с базовой структурой и настройками.

## Чек-лист выполнения

### Этап 1: Инициализация проекта
- [ ] Создать React Native проект:
  ```bash
  npx react-native@latest init TitleTrackerMobile --directory mobile
  ```
- [ ] Выбрать TypeScript template
- [ ] Проверить созданную структуру проекта

### Этап 2: Настройка Navigation
- [ ] Установить React Navigation:
  ```bash
  npm install @react-navigation/native @react-navigation/native-stack
  npm install react-native-screens react-native-safe-area-context
  ```
- [ ] Создать `mobile/src/navigation/` структуру
- [ ] Настроить AuthStack (Login, Register)
- [ ] Настроить MainStack (Home, Profile, Settings)

### Этап 3: Настройка API клиента
- [ ] Установить axios: `npm install axios`
- [ ] Создать `mobile/src/api/client.ts` (аналог frontend)
- [ ] Настроить baseURL через environment variables
- [ ] Реализовать JWT токен persistence (AsyncStorage)

### Этап 4: State Management
- [ ] Установить Zustand: `npm install zustand`
- [ ] Создать `mobile/src/store/authStore.ts`
- [ ] Создать `mobile/src/store/mediaStore.ts`
- [ ] Настроить persist middleware для AsyncStorage

### Этап 5: Environment Configuration
- [ ] Установить react-native-config: `npm install react-native-config`
- [ ] Создать `.env.development` и `.env.production`
- [ ] Настроить API_URL для каждого окружения
- [ ] Обновить `.gitignore`

### Этап 6: UI библиотека
- [ ] Выбрать UI библиотеку (React Native Paper или React Native Elements)
- [ ] Установить выбранную библиотеку
- [ ] Настроить темы (light/dark)
- [ ] Создать базовые компоненты (Button, Input, Card)

### Этап 7: Базовая структура экранов
- [ ] Создать `mobile/src/screens/auth/`
  - LoginScreen.tsx (заглушка)
  - RegisterScreen.tsx (заглушка)
- [ ] Создать `mobile/src/screens/main/`
  - HomeScreen.tsx (заглушка)
  - ProfileScreen.tsx (заглушка)
  - SettingsScreen.tsx (заглушка)

### Этап 8: Документация
- [ ] Создать `mobile/README.md` с инструкциями по setup
- [ ] Документировать как запускать на iOS/Android
- [ ] Добавить troubleshooting секцию

## Критерии приёмки
- ✅ React Native проект создан и запускается
- ✅ Navigation настроена
- ✅ API клиент подключён
- ✅ State management работает
- ✅ Environment variables настроены
- ✅ Документация полная

## Тестирование

### iOS
- [ ] `npx react-native run-ios` запускает приложение
- [ ] Приложение отображается в симуляторе
- [ ] Hot reload работает
- [ ] Нет ошибок при запуске

### Android
- [ ] `npx react-native run-android` запускает приложение
- [ ] Приложение отображается в эмуляторе
- [ ] Hot reload работает
- [ ] Нет ошибок при запуске

### Navigation
- [ ] Переключение между экранами работает
- [ ] AuthStack и MainStack разделены
- [ ] Редиректы работают корректно

### API клиент
- [ ] Базовый запрос к API проходит
- [ ] JWT токен сохраняется
- [ ] Токен добавляется в headers автоматически
- [ ] Logout очищает токен

### State Management
- [ ] Zustand store работает
- [ ] Persist сохраняет данные
- [ ] После перезапуска данные восстанавливаются

### Environment
- [ ] API_URL читается из .env
- [ ] Development и production конфиги работают

## ⚠️ ВАЖНО: Финальная проверка
После выполнения всех чек-боксов:
1. ✅ Все пункты отмечены
2. ✅ Приложение запускается на iOS
3. ✅ Приложение запускается на Android
4. ✅ Навигация работает
5. ✅ API клиент настроен
6. ✅ Документация создана
7. ✅ Нет критичных ошибок

**ТОЛЬКО ПОСЛЕ ЭТОГО** перенести файл в `docs/tasks/done/mobile/01-react-native-init.md`
