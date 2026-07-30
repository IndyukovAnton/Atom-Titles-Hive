import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, CloudDownload, Type, Upload } from 'lucide-react';
import { toast } from '@/utils/app-toast';
import { logger } from '@/utils/logger';
import { PRESET_FONTS } from '@/constants/fonts';
export function FontSettings({ fontFamily, fontSize, onFontFamilyChange, onFontSizeChange, }) {
    const [googleFontName, setGoogleFontName] = useState('');
    const [customFile, setCustomFile] = useState(null);
    // Load preset fonts on specific tabs or user interaction
    const loadCssLink = (url) => {
        if (!document.querySelector(`link[href="${url}"]`)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = url;
            document.head.appendChild(link);
        }
    };
    const handlePresetSelect = (font) => {
        loadCssLink(font.url);
        onFontFamilyChange(font.id);
    };
    const handleGoogleFontLoad = () => {
        if (!googleFontName.trim())
            return;
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
    const handleFileUpload = (e) => {
        if (e.target.files && e.target.files[0]) {
            setCustomFile(e.target.files[0]);
        }
    };
    const applyCustomFont = () => {
        if (!customFile)
            return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result;
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
            }
            catch (err) {
                logger.warn('Font too large to save to localStorage', err);
                toast.warning('Шрифт слишком большой для сохранения. Он сбросится после перезагрузки.');
            }
            onFontFamilyChange(fontName);
            toast.success('Свой шрифт применен');
        };
        reader.readAsDataURL(customFile);
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Label, { htmlFor: "font-size", children: "\u0420\u0430\u0437\u043C\u0435\u0440 \u0448\u0440\u0438\u0444\u0442\u0430" }), _jsxs("span", { className: "text-sm font-mono bg-muted px-2 py-0.5 rounded", children: [fontSize, "px"] })] }), _jsx(Slider, { id: "font-size", min: 12, max: 24, step: 1, value: [fontSize], onValueChange: (value) => onFontSizeChange(value[0]), className: "w-full" }), _jsxs("div", { className: "flex justify-between text-xs text-muted-foreground px-1", children: [_jsx("span", { children: "\u041C\u0435\u043B\u043A\u0438\u0439" }), _jsx("span", { children: "\u041A\u0440\u0443\u043F\u043D\u044B\u0439" })] })] }), _jsxs(Tabs, { defaultValue: "presets", className: "w-full", children: [_jsxs(TabsList, { className: "w-full grid grid-cols-3", children: [_jsx(TabsTrigger, { value: "presets", children: "\u0411\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0430" }), _jsx(TabsTrigger, { value: "google", children: "Google Fonts" }), _jsx(TabsTrigger, { value: "custom", children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430" })] }), _jsx(TabsContent, { value: "presets", className: "mt-4 space-y-4", children: _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3", children: PRESET_FONTS.map(font => (_jsxs(Button, { variant: fontFamily === font.id ? "default" : "outline", className: `justify-start h-auto py-3 px-4 ${fontFamily === font.id ? 'border-primary' : 'border-muted'}`, onClick: () => handlePresetSelect(font), style: { fontFamily: font.id }, children: [_jsxs("div", { className: "flex flex-col items-start gap-1 w-full", children: [_jsx("span", { className: "text-base", children: font.name }), _jsx("span", { className: "text-xs opacity-70 font-normal", children: "Aa Bb Cc 123" })] }), fontFamily === font.id && _jsx(Check, { className: "ml-auto w-4 h-4" })] }, font.id))) }) }), _jsxs(TabsContent, { value: "google", className: "mt-4 space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0448\u0440\u0438\u0444\u0442\u0430 \u0438\u0437 Google Fonts" }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { placeholder: "\u041D\u0430\u043F\u0440\u0438\u043C\u0435\u0440: Lobster, Pacifico, Orbitron", value: googleFontName, onChange: (e) => setGoogleFontName(e.target.value) }), _jsxs(Button, { onClick: handleGoogleFontLoad, disabled: !googleFontName, children: [_jsx(CloudDownload, { className: "mr-2 h-4 w-4" }), "\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C"] })] }), _jsxs("p", { className: "text-xs text-muted-foreground", children: ["\u0423\u0431\u0435\u0434\u0438\u0442\u0435\u0441\u044C, \u0447\u0442\u043E \u0432\u0432\u043E\u0434\u0438\u0442\u0435 \u0442\u043E\u0447\u043D\u043E\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0441 ", _jsx("a", { href: "https://fonts.google.com/", target: "_blank", rel: "noreferrer", className: "underline hover:text-primary", children: "fonts.google.com" })] })] }), fontFamily === googleFontName && (_jsx("div", { className: "p-4 rounded-lg border bg-muted/50 mt-4", children: _jsxs("p", { style: { fontFamily: fontFamily }, className: "text-lg", children: ["\u0421\u044A\u0435\u0448\u044C \u0435\u0449\u0451 \u044D\u0442\u0438\u0445 \u043C\u044F\u0433\u043A\u0438\u0445 \u0444\u0440\u0430\u043D\u0446\u0443\u0437\u0441\u043A\u0438\u0445 \u0431\u0443\u043B\u043E\u043A, \u0434\u0430 \u0432\u044B\u043F\u0435\u0439 \u0447\u0430\u044E.", _jsx("br", {}), "The quick brown fox jumps over the lazy dog."] }) }))] }), _jsxs(TabsContent, { value: "custom", className: "mt-4 space-y-4", children: [_jsx("div", { className: "border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 text-center hover:bg-muted/50 transition-colors", children: _jsxs("div", { className: "flex flex-col items-center gap-3", children: [_jsx("div", { className: "p-3 bg-muted rounded-full", children: _jsx(Upload, { className: "w-6 h-6 text-muted-foreground" }) }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "font-upload", className: "cursor-pointer text-primary hover:underline", children: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0444\u0430\u0439\u043B \u0448\u0440\u0438\u0444\u0442\u0430" }), _jsx(Input, { id: "font-upload", type: "file", accept: ".ttf,.woff,.woff2,.otf", className: "hidden", onChange: handleFileUpload }), _jsx("p", { className: "text-xs text-muted-foreground", children: "\u041F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u044E\u0442\u0441\u044F \u0444\u043E\u0440\u043C\u0430\u0442\u044B TTF, WOFF, OTF (\u0434\u043E 2MB)" })] }), customFile && (_jsxs("div", { className: "flex items-center gap-2 mt-2 p-2 bg-background border rounded text-sm", children: [_jsx(Type, { className: "w-4 h-4" }), customFile.name] }))] }) }), _jsx(Button, { onClick: applyCustomFont, disabled: !customFile, className: "w-full", children: "\u041F\u0440\u0438\u043C\u0435\u043D\u0438\u0442\u044C \u0441\u0432\u043E\u0439 \u0448\u0440\u0438\u0444\u0442" })] })] }), _jsxs("div", { className: "mt-6 p-4 rounded-lg border bg-card text-card-foreground space-y-3", children: [_jsxs("div", { className: "flex items-baseline justify-between gap-2", children: [_jsx("label", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wider block", children: "\u041F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440" }), _jsxs("span", { className: "text-[10px] text-muted-foreground", children: [fontFamily, " \u00B7 ", fontSize, "px"] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("p", { style: { fontFamily, fontSize }, lang: "ru", className: "leading-relaxed", children: "\u0421\u044A\u0435\u0448\u044C \u0435\u0449\u0451 \u044D\u0442\u0438\u0445 \u043C\u044F\u0433\u043A\u0438\u0445 \u0444\u0440\u0430\u043D\u0446\u0443\u0437\u0441\u043A\u0438\u0445 \u0431\u0443\u043B\u043E\u043A, \u0434\u0430 \u0432\u044B\u043F\u0435\u0439 \u0447\u0430\u044E. \u0417\u0430\u0433\u043E\u043B\u043E\u0432\u043A\u0438, \u0442\u0435\u043A\u0441\u0442\u044B \u0438 \u043F\u043E\u0434\u043F\u0438\u0441\u0438 \u0431\u0443\u0434\u0443\u0442 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u0439 \u0448\u0440\u0438\u0444\u0442." }), _jsx("p", { style: { fontFamily, fontSize }, lang: "en", className: "leading-relaxed", children: "The quick brown fox jumps over the lazy dog. Headings, body copy and captions will use this font. 0123456789" })] })] })] }));
}
