import {
  ArrowLeft,
  Download,
  GraduationCap,
  Palette,
  Shield,
  Sparkles,
  User,
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccountSettings } from '@/components/personalization/AccountSettings';
import { AppearanceTab } from './AppearanceTab';
import { IntegrationsTab } from './IntegrationsTab';
import { SecurityTab } from './SecurityTab';
import { useAuthStore } from '@/store/authStore';

const RELEASES_URL =
  'https://github.com/IndyukovAnton/web-titles-tracker/releases/latest';

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

  // Tauri-aware open: внутри desktop-сборки Tauri уважает app.security.csp и
  // блокирует window.open на http(s); используем shell-плагин если он есть,
  // иначе — обычный window.open (работает в браузерной dev-сборке).
  const handleCheckUpdates = async () => {
    try {
      type TauriCore = { invoke: (cmd: string, args: object) => Promise<void> };
      const tauri = (
        window as unknown as { __TAURI__?: { core?: TauriCore } }
      ).__TAURI__;
      if (tauri?.core?.invoke) {
        await tauri.core.invoke('plugin:shell|open', { path: RELEASES_URL });
        return;
      }
    } catch {
      // fallthrough на window.open
    }
    window.open(RELEASES_URL, '_blank', 'noopener,noreferrer');
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
            className="rounded-full"
          >
            <Download className="mr-2 h-4 w-4" />
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
            <Link to="/changelog">Что нового?</Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="rounded-full">
            <Link to="/privacy">Приватность</Link>
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
