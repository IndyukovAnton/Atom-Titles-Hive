import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

const FONT_FAMILIES = [
  { id: 'Inter', name: 'Inter', url: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap' },
  { id: 'Roboto', name: 'Roboto', url: 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap' },
  { id: 'Outfit', name: 'Outfit', url: 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap' },
  { id: 'Poppins', name: 'Poppins', url: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap' },
  { id: 'Montserrat', name: 'Montserrat', url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap' },
  { id: 'Open Sans', name: 'Open Sans', url: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&display=swap' },
  { id: 'Lato', name: 'Lato', url: 'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap' },
  { id: 'Nunito', name: 'Nunito', url: 'https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700&display=swap' },
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
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set(['Inter']));

  const loadFont = (fontId: string) => {
    if (loadedFonts.has(fontId)) return;

    const font = FONT_FAMILIES.find((f) => f.id === fontId);
    if (!font) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = font.url;
    document.head.appendChild(link);

    setLoadedFonts((prev) => new Set(prev).add(fontId));
  };

  const handleFontFamilyChange = (value: string) => {
    loadFont(value);
    onFontFamilyChange(value);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label htmlFor="font-family">Семейство шрифта</Label>
        <Select value={fontFamily} onValueChange={handleFontFamilyChange}>
          <SelectTrigger id="font-family">
            <SelectValue placeholder="Выберите шрифт" />
          </SelectTrigger>
          <SelectContent>
            {FONT_FAMILIES.map((font) => (
              <SelectItem
                key={font.id}
                value={font.id}
                style={{ fontFamily: font.id }}
                onMouseEnter={() => loadFont(font.id)}
              >
                {font.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p
          className="text-sm text-muted-foreground preview-text"
          style={{ fontFamily }}
        >
          Пример текста с выбранным шрифтом
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="font-size">Размер шрифта</Label>
          <span className="text-sm text-muted-foreground">{fontSize}px</span>
        </div>
        <Slider
          id="font-size"
          min={12}
          max={20}
          step={1}
          value={[fontSize]}
          onValueChange={(value) => onFontSizeChange(value[0])}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Меньше</span>
          <span>Больше</span>
        </div>
      </div>
    </div>
  );
}
