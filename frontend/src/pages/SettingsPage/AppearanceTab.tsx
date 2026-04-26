import { useEffect, useState } from 'react';
import { Eye, Moon, Palette, RotateCcw, Save, Sun, Type } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
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
    addEntryPreviewStyle,
    setAddEntryPreviewStyle,
    savePreferences,
  } = usePersonalization();

  // Draft-state для шрифта и размера: пикеры обновляют ТОЛЬКО предпросмотр,
  // глобальное применение и запись в БД — по кнопке «Сохранить».
  const [draftFontFamily, setDraftFontFamily] = useState(fontFamily);
  const [draftFontSize, setDraftFontSize] = useState(fontSize);

  // Если applied-значение пришло извне (логин, refetch профиля) — синкаем draft.
  useEffect(() => {
    setDraftFontFamily(fontFamily);
  }, [fontFamily]);
  useEffect(() => {
    setDraftFontSize(fontSize);
  }, [fontSize]);

  const typographyDirty =
    draftFontFamily !== fontFamily || draftFontSize !== fontSize;

  const handleSave = async () => {
    try {
      await savePreferences();
      toast.success('Настройки персонализации сохранены');
    } catch (error) {
      logger.error('Failed to save preferences:', error);
      toast.error('Не удалось сохранить настройки');
    }
  };

  const handleSaveTypography = async () => {
    try {
      // Применяем draft в context, чтобы DOM обновился сразу.
      setFontFamily(draftFontFamily);
      setFontSize(draftFontSize);
      // savePreferences читает старый context; передаём overrides явно.
      await savePreferences({
        fontFamily: draftFontFamily,
        fontSize: draftFontSize,
      });
      toast.success('Шрифт применён ко всему сайту');
    } catch (error) {
      logger.error('Failed to save typography:', error);
      toast.error('Не удалось сохранить шрифт');
    }
  };

  const handleResetTypography = () => {
    setDraftFontFamily(fontFamily);
    setDraftFontSize(fontSize);
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-background/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/20">
              <Palette className="h-5 w-5" />
            </div>
            Тема и фон
          </CardTitle>
          <CardDescription>
            Цветовая схема интерфейса и фон рабочего пространства
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20">
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon
                  className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
                  style={{ marginTop: '-16px', marginLeft: '0px' }}
                />
              </div>
              <div className="space-y-0.5">
                <Label className="text-base font-medium">Тёмная тема</Label>
                <p className="text-sm text-muted-foreground">
                  Снижает нагрузку на глаза
                </p>
              </div>
            </div>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={toggleTheme}
              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-600 data-[state=checked]:to-cyan-600"
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Задний фон</Label>
              <p className="text-sm text-muted-foreground">
                Персонализируйте рабочее пространство
              </p>
            </div>
            <BackgroundSelector value={background} onChange={setBackground} />
            <Button
              onClick={handleSave}
              variant="outline"
              className="w-full border-purple-500/20 hover:bg-purple-500/5 hover:text-purple-600 dark:hover:text-purple-400 group"
            >
              <Save className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
              Сохранить тему и фон
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-background/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
              <Type className="h-5 w-5" />
            </div>
            Типографика
          </CardTitle>
          <CardDescription>
            Размер и семейство шрифта для комфортного чтения
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FontSettings
            fontFamily={draftFontFamily}
            fontSize={draftFontSize}
            onFontFamilyChange={setDraftFontFamily}
            onFontSizeChange={setDraftFontSize}
          />
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleSaveTypography}
              disabled={!typographyDirty}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="mr-2 h-4 w-4" /> Применить ко всему сайту
            </Button>
            <Button
              onClick={handleResetTypography}
              variant="outline"
              disabled={!typographyDirty}
              className="sm:w-auto"
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Сбросить
            </Button>
          </div>
          {typographyDirty && (
            <p className="text-xs text-muted-foreground -mt-3">
              Изменения видны только в предпросмотре. Нажмите «Применить», чтобы
              использовать их во всём приложении.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-background/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 ring-1 ring-pink-500/20">
              <Eye className="h-5 w-5" />
            </div>
            Стиль превью записи
          </CardTitle>
          <CardDescription>
            Как будет выглядеть карточка-превью в форме добавления
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(['mirror', 'poster'] as const).map((style) => {
            const isActive = addEntryPreviewStyle === style;
            const label = style === 'mirror' ? 'Как в библиотеке' : 'Кинопостер';
            const desc =
              style === 'mirror'
                ? 'Точная копия карточки из библиотеки — видишь ровно то, что получишь'
                : 'Стилизованный постер с градиентом в цвете категории';
            return (
              <button
                key={style}
                type="button"
                onClick={() => setAddEntryPreviewStyle(style)}
                className={`group text-left rounded-xl border p-4 transition-all cursor-pointer ${
                  isActive
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border/60 hover:border-primary/60 hover:bg-muted/30'
                }`}
                aria-pressed={isActive}
              >
                <div
                  className={`mb-3 h-24 rounded-lg ${
                    style === 'mirror'
                      ? 'bg-gradient-to-br from-muted/60 to-muted/90 ring-1 ring-border/50'
                      : 'bg-gradient-to-br from-pink-500/70 to-purple-600/70'
                  } flex items-center justify-center`}
                >
                  <span
                    className={`text-xs font-medium ${
                      style === 'mirror' ? 'text-muted-foreground' : 'text-white'
                    }`}
                  >
                    {style === 'mirror' ? 'MediaCard' : 'Poster'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{label}</span>
                  {isActive && (
                    <span className="text-xs text-primary font-medium">Выбрано</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
              </button>
            );
          })}
        </CardContent>
      </Card>

    </div>
  );
}
