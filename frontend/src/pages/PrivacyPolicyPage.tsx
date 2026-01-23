import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
  return (
    <div className="container max-w-4xl py-10 px-4 mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/settings">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Политика конфиденциальности</h1>
      </div>

      <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    Общие положения
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                    Мы в Atom Titles-Hive серьезно относимся к вашей конфиденциальности. Настоящая Политика описывает, как мы собираем, используем и защищаем вашу информацию.
                </p>
                <p>
                    Используя наш сервис, вы соглашаетесь с условиями данной Политики. Мы гарантируем, что ваши персональные данные не будут переданы третьим лицам без вашего явного согласия, за исключением случаев, предусмотренных законодательством.
                </p>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Сбор и использование данных</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <h3 className="font-semibold text-foreground">1. Личная информация</h3>
                <p>
                    Мы собираем минимально необходимый набор данных: имя пользователя, email (для восстановления доступа) и дату рождения (для рекомендаций). Пароли хранятся в зашифрованном виде.
                </p>
                
                <h3 className="font-semibold text-foreground">2. API Ключи</h3>
                <p>
                    API ключи, которые вы сохраняете в настройках для доступа к внешним сервисам (например, AI), хранятся исключительно на вашем устройстве или передаются через защищенные каналы напрямую провайдеру услуг, минуя наши серверы в открытом виде.
                </p>

                <h3 className="font-semibold text-foreground">3. Использование AI</h3>
                <p>
                    При использовании функций рекомендаций, некоторые обезличенные данные о ваших предпочтениях могут отправляться моделям искусственного интеллекта. Вы можете отключить это в настройках приватности.
                </p>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Защита данных</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground leading-relaxed">
                <p>
                    Мы применяем современные стандарты шифрования и безопасности для защиты ваших данных от несанкционированного доступа. Регулярные аудиты безопасности позволяют нам поддерживать высокий уровень защиты.
                </p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
