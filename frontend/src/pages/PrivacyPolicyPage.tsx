import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Database,
  HardDrive,
  KeyRound,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function PrivacyPolicyPage() {
  return (
    <div className="container max-w-3xl py-10 px-4 mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center space-x-4 mb-2">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/settings">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          Политика конфиденциальности
        </h1>
      </div>

      <p className="text-muted-foreground text-sm">
        Seen — это desktop-приложение для личной медиатеки. Этот
        документ кратко описывает, какие данные приложение хранит, где именно
        и почему они никуда не уходят с вашего устройства.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-primary" />
            Где хранятся данные
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            Все ваши записи, группы, теги, рейтинги, оценки и обложки хранятся
            в локальной базе данных <span className="font-mono text-xs">SQLite</span>{' '}
            на этом устройстве. Файл базы лежит рядом с приложением и никогда
            не отправляется на удалённые серверы.
          </p>
          <p>
            Уровни, опыт, достижения и звания не хранятся отдельно — они
            вычисляются «на лету» из вашей коллекции при заходе на страницу
            профиля. Никаких онлайн-таблиц лидеров и сравнений с другими
            пользователями нет.
          </p>
          <p>
            Аватар, кастомный шрифт и пользовательские настройки темы лежат
            частично в локальной БД (профиль), частично в{' '}
            <span className="font-mono text-xs">localStorage</span> браузерного
            движка приложения — это тоже ваш диск, не сервер.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Что не передаётся третьим лицам
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            Никакая информация о вашей коллекции, статистике, достижениях,
            активности или настройках не отправляется на серверы автора, в
            аналитику, рекламные сети или любые сторонние сервисы. У приложения
            нет встроенной телеметрии.
          </p>
          <p>
            Учётные данные (имя пользователя, email, дата рождения, хеш пароля)
            хранятся в той же локальной БД и используются только для входа.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Поиск обложек и внешние сервисы
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            При поиске обложки приложение делает запрос к публичному поисковику
            картинок (Bing Images) с введённым вами текстом. Этот запрос идёт
            напрямую к сервису, минуя серверы автора, и содержит только строку
            запроса — не вашу коллекцию.
          </p>
          <p>
            Если вы не хотите выходить в сеть совсем — пользуйтесь вкладкой
            «Загрузить» и подтягивайте обложки локальными файлами.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            API-ключи (AI, TMDB)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            Если вы вводите свой ключ для AI-сервисов или TMDB, он сохраняется
            локально (в зашифрованном виде в браузерном хранилище приложения)
            и используется для прямых вызовов соответствующего провайдера со
            своего устройства.
          </p>
          <p>
            Ключ никогда не уходит на серверы автора. Удалить ключ можно в
            Настройках в любой момент — поле очистится и значение будет стёрто.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Полный контроль и удаление
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            Вы можете удалить любую запись или весь аккаунт — данные тут же
            пропадают из локальной БД, восстанавливать их откуда-то ещё
            попросту неоткуда.
          </p>
          <p>
            Чтобы полностью «забыть» приложение, удалите его обычным способом
            операционной системы — вместе с ним уйдёт и файл базы.
          </p>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center pt-2">
        Обновляется с релизами. Текущая редакция — апрель 2026 г.
      </p>
    </div>
  );
}
