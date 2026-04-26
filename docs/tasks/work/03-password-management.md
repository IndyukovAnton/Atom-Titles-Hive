# Задача BE-03: Реализация API для смены пароля и восстановления

## Приоритет
🔴 **КРИТИЧЕСКИЙ** - Функциональность

## Зависимости
- BE-02: Rate Limiting (для защиты эндпоинтов)
- SEC-01: Удаление секретов из Git (для безопасной работы с email)

## Описание проблемы
Нужно подтвердить и довести до production‑качества контур управления паролями:
- смена пароля для локальных пользователей,
- учёт пользователей, созданных через OAuth (у них может не быть пароля),
- восстановление пароля (если продукту это реально нужно в desktop‑режиме).

Важно: если email‑восстановление для desktop не требуется (или нет SMTP), допускается **сознательно** ограничиться сменой пароля + понятным UX (и задокументировать решение).

## Цель задачи
Реализовать полнофункциональные эндпоинты для смены пароля (для авторизованных пользователей) и восстановления пароля (через email) с полной валидацией и безопасностью.

## Чек-лист выполнения

### Этап 1: Установка зависимостей для email
- [ ] Установить пакет для отправки email:
  ```bash
  cd f:\projects\Portfolio\Web\Atom-Titles-Hive\backend
  npm install nodemailer
  npm install -D @types/nodemailer
  ```

### Этап 2: Создание DTO для смены пароля
- [ ] Создать файл `f:\projects\Portfolio\Web\Atom-Titles-Hive\backend\src\dto\change-password.dto.ts`:
  ```typescript
  import { IsString, MinLength, IsNotEmpty } from 'class-validator';

  export class ChangePasswordDto {
    @IsString()
    @IsNotEmpty()
    currentPassword: string;

    @IsString()
    @MinLength(8, { message: 'New password must be at least 8 characters long' })
    @IsNotEmpty()
    newPassword: string;
  }
  ```

### Этап 3: Создание DTO для восстановления пароля
- [ ] Создать файл `f:\projects\Portfolio\Web\Atom-Titles-Hive\backend\src\dto\forgot-password.dto.ts`:
  ```typescript
  import { IsEmail, IsNotEmpty } from 'class-validator';

  export class ForgotPasswordDto {
    @IsEmail({}, { message: 'Invalid email format' })
    @IsNotEmpty()
    email: string;
  }
  ```

- [ ] Создать файл `f:\projects\Portfolio\Web\Atom-Titles-Hive\backend\src\dto\reset-password.dto.ts`:
  ```typescript
  import { IsString, MinLength, IsNotEmpty } from 'class-validator';

  export class ResetPasswordDto {
    @IsString()
    @IsNotEmpty()
    token: string;

    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @IsNotEmpty()
    newPassword: string;
  }
  ```

### Этап 4: Создание entity для reset tokens
- [ ] Создать файл `f:\projects\Portfolio\Web\Atom-Titles-Hive\backend\src\entities\password-reset-token.entity.ts`:
  ```typescript
  import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
  } from 'typeorm';
  import { User } from './user.entity';

  @Entity()
  export class PasswordResetToken {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    token: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    user: User;

    @Column()
    userId: number;

    @Column()
    expiresAt: Date;

    @Column({ default: false })
    used: boolean;

    @CreateDateColumn()
    createdAt: Date;
  }
  ```

### Этап 5: Добавление entity в TypeORM
- [ ] Открыть `f:\projects\Portfolio\Web\Atom-Titles-Hive\backend\src\app.module.ts`
- [ ] Импортировать entity:
  ```typescript
  import { PasswordResetToken } from './entities/password-reset-token.entity';
  ```
- [ ] Добавить в entities массив:
  ```typescript
  entities: [User, MediaEntry, MediaFile, Group, PasswordResetToken],
  ```

### Этап 6: Создание Email Service
- [ ] Создать файл `f:\projects\Portfolio\Web\Atom-Titles-Hive\backend\src\utils\email.service.ts`:
  ```typescript
  import { Injectable } from '@nestjs/common';
  import { ConfigService } from '@nestjs/config';
  import * as nodemailer from 'nodemailer';
  import { LoggerService } from './logger.service';

  @Injectable()
  export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor(
      private configService: ConfigService,
      private logger: LoggerService,
    ) {
      this.initializeTransporter();
    }

    private initializeTransporter() {
      const emailEnabled = this.configService.get<string>('EMAIL_ENABLED') === 'true';
      
      if (!emailEnabled) {
        this.logger.warn('Email service disabled. Set EMAIL_ENABLED=true to enable.');
        return;
      }

      this.transporter = nodemailer.createTransporter({
        host: this.configService.get<string>('EMAIL_HOST'),
        port: this.configService.get<number>('EMAIL_PORT'),
        secure: this.configService.get<string>('EMAIL_SECURE') === 'true',
        auth: {
          user: this.configService.get<string>('EMAIL_USER'),
          pass: this.configService.get<string>('EMAIL_PASSWORD'),
        },
      });
    }

    async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
      if (!this.transporter) {
        await this.logger.warn(`Email not sent (service disabled): Password reset for ${email}`);
        console.log(`[DEV] Password reset token: ${resetToken}`);
        return;
      }

      const resetUrl = `${this.configService.get<string>('FRONTEND_URL')}/reset-password?token=${resetToken}`;

      try {
        await this.transporter.sendMail({
          from: this.configService.get<string>('EMAIL_FROM'),
          to: email,
          subject: 'Password Reset Request',
          html: `
            <h1>Password Reset</h1>
            <p>You requested a password reset. Click the link below to reset your password:</p>
            <a href="${resetUrl}">Reset Password</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
          `,
        });

        await this.logger.log(`Password reset email sent to ${email}`);
      } catch (error) {
        await this.logger.error(`Failed to send password reset email to ${email}`, error.stack);
        throw error;
      }
    }
  }
  ```

### Этап 7: Регистрация EmailService
- [ ] Открыть `f:\projects\Portfolio\Web\Atom-Titles-Hive\backend\src\app.module.ts`
- [ ] Добавить EmailService в providers:
  ```typescript
  providers: [
    AppService,
    LoggerService,
    EmailService, // Новый сервис
  ],
  exports: [LoggerService, EmailService],
  ```

### Этап 8: Обновление AuthService
- [ ] Открыть `f:\projects\Portfolio\Web\Atom-Titles-Hive\backend\src\modules\auth\auth.service.ts`
- [ ] Добавить методы:
  ```typescript
  import { PasswordResetToken } from '../../entities/password-reset-token.entity';
  import { EmailService } from '../../utils/email.service';
  import { ChangePasswordDto } from '../../dto/change-password.dto';
  import { ForgotPasswordDto } from '../../dto/forgot-password.dto';
  import { ResetPasswordDto } from '../../dto/reset-password.dto';
  import * as crypto from 'crypto';

  @Injectable()
  export class AuthService {
    constructor(
      @InjectRepository(User)
      private userRepository: Repository<User>,
      @InjectRepository(PasswordResetToken)
      private resetTokenRepository: Repository<PasswordResetToken>,
      private jwtService: JwtService,
      private logger: LoggerService,
      private emailService: EmailService,
    ) {}

    // ... existing methods

    async changePassword(userId: number, changePasswordDto: ChangePasswordDto): Promise<void> {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      
      if (!user || !user.password) {
        throw new UnauthorizedException('User not found or using OAuth');
      }

      // Проверка текущего пароля
      const isPasswordValid = await bcrypt.compare(
        changePasswordDto.currentPassword,
        user.password,
      );

      if (!isPasswordValid) {
        await this.logger.warn(`Failed password change attempt for user ${user.username}`);
        throw new UnauthorizedException('Current password is incorrect');
      }

      // Хеширование нового пароля
      const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
      user.password = hashedPassword;
      await this.userRepository.save(user);

      await this.logger.log(`Password changed for user ${user.username}`);
    }

    async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
      const user = await this.userRepository.findOne({
        where: { email: forgotPasswordDto.email },
      });

      // Не раскрываем существование email
      if (!user) {
        await this.logger.warn(`Password reset requested for non-existent email: ${forgotPasswordDto.email}`);
        return { message: 'If email exists, reset link has been sent' };
      }

      // Генерация токена
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = await bcrypt.hash(resetToken, 10);

      // Сохранение токена
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 час

      const passwordResetToken = this.resetTokenRepository.create({
        token: hashedToken,
        userId: user.id,
        expiresAt,
      });

      await this.resetTokenRepository.save(passwordResetToken);

      // Отправка email
      await this.emailService.sendPasswordResetEmail(user.email, resetToken);

      await this.logger.log(`Password reset token generated for user ${user.username}`);
      return { message: 'If email exists, reset link has been sent' };
    }

    async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
      // Поиск всех неиспользованных токенов
      const tokens = await this.resetTokenRepository.find({
        where: { used: false },
        relations: ['user'],
      });

      let validToken: PasswordResetToken | null = null;

      // Проверка токена
      for (const token of tokens) {
        const isValid = await bcrypt.compare(resetPasswordDto.token, token.token);
        if (isValid && token.expiresAt > new Date()) {
          validToken = token;
          break;
        }
      }

      if (!validToken) {
        await this.logger.warn('Invalid or expired password reset token used');
        throw new UnauthorizedException('Invalid or expired reset token');
      }

      // Обновление пароля
      const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);
      validToken.user.password = hashedPassword;
      await this.userRepository.save(validToken.user);

      // Пометка токена как использованного
      validToken.used = true;
      await this.resetTokenRepository.save(validToken);

      await this.logger.log(`Password reset successful for user ${validToken.user.username}`);
      return { message: 'Password reset successful' };
    }
  }
  ```

### Этап 9: Обновление AuthModule
- [ ] Открыть `f:\projects\Portfolio\Web\Atom-Titles-Hive\backend\src\modules\auth\auth.module.ts`
- [ ] Добавить PasswordResetToken в imports:
  ```typescript
  import { PasswordResetToken } from '../../entities/password-reset-token.entity';

  @Module({
    imports: [
      TypeOrmModule.forFeature([User, PasswordResetToken]),
      // ... rest
    ],
  })
  ```

### Этап 10: Обновление AuthController
- [ ] Открыть `f:\projects\Portfolio\Web\Atom-Titles-Hive\backend\src\modules\auth\auth.controller.ts`
- [ ] Добавить эндпоинты:
  ```typescript
  import { ChangePasswordDto } from '../../dto/change-password.dto';
  import { ForgotPasswordDto } from '../../dto/forgot-password.dto';
  import { ResetPasswordDto } from '../../dto/reset-password.dto';
  import { Throttle } from '@nestjs/throttler';

  @Controller('auth')
  export class AuthController {
    // ... existing methods

    @Patch('change-password')
    @Throttle({ default: { limit: 3, ttl: 300000 } }) // 3 попытки в 5 минут
    @UseGuards(JwtAuthGuard)
    async changePassword(
      @Req() req,
      @Body() changePasswordDto: ChangePasswordDto,
    ): Promise<{ message: string }> {
      await this.authService.changePassword(req.user.id, changePasswordDto);
      return { message: 'Password changed successfully' };
    }

    @Post('forgot-password')
    @Throttle({ default: { limit: 3, ttl: 600000 } }) // 3 попытки в 10 минут
    async forgotPassword(
      @Body() forgotPasswordDto: ForgotPasswordDto,
    ): Promise<{ message: string }> {
      return this.authService.forgotPassword(forgotPasswordDto);
    }

    @Post('reset-password')
    @Throttle({ default: { limit: 5, ttl: 600000 } }) // 5 попыток в 10 минут
    async resetPassword(
      @Body() resetPasswordDto: ResetPasswordDto,
    ): Promise<{ message: string }> {
      return this.authService.resetPassword(resetPasswordDto);
    }
  }
  ```

### Этап 11: Настройка переменных окружения
- [ ] Открыть `f:\projects\Portfolio\Web\Atom-Titles-Hive\.env.example`
- [ ] Добавить переменные:
  ```env
  # Email Configuration (optional, for password reset)
  EMAIL_ENABLED=false  # Set to true to enable email sending
  EMAIL_HOST=smtp.gmail.com
  EMAIL_PORT=587
  EMAIL_SECURE=false
  EMAIL_USER=your_email@gmail.com
  EMAIL_PASSWORD=your_app_password
  EMAIL_FROM=noreply@atom-titles-hive.com

  # Frontend URL (for reset password links)
  FRONTEND_URL=http://localhost:5005
  ```

### Этап 12: Создание миграции для PasswordResetToken
- [ ] Сгенерировать миграцию:
  ```bash
  cd f:\projects\Portfolio\Web\Atom-Titles-Hive\backend
  npm run migration:generate src/migrations/AddPasswordResetToken
  ```
- [ ] Применить миграцию:
  ```bash
  npm run migration:run
  ```

### Этап 13: Обновление frontend - SettingsPage
- [ ] Открыть `f:\projects\Portfolio\Web\Atom-Titles-Hive\frontend\src\pages\SettingsPage.tsx`
- [ ] Заменить TODO на реальный API вызов:
  ```typescript
  const onSubmitPassword = async (data: PasswordFormData) => {
    try {
      await api.patch('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      
      toast.success('Password changed successfully');
      passwordForm.reset();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to change password';
      toast.error(message);
    }
  };
  ```

### Этап 14: Обновление frontend - ForgotPasswordPage
- [ ] Открыть `f:\projects\Portfolio\Web\Atom-Titles-Hive\frontend\src\pages\ForgotPasswordPage.tsx`
- [ ] Заменить TODO на реальный API вызов:
  ```typescript
  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      const response = await api.post('/auth/forgot-password', {
        email: data.email,
      });
      
      toast.success(response.data.message || 'Reset link sent to your email');
      navigate('/login');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to send reset email';
      toast.error(message);
    }
  };
  ```

### Этап 15: Создание ResetPasswordPage (если не существует)
- [ ] Создать файл `f:\projects\Portfolio\Web\Atom-Titles-Hive\frontend\src\pages\ResetPasswordPage.tsx`:
  ```typescript
  import { useState } from 'react';
  import { useNavigate, useSearchParams } from 'react-router-dom';
  import { useForm } from 'react-hook-form';
  import { zodResolver } from '@hookform/resolvers/zod';
  import { z } from 'zod';
  import api from '../api/axios';
  import { toast } from 'sonner';

  const resetPasswordSchema = z.object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

  type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

  export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const {
      register,
      handleSubmit,
      formState: { errors, isSubmitting },
    } = useForm<ResetPasswordFormData>({
      resolver: zodResolver(resetPasswordSchema),
    });

    const onSubmit = async (data: ResetPasswordFormData) => {
      if (!token) {
        toast.error('Invalid reset token');
        return;
      }

      try {
        await api.post('/auth/reset-password', {
          token,
          newPassword: data.newPassword,
        });

        toast.success('Password reset successful');
        navigate('/login');
      } catch (error: any) {
        const message = error.response?.data?.message || 'Failed to reset password';
        toast.error(message);
      }
    };

    if (!token) {
      return <div>Invalid reset link</div>;
    }

    return (
      <div className="reset-password-page">
        <h1>Reset Password</h1>
        <form onSubmit={handleSubmit(onSubmit)}>
          <input
            type="password"
            placeholder="New Password"
            {...register('newPassword')}
          />
          {errors.newPassword && <span>{errors.newPassword.message}</span>}

          <input
            type="password"
            placeholder="Confirm Password"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && <span>{errors.confirmPassword.message}</span>}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    );
  }
  ```

### Этап 16: Добавление роута для ResetPasswordPage
- [ ] Открыть `f:\projects\Portfolio\Web\Atom-Titles-Hive\frontend\src\App.tsx`
- [ ] Добавить роут:
  ```typescript
  import ResetPasswordPage from './pages/ResetPasswordPage';

  <Route path="/reset-password" element={<ResetPasswordPage />} />
  ```

### Этап 17: Тестирование
- [ ] Создать тест `f:\projects\Portfolio\Web\Atom-Titles-Hive\backend\src\modules\auth\auth.service.spec.ts`:
  ```typescript
  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const userId = 1;
      const mockUser = await createUserWithHashedPassword('oldpassword', { id: userId });
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      await service.changePassword(userId, {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
      });

      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw if current password is incorrect', async () => {
      const userId = 1;
      const mockUser = await createUserWithHashedPassword('oldpassword', { id: userId });
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        service.changePassword(userId, {
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
  ```

## Критерии приёмки
- ✅ API `/auth/change-password` работает
- ✅ API `/auth/forgot-password` работает
- ✅ API `/auth/reset-password` работает
- ✅ Email отправляется (или логируется в dev режиме)
- ✅ Токены истекают через 1 час
- ✅ Использованные токены нельзя переиспользовать
- ✅ Frontend интегрирован с API
- ✅ Тесты написаны и проходят
- ✅ Rate limiting настроен

## Тестирование

### Смена пароля
- [ ] Авторизоваться в приложении
- [ ] Перейти в Settings
- [ ] Ввести текущий пароль и новый пароль
- [ ] Нажать "Change Password"
- [ ] Проверить что пароль изменился
- [ ] Выйти и войти с новым паролем

### Восстановление пароля
- [ ] Перейти на страницу "Forgot Password"
- [ ] Ввести email
- [ ] Проверить логи (если EMAIL_ENABLED=false) или email (если включен)
- [ ] Скопировать токен из логов или перейти по ссылке из email
- [ ] Ввести новый пароль
- [ ] Проверить что пароль сброшен
- [ ] Войти с новым паролем

### Безопасность
- [ ] Попробовать использовать токен дважды - должна быть ошибка
- [ ] Попробовать использовать истекший токен - должна быть ошибка
- [ ] Попробовать сменить пароль с неправильным текущим - должна быть ошибка
- [ ] Проверить rate limiting на всех эндпоинтах

## ⚠️ ВАЖНО: Финальная проверка
После выполнения всех чек-боксов:
1. ✅ Все API эндпоинты работают
2. ✅ Frontend интегрирован
3. ✅ Email сервис настроен (или dev режим)
4. ✅ Миграция применена
5. ✅ Тесты проходят
6. ✅ Безопасность проверена
7. ✅ Документация обновлена

**ТОЛЬКО ПОСЛЕ ЭТОГО** перенести файл в `docs/tasks/done/backend/03-password-management.md`
