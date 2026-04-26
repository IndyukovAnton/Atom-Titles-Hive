import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, CloudDownload, Type, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

const PRESET_FONTS = [
  { id: 'Inter', name: 'Inter', url: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap' },
  { id: 'Roboto', name: 'Roboto', url: 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap' },
  { id: 'Open Sans', name: 'Open Sans', url: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&display=swap' },
  { id: 'Montserrat', name: 'Montserrat', url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap' },
  { id: 'Lato', name: 'Lato', url: 'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap' },
  { id: 'Poppins', name: 'Poppins', url: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap' },
  { id: 'Outfit', name: 'Outfit', url: 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap' },
  { id: 'Nunito', name: 'Nunito', url: 'https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700&display=swap' },
  { id: 'Raleway', name: 'Raleway', url: 'https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700&display=swap' },
  { id: 'Merriweather', name: 'Merriweather', url: 'https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&display=swap' },
  { id: 'Ubuntu', name: 'Ubuntu', url: 'https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;700&display=swap' },
  { id: 'Rubik', name: 'Rubik', url: 'https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700&display=swap' },
  { id: 'Playfair Display', name: 'Playfair Display', url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap' },
  { id: 'Lora', name: 'Lora', url: 'https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&display=swap' },
  { id: 'Work Sans', name: 'Work Sans', url: 'https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600;700&display=swap' },
];

interface FontSettingsProps {
  fontFamily: string;
  fontSize: number;
  onFontFamilyChange: (fontFamily: string) => void;
  onFontSizeChange: (fontSize: number) => void;
}

export function FontSettings({
  fontFamily,
  fontSize,
  onFontFamilyChange,
  onFontSizeChange,
}: FontSettingsProps) {
  const [googleFontName, setGoogleFontName] = useState('');
  const [customFile, setCustomFile] = useState<File | null>(null);

  // Load preset fonts on specific tabs or user interaction
  const loadCssLink = (url: string) => {
    if (!document.querySelector(`link[href="${url}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      document.head.appendChild(link);
    }
  };

  const handlePresetSelect = (font: typeof PRESET_FONTS[0]) => {
    loadCssLink(font.url);
    onFontFamilyChange(font.id);
  };

  const handleGoogleFontLoad = () => {
    if (!googleFontName.trim()) return;
    
    // Construct simplified Google Fonts URL
    const formattedName = googleFontName.trim().replace(/ /g, '+');
    const url = `https://fonts.googleapis.com/css2?family=${formattedName}:wght@300;400;500;700&display=swap`;
    const fontId = googleFontName.trim();

    // Try to load
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.onload = () => {
       toast.success(`Шрифт ${fontId} успешно загружен`);
       onFontFamilyChange(fontId);
    };
    link.onerror = () => {
       toast.error(`Не удалось найти шрифт ${fontId} в Google Fonts`);
    };
    document.head.appendChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCustomFile(e.target.files[0]);
    }
  };

  const applyCustomFont = () => {
    if (!customFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const fontName = 'CustomUploadedFont';
      
      const style = document.createElement('style');
      style.textContent = `
        @font-face {
          font-family: '${fontName}';
          src: url('${result}');
        }
      `;
      document.head.appendChild(style);
      
      // Save to localStorage to persist across reloads (basic implementation)
      try {
          localStorage.setItem('custom_font_css', style.textContent);
          localStorage.setItem('custom_font_name', fontName);
      } catch (err) {
          logger.warn('Font too large to save to localStorage', err);
          toast.warning('Шрифт слишком большой для сохранения. Он сбросится после перезагрузки.');
      }

      onFontFamilyChange(fontName);
      toast.success('Свой шрифт применен');
    };
    reader.readAsDataURL(customFile);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="font-size">Размер шрифта</Label>
            <span className="text-sm font-mono bg-muted px-2 py-0.5 rounded">{fontSize}px</span>
          </div>
          <Slider
            id="font-size"
            min={12}
            max={24}
            step={1}
            value={[fontSize]}
            onValueChange={(value) => onFontSizeChange(value[0])}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground px-1">
            <span>Мелкий</span>
            <span>Крупный</span>
          </div>
      </div>

      <Tabs defaultValue="presets" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="presets">Библиотека</TabsTrigger>
          <TabsTrigger value="google">Google Fonts</TabsTrigger>
          <TabsTrigger value="custom">Загрузка</TabsTrigger>
        </TabsList>
        
        <TabsContent value="presets" className="mt-4 space-y-4">
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
             {PRESET_FONTS.map(font => (
               <Button
                 key={font.id}
                 variant={fontFamily === font.id ? "default" : "outline"}
                 className={`justify-start h-auto py-3 px-4 ${fontFamily === font.id ? 'border-primary' : 'border-muted'}`}
                 onClick={() => handlePresetSelect(font)}
                 style={{ fontFamily: font.id }}
               >
                 <div className="flex flex-col items-start gap-1 w-full">
                   <span className="text-base">{font.name}</span>
                   <span className="text-xs opacity-70 font-normal">Aa Bb Cc 123</span>
                 </div>
                 {fontFamily === font.id && <Check className="ml-auto w-4 h-4" />}
               </Button>
             ))}
           </div>
        </TabsContent>

        <TabsContent value="google" className="mt-4 space-y-4">
            <div className="space-y-2">
                <Label>Название шрифта из Google Fonts</Label>
                <div className="flex gap-2">
                    <Input 
                        placeholder="Например: Lobster, Pacifico, Orbitron" 
                        value={googleFontName}
                        onChange={(e) => setGoogleFontName(e.target.value)}
                    />
                    <Button onClick={handleGoogleFontLoad} disabled={!googleFontName}>
                        <CloudDownload className="mr-2 h-4 w-4" />
                        Загрузить
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                    Убедитесь, что вводите точное название с <a href="https://fonts.google.com/" target="_blank" rel="noreferrer" className="underline hover:text-primary">fonts.google.com</a>
                </p>
            </div>
            
            {fontFamily === googleFontName && (
                <div className="p-4 rounded-lg border bg-muted/50 mt-4">
                    <p style={{ fontFamily: fontFamily }} className="text-lg">
                        Съешь ещё этих мягких французских булок, да выпей чаю.
                        <br />
                        The quick brown fox jumps over the lazy dog.
                    </p>
                </div>
            )}
        </TabsContent>

        <TabsContent value="custom" className="mt-4 space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 text-center hover:bg-muted/50 transition-colors">
                <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-muted rounded-full">
                        <Upload className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="font-upload" className="cursor-pointer text-primary hover:underline">
                            Выберите файл шрифта
                        </Label>
                        <Input 
                            id="font-upload" 
                            type="file" 
                            accept=".ttf,.woff,.woff2,.otf" 
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                        <p className="text-xs text-muted-foreground">
                            Поддерживаются форматы TTF, WOFF, OTF (до 2MB)
                        </p>
                    </div>
                    {customFile && (
                        <div className="flex items-center gap-2 mt-2 p-2 bg-background border rounded text-sm">
                            <Type className="w-4 h-4" />
                            {customFile.name}
                        </div>
                    )}
                </div>
            </div>

            <Button onClick={applyCustomFont} disabled={!customFile} className="w-full">
                Применить свой шрифт
            </Button>
        </TabsContent>
      </Tabs>
      
      <div className="mt-6 p-4 rounded-lg border bg-card text-card-foreground">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
            Предпросмотр
        </label>
        <p style={{ fontFamily, fontSize }} className="leading-relaxed">
           Это пример текста, чтобы вы могли оценить выбранный шрифт. 
           Он будет использоваться для заголовков и основного контента приложения.
        </p>
      </div>
    </div>
  );
}
