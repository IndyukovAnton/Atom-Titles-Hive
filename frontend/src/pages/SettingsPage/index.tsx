import { useState } from 'react';
import {
  Blocks,
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccountSettings } from '@/components/personalization/AccountSettings';
import { SubPageNav } from '@/components/SubPageNav';
import { AppearanceTab } from './AppearanceTab';
import { IntegrationsTab } from './IntegrationsTab';
import { ProvidersTab } from './ProvidersTab';
import { SecurityTab } from './SecurityTab';
import { useAuthStore } from '@/store/authStore';
import { runInteractiveUpdateCheck } from '@/utils/updater';

const SETTINGS_TABS = [
  'appearance',
  'account',
  'integrations',
  'providers',
  'security',
] as const;
type SettingsTab = (typeof SETTINGS_TABS)[number];

const TAB_ITEMS: Array<{
  value: SettingsTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { value: 'appearance', label: 'Внешний вид', icon: Palette },
  { value: 'account', label: 'Аккаунт', icon: User },
  { value: 'integrations', label: 'Интеграции & AI', icon: Sparkles },
  { value: 'providers', label: 'Провайдеры', icon: Blocks },
  { value: 'security', label: 'Безопасность', icon: Shield },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestTourReplay = useAuthStore((s) => s.requestTourReplay);

  const tabParam = searchParams.get('tab');
  const activeTab: SettingsTab = (SETTINGS_TABS as readonly string[]).includes(
    tabParam ?? '',
  )
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

  // Вся updater-логика — в utils/updater (общая с UpdateChecker):
  // check → downloadAndInstall с прогрессом → relaunch; в браузере и при
  // ошибке сети открывается GitHub Releases как fallback.
  const handleCheckUpdates = async () => {
    setIsChecking(true);
    try {
      await runInteractiveUpdateCheck();
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <>
      <SubPageNav />
      <div className="container max-w-5xl py-6 px-4 mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
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
            <Button
              variant="outline"
              size="sm"
              asChild
              className="rounded-full"
            >
              <Link to="/changelog">
                <Sparkle className="mr-2 h-4 w-4" />
                Что нового?
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="rounded-full"
            >
              <Link to="/privacy">
                <ShieldCheck className="mr-2 h-4 w-4" />
                Приватность
              </Link>
            </Button>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="space-y-8"
        >
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto p-1.5 bg-muted/40 backdrop-blur-sm rounded-xl border">
            {TAB_ITEMS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="rounded-lg py-2.5 gap-2 transition-all duration-300 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:ring-1 data-[state=active]:ring-indigo-500/30 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400"
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline truncate">{label}</span>
              </TabsTrigger>
            ))}
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
            value="providers"
            className="space-y-6 animate-in slide-in-from-bottom-4 duration-300 zoom-in-95"
          >
            <ProvidersTab />
          </TabsContent>

          <TabsContent
            value="security"
            className="space-y-6 animate-in slide-in-from-right-4 duration-300 zoom-in-95"
          >
            <SecurityTab />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
