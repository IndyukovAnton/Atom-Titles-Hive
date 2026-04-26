# Задача BE-03: Управление паролями (desktop-решение)

## Итог
Реализована **только смена пароля для авторизованных пользователей**. Восстановление пароля через email — **сознательно отложено** для desktop-режима.

## Что сделано (BE-03 stage 1)
- `POST /auth/change-password` — protected JWT, проверяет текущий пароль через bcrypt, отказывает OAuth-only аккаунтам.
- DTO: `backend/src/dto/change-password.dto.ts` (currentPassword + newPassword min 6).
- `AuthService.changePassword(userId, dto)` — bcrypt.compare → bcrypt.hash → save, неудачи логируются через `LoggerService`.
- Frontend: `SecurityTab.tsx` интегрирован с `authApi.changePassword()`, 401 показывается как «Неверный текущий пароль».
- Удалены неиспользуемые `ForgotPasswordPage`, маршрут `/forgot-password`, ссылка «Забыли пароль?» из `LoginPage`, `forgotPasswordSchema`.

## Что НЕ сделано и почему
- `forgot-password` / `reset-password` эндпоинты, `PasswordResetToken` entity, `EmailService` (nodemailer) — **отложено**.
- Причина: продукт — desktop-приложение на Tauri. SMTP-сервер недоступен пользователю «из коробки», а email-flow без надёжной доставки скорее вредит UX, чем помогает (письма теряются, токены истекают, пользователь застревает).
- Если у пользователя забыт пароль локального аккаунта — он может перейти на Google OAuth (один клик) или пересоздать аккаунт; данные привязаны к userId, а не к паролю.

## Когда вернуться к reset-flow
Реализовать стадии 2-3 из исходной спецификации (`docs/tasks/work/`-history) если:
1. Появится web-deployment этого приложения (cloud SaaS), где Google OAuth не будет основным путём.
2. Поддержка SMTP/email-сервиса (Resend, SendGrid) станет частью infra.
3. Будет реальный кейс «много пользователей без OAuth, забыли пароль» в логах.

До этого момента — change-password покрывает 100% актуальных нужд.

## Связанные коммиты
- `ddfb5e3 feat(auth): implement password change endpoint (BE-03 stage 1)`
- (этот коммит) — закрытие задачи + удаление ForgotPasswordPage stub.
