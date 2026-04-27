import { useState } from 'react';
import {
  ArrowLeft,
  Download,
  GraduationCap,
  Loader2,
  Palette,
  Shield,
  ShieldCheck,
  Sparkles,
  Sparkle,
  User,
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccountSettings } from '@/components/personalization/AccountSettings';
import { AppearanceTab } from './AppearanceTab';
import { IntegrationsTab } from './IntegrationsTab';
import { SecurityTab } from './SecurityTab';
import { useAuthStore } from '@/store/authStore';
import { logger } from '@/utils/logger';

const RELEASES_URL =
  'https://github.com/IndyukovAnton/Atom-Titles-Hive/releases/latest';

const isTauri = (): boolean =>
  typeof window !== 'undefined' &&
  '__TAURI_INTERNALS__' in window &&
  Boolean((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__);

const SETTINGS_TABS = ['appearance', 'account', 'integrations', 'security'] as const;
type SettingsTab = (typeof SETTINGS_TABS)[number];

export default function SettingsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestTourReplay = useAuthStore((s) => s.requestTourReplay);

  const tabParam = searchParams.get('tab');
  const activeTab: SettingsTab = (SETTINGS_TABS as readonly string[]).includes(tabParam ?? '')
    ? (tabParam as SettingsTab)
    : 'appearance';

  const handleTabChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', value);
    setSearchParams(next, { replace: true });
  };

  const handleReplayTour = () => {
    requestTourReplay();
    navigate('/');
  };

  const [isChecking, setIsChecking] = useState(false);

  // Tauri auto-update flow:
  //  1. `check()` стучится на updater.endpoints (см. tauri.conf.json), сравнивает
  //     версию манифеста с текущей по semver.
  //  2. Если новее — скачиваем и ставим, потом релоним приложение.
  //  3. Если plugin не установлен (браузерная dev-сборка) или сеть упала —
  //     открываем GitHub Releases во внешнем браузере как fallback.
  const handleCheckUpdates = async () => {
    if (!isTauri()) {
      window.open(RELEASES_URL, '_blank', 'noopener,noreferrer');
      return;
    }

    setIsChecking(true);
    const checkingToast = toast.loading('Проверяем наличие обновлений…');
    try {
      const { check } = await import('@tauri-apps/plugin-updater');
      const update = await check();

      if (!update) {
        toast.success('Установлена последняя версия', { id: checkingToast });
        return;
      }

      toast.dismiss(checkingToast);
      toast.info(`Доступна версия ${update.version} — скачиваю…`);
      let total = 0;
      let downloaded = 0;
      const progressToast = toast.loading('Загрузка обновления…');
      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            total = event.data.contentLength ?? 0;
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            if (total > 0) {
              const pct = Math.round((downloaded / total) * 100);
              toast.loading(`Загрузка обновления… ${pct}%`, {
                id: progressToast,
              });
            }
            break;
          case 'Finished':
            toast.success('Обновление загружено, перезапускаю…', {
              id: progressToast,
            });
            break;
        }
      });
      const { relaunch } = await import('@tauri-apps/plugin-process');
      await relaunch();
    } catch (e) {
      logger.error('Update check failed', e);
      toast.error(
        'Не удалось проверить обновления. Откройте страницу релизов вручную.',
        {
          id: checkingToast,
          action: {
            label: 'Открыть',
            onClick: () =>
              window.open(RELEASES_URL, '_blank', 'noopener,noreferrer'),
          },
        },
      );
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="container max-w-5xl py-8 px-4 mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="rounded-full hover:bg-background/80"
          >
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Настройки
            </h1>
            <p className="text-muted-foreground text-sm flex items-center gap-2">
              Управление внешним видом, безопасностью и интеграциями
              <Badge
                variant="secondary"
                className="font-mono text-[10px] px-1.5 py-0"
                title="Текущая версия приложения"
              >
                v{__APP_VERSION__}
              </Badge>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCheckUpdates}
            disabled={isChecking}
            className="rounded-full"
          >
            {isChecking ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Проверить обновления
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReplayTour}
            className="rounded-full"
          >
            <GraduationCap className="mr-2 h-4 w-4" />
            Обучение
          </Button>
          <Button variant="outline" size="sm" asChild className="rounded-full">
            <Link to="/changelog">
              <Sparkle className="mr-2 h-4 w-4" />
              Что нового?
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="rounded-full">
            <Link to="/privacy">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Приватность
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto p-1.5 bg-muted/40 backdrop-blur-sm rounded-xl border">
          <TabsTrigger
            value="appearance"
            className="rounded-lg py-2.5 gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300"
          >
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Внешний вид</span>
          </TabsTrigger>
          <TabsTrigger
            value="account"
            className="rounded-lg py-2.5 gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300"
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Аккаунт</span>
          </TabsTrigger>
          <TabsTrigger
            value="integrations"
            className="rounded-lg py-2.5 gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Интеграции & AI</span>
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="rounded-lg py-2.5 gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300"
          >
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Безопасность</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="appearance"
          className="space-y-6 animate-in slide-in-from-left-4 duration-300 zoom-in-95"
        >
          <AppearanceTab />
        </TabsContent>

        <TabsContent
          value="account"
          className="space-y-6 animate-in slide-in-from-right-4 duration-300 zoom-in-95"
        >
          <AccountSettings />
        </TabsContent>

        <TabsContent
          value="integrations"
          className="space-y-6 animate-in slide-in-from-bottom-4 duration-300 zoom-in-95"
        >
          <IntegrationsTab />
        </TabsContent>

        <TabsContent
          value="security"
          className="space-y-6 animate-in slide-in-from-right-4 duration-300 zoom-in-95"
        >
          <SecurityTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
