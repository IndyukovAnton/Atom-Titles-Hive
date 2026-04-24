import { Moon, Palette, Save, Sun, Type } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { BackgroundSelector } from '@/components/personalization/BackgroundSelector';
import { FontSettings } from '@/components/personalization/FontSettings';
import { usePersonalization } from '@/hooks/usePersonalization';
import { logger } from '@/utils/logger';

export function AppearanceTab() {
  const {
    theme,
    toggleTheme,
    background,
    setBackground,
    fontFamily,
    setFontFamily,
    fontSize,
    setFontSize,
    savePreferences,
  } = usePersonalization();

  const handleSave = async () => {
    try {
      await savePreferences();
      toast.success('Настройки персонализации сохранены');
    } catch (error) {
      logger.error('Failed to save preferences:', error);
      toast.error('Не удалось сохранить настройки');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-background/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20">
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon
                className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
                style={{ marginTop: '-20px', marginLeft: '0px' }}
              />
            </div>
            Тема оформления
          </CardTitle>
          <CardDescription>
            Выберите предпочтительную цветовую схему интерфейса
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between p-6 pt-0">
          <div className="space-y-0.5">
            <Label className="text-base font-medium">Тёмная тема</Label>
            <p className="text-sm text-muted-foreground">
              Снижает нагрузку на глаза
            </p>
          </div>
          <Switch
            checked={theme === 'dark'}
            onCheckedChange={toggleTheme}
            className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-600 data-[state=checked]:to-cyan-600"
          />
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-background/60 backdrop-blur-sm row-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
              <Type className="h-5 w-5" />
            </div>
            Типографика
          </CardTitle>
          <CardDescription>
            Настройте размер и семейство шрифта для комфортного чтения
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FontSettings
            fontFamily={fontFamily}
            fontSize={fontSize}
            onFontFamilyChange={setFontFamily}
            onFontSizeChange={setFontSize}
          />
          <Button
            onClick={handleSave}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0 shadow-md hover:shadow-lg transition-all"
          >
            <Save className="mr-2 h-4 w-4" /> Сохранить настройки
          </Button>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-background/60 backdrop-blur-sm md:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/20">
              <Palette className="h-5 w-5" />
            </div>
            Задний фон
          </CardTitle>
          <CardDescription>Персонализируйте рабочее пространство</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <BackgroundSelector value={background} onChange={setBackground} />
          <Button
            onClick={handleSave}
            variant="outline"
            className="w-full border-purple-500/20 hover:bg-purple-500/5 hover:text-purple-600 dark:hover:text-purple-400 group"
          >
            <Save className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />{' '}
            Сохранить фон
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
