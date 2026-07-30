import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { AlertTriangle, Brain, CheckCircle2, ChevronRight, Cloud, Cpu, ExternalLink, Globe, KeyRound, Loader2, RefreshCcw, Settings2, ShieldCheck, Terminal, XCircle, } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { recommendationsApi } from '@/api/recommendations';
const CLAUDE_MODELS = [
    { id: 'claude-sonnet-4-6', name: 'Sonnet 4.6', hint: 'Сбалансированный (рекомендуется)' },
    { id: 'claude-opus-4-7', name: 'Opus 4.7', hint: 'Самый умный, дороже' },
    { id: 'claude-haiku-4-5', name: 'Haiku 4.5', hint: 'Быстрый и дешёвый' },
];
const SOURCE_TITLES = {
    'claude-api': 'Claude (Cloud API)',
    'claude-cli': 'Claude (Local CLI)',
    'codex-cli': 'Codex (Local CLI)',
};
function privacyHint(source) {
    if (source === 'claude-cli') {
        return ' Локальный Claude CLI работает на вашем устройстве — данные никуда не уходят, кроме вашего собственного входа в Claude.';
    }
    if (source === 'codex-cli') {
        return ' Локальный Codex CLI работает на вашем устройстве — данные уходят только в ваш аккаунт OpenAI.';
    }
    return ' Облачный API передаёт данные в Anthropic.';
}
export function AISettings({ preferences, onChange }) {
    const source = preferences?.aiSource ?? 'claude-api';
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [_jsx(ShieldCheck, { className: "w-4 h-4" }), _jsxs("p", { children: ["\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 AI \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u044E\u0442\u0441\u044F \u0434\u043B\u044F \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0445 \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u0439.", privacyHint(source)] })] }), _jsx(Separator, {}), _jsxs("div", { className: "space-y-3", children: [_jsxs(Label, { className: "flex items-center gap-2", children: [_jsx(Brain, { className: "w-4 h-4" }), "\u0418\u0441\u0442\u043E\u0447\u043D\u0438\u043A \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u0439"] }), _jsxs("div", { className: "flex flex-col gap-2.5", children: [_jsx(SourceCard, { active: source === 'claude-api', onSelect: () => onChange({ aiSource: 'claude-api' }), icon: _jsx(Cloud, { className: "w-5 h-5" }), title: "Claude (Cloud API)", subtitle: "\u0427\u0435\u0440\u0435\u0437 API key Anthropic" }), _jsx(SourceCard, { active: source === 'claude-cli', onSelect: () => onChange({ aiSource: 'claude-cli' }), icon: _jsx(Terminal, { className: "w-5 h-5" }), title: "Claude (Local CLI)", subtitle: "\u0427\u0435\u0440\u0435\u0437 \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u043E \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u044B\u0439 claude" }), _jsx(SourceCard, { active: source === 'codex-cli', onSelect: () => onChange({ aiSource: 'codex-cli' }), icon: _jsx(Terminal, { className: "w-5 h-5" }), title: "Codex (Local CLI)", subtitle: "\u0427\u0435\u0440\u0435\u0437 \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u043E \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u044B\u0439 codex" })] })] }), _jsxs("div", { className: "rounded-xl border bg-muted/20 p-4 sm:p-5 space-y-5", children: [_jsxs("div", { className: "flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: [_jsx(Settings2, { className: "w-3.5 h-3.5" }), "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438: ", SOURCE_TITLES[source]] }), source === 'claude-api' ? (_jsx(ApiSection, { preferences: preferences, onChange: onChange })) : source === 'claude-cli' ? (_jsx(CliSection, { preferences: preferences, onChange: onChange })) : (_jsx(CodexCliSection, { preferences: preferences, onChange: onChange }))] })] }));
}
function SourceCard({ active, onSelect, icon, title, subtitle, }) {
    return (_jsxs("button", { type: "button", onClick: onSelect, "aria-pressed": active, className: `relative flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${active
            ? 'border-indigo-500 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 shadow-md'
            : 'border-border bg-background/60 hover:border-indigo-500/40'}`, children: [_jsx("div", { className: `p-2 rounded-lg ${active
                    ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                    : 'bg-muted text-muted-foreground'}`, children: icon }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "text-sm font-semibold flex items-center gap-2", children: [title, active && (_jsx("span", { className: "text-[10px] font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 rounded-full px-1.5 py-0.5", children: "\u0410\u043A\u0442\u0438\u0432\u0435\u043D" }))] }), _jsx("div", { className: "text-xs text-muted-foreground", children: subtitle })] }), _jsx(ChevronRight, { className: `w-4 h-4 shrink-0 ${active ? 'text-indigo-500' : 'text-muted-foreground/40'}` })] }));
}
function ApiSection({ preferences, onChange, }) {
    return (_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "space-y-3", children: [_jsxs(Label, { htmlFor: "anthropic-key", className: "flex items-center gap-2", children: [_jsx(KeyRound, { className: "w-4 h-4" }), "Anthropic API key"] }), _jsx(Input, { id: "anthropic-key", type: "password", placeholder: preferences?.hasAnthropicApiKey
                            ? 'Ключ сохранён — введите новый для замены'
                            : 'sk-ant-...', value: preferences?.anthropicApiKey || '', onChange: (e) => onChange({ anthropicApiKey: e.target.value }), autoComplete: "off" }), _jsxs("a", { href: "https://console.anthropic.com/", target: "_blank", rel: "noopener noreferrer", className: "inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline", children: ["\u041F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u043A\u043B\u044E\u0447 \u043D\u0430 console.anthropic.com", _jsx(ExternalLink, { className: "w-3 h-3" })] })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs(Label, { htmlFor: "claude-model", className: "flex items-center gap-2", children: [_jsx(Cpu, { className: "w-4 h-4" }), "\u041C\u043E\u0434\u0435\u043B\u044C \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E"] }), _jsxs(Select, { value: preferences?.claudeModel || 'claude-sonnet-4-6', onValueChange: (value) => onChange({ claudeModel: value }), children: [_jsx(SelectTrigger, { id: "claude-model", children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: CLAUDE_MODELS.map((m) => (_jsx(SelectItem, { value: m.id, children: _jsxs("div", { className: "flex flex-col", children: [_jsx("span", { children: m.name }), _jsx("span", { className: "text-[10px] text-muted-foreground", children: m.hint })] }) }, m.id))) })] })] }), _jsxs("div", { className: "flex items-center justify-between space-x-2 rounded-xl border bg-background/40 px-4 py-3", children: [_jsxs(Label, { htmlFor: "claude-web-search-api", className: "flex flex-col space-y-1", children: [_jsxs("span", { className: "flex items-center gap-2", children: [_jsx(Globe, { className: "w-4 h-4" }), "\u041F\u043E\u0438\u0441\u043A \u043D\u043E\u0432\u0438\u043D\u043E\u043A \u0432 \u0438\u043D\u0442\u0435\u0440\u043D\u0435\u0442\u0435"] }), _jsx("span", { className: "font-normal text-xs text-muted-foreground", children: "Claude \u043F\u0440\u043E\u0432\u0435\u0440\u0438\u0442 \u0441\u0432\u0435\u0436\u0438\u0435 \u0440\u0435\u043B\u0438\u0437\u044B (\u2248$0.05 / \u0437\u0430\u043F\u0440\u043E\u0441)" })] }), _jsx(Switch, { id: "claude-web-search-api", checked: preferences?.claudeUseWebSearch ?? true, onCheckedChange: (checked) => onChange({ claudeUseWebSearch: checked }) })] })] }));
}
function CliSection({ preferences, onChange, }) {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const refresh = async () => {
        setLoading(true);
        setError(null);
        try {
            const next = await recommendationsApi.getCliStatus();
            setStatus(next);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Не удалось проверить CLI');
            setStatus(null);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        void refresh();
    }, []);
    return (_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "rounded-xl border bg-background/40 p-4 space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(CliStatusIcon, { status: status, loading: loading, error: error }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-semibold", children: loading
                                                    ? 'Проверяю Claude CLI...'
                                                    : error
                                                        ? 'Ошибка проверки CLI'
                                                        : !status?.installed
                                                            ? 'Claude CLI не найден'
                                                            : !status.authed
                                                                ? 'CLI установлен, но не авторизован'
                                                                : `Claude CLI готов${status.version ? ` (v${status.version})` : ''}` }), (error || status?.error || status?.path) && (_jsx("div", { className: "text-xs text-muted-foreground mt-0.5", children: error || status?.error || `Путь: ${status?.path}` }))] })] }), _jsxs(Button, { type: "button", size: "sm", variant: "outline", onClick: () => void refresh(), disabled: loading, className: "gap-1", children: [loading ? (_jsx(Loader2, { className: "w-3.5 h-3.5 animate-spin" })) : (_jsx(RefreshCcw, { className: "w-3.5 h-3.5" })), "Re-check"] })] }), !status?.installed && !loading && (_jsxs("div", { className: "text-xs text-muted-foreground space-y-1.5 pt-1", children: [_jsx("p", { children: "\u0427\u0442\u043E\u0431\u044B \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C Claude CLI, \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u0435 \u0435\u0433\u043E:" }), _jsx("code", { className: "block bg-muted px-2 py-1.5 rounded text-[11px]", children: "npm install -g @anthropic-ai/claude-code" }), _jsxs("p", { children: ["\u0417\u0430\u0442\u0435\u043C \u0432\u044B\u043F\u043E\u043B\u043D\u0438\u0442\u0435 ", _jsx("code", { className: "bg-muted px-1 rounded", children: "claude" }), " \u0438 \u0432\u043E\u0439\u0434\u0438\u0442\u0435 \u0432 \u0430\u043A\u043A\u0430\u0443\u043D\u0442 Anthropic."] })] })), status?.installed && !status.authed && !loading && (_jsxs("div", { className: "text-xs text-muted-foreground space-y-1.5 pt-1", children: [_jsx("p", { children: "CLI \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D, \u043D\u043E \u0442\u0440\u0435\u0431\u0443\u0435\u0442 \u0432\u0445\u043E\u0434\u0430. \u0412 \u0442\u0435\u0440\u043C\u0438\u043D\u0430\u043B\u0435 \u0432\u044B\u043F\u043E\u043B\u043D\u0438\u0442\u0435:" }), _jsx("code", { className: "block bg-muted px-2 py-1.5 rounded text-[11px]", children: "claude" }), _jsx("p", { children: "\u0438 \u0432\u043E\u0439\u0434\u0438\u0442\u0435. \u041F\u043E\u0441\u043B\u0435 \u044D\u0442\u043E\u0433\u043E \u043D\u0430\u0436\u043C\u0438\u0442\u0435 Re-check." })] }))] }), _jsxs("div", { className: "space-y-3", children: [_jsxs(Label, { htmlFor: "claude-cli-path", className: "flex items-center gap-2", children: [_jsx(Terminal, { className: "w-4 h-4" }), "\u041F\u0443\u0442\u044C \u043A \u0431\u0438\u043D\u0430\u0440\u044E", _jsx("span", { className: "text-muted-foreground font-normal text-xs", children: "(\u043E\u043F\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E, \u0435\u0441\u043B\u0438 \u043D\u0435 \u0432 PATH)" })] }), _jsx(Input, { id: "claude-cli-path", type: "text", placeholder: "claude", value: preferences?.claudeCliPath || '', onChange: (e) => onChange({ claudeCliPath: e.target.value }) }), _jsxs("p", { className: "text-xs text-muted-foreground", children: ["\u041E\u0441\u0442\u0430\u0432\u044C\u0442\u0435 \u043F\u0443\u0441\u0442\u044B\u043C \u0434\u043B\u044F \u0430\u0432\u0442\u043E-\u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u0438\u044F. \u041F\u0440\u0438\u043C\u0435\u0440: ", _jsx("code", { className: "bg-muted px-1 rounded", children: "/usr/local/bin/claude" }), " \u0438\u043B\u0438 ", _jsx("code", { className: "bg-muted px-1 rounded", children: "C:\\Users\\...\\claude.cmd" })] })] }), _jsxs("div", { className: "flex items-center justify-between space-x-2 rounded-xl border bg-background/40 px-4 py-3", children: [_jsxs(Label, { htmlFor: "claude-web-search-cli", className: "flex flex-col space-y-1", children: [_jsxs("span", { className: "flex items-center gap-2", children: [_jsx(Globe, { className: "w-4 h-4" }), "\u0420\u0430\u0437\u0440\u0435\u0448\u0430\u0442\u044C WebSearch"] }), _jsx("span", { className: "font-normal text-xs text-muted-foreground", children: "Claude CLI \u0432\u043E\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F \u0432\u0441\u0442\u0440\u043E\u0435\u043D\u043D\u044B\u043C WebSearch \u0434\u043B\u044F \u043D\u043E\u0432\u0438\u043D\u043E\u043A" })] }), _jsx(Switch, { id: "claude-web-search-cli", checked: preferences?.claudeUseWebSearch ?? true, onCheckedChange: (checked) => onChange({ claudeUseWebSearch: checked }) })] })] }));
}
function CodexCliSection({ preferences, onChange, }) {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const refresh = async () => {
        setLoading(true);
        setError(null);
        try {
            const next = await recommendationsApi.getCodexCliStatus();
            setStatus(next);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Не удалось проверить Codex CLI');
            setStatus(null);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        void refresh();
    }, []);
    return (_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "rounded-xl border bg-background/40 p-4 space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(CliStatusIcon, { status: status, loading: loading, error: error }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-semibold", children: loading
                                                    ? 'Проверяю Codex CLI...'
                                                    : error
                                                        ? 'Ошибка проверки CLI'
                                                        : !status?.installed
                                                            ? 'Codex CLI не найден'
                                                            : !status.authed
                                                                ? 'CLI установлен, но не авторизован'
                                                                : `Codex CLI готов${status.version ? ` (v${status.version})` : ''}` }), (error || status?.error || status?.path) && (_jsx("div", { className: "text-xs text-muted-foreground mt-0.5", children: error || status?.error || `Путь: ${status?.path}` }))] })] }), _jsxs(Button, { type: "button", size: "sm", variant: "outline", onClick: () => void refresh(), disabled: loading, className: "gap-1", children: [loading ? (_jsx(Loader2, { className: "w-3.5 h-3.5 animate-spin" })) : (_jsx(RefreshCcw, { className: "w-3.5 h-3.5" })), "Re-check"] })] }), !status?.installed && !loading && (_jsxs("div", { className: "text-xs text-muted-foreground space-y-1.5 pt-1", children: [_jsx("p", { children: "\u0427\u0442\u043E\u0431\u044B \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C Codex CLI, \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u0435 \u0435\u0433\u043E:" }), _jsx("code", { className: "block bg-muted px-2 py-1.5 rounded text-[11px]", children: "npm install -g @openai/codex" }), _jsxs("p", { children: ["\u0417\u0430\u0442\u0435\u043C \u0432\u044B\u043F\u043E\u043B\u043D\u0438\u0442\u0435", ' ', _jsx("code", { className: "bg-muted px-1 rounded", children: "codex login" }), " \u0438 \u0432\u043E\u0439\u0434\u0438\u0442\u0435 \u0432 \u0430\u043A\u043A\u0430\u0443\u043D\u0442 OpenAI."] })] })), status?.installed && !status.authed && !loading && (_jsxs("div", { className: "text-xs text-muted-foreground space-y-1.5 pt-1", children: [_jsx("p", { children: "CLI \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D, \u043D\u043E \u0442\u0440\u0435\u0431\u0443\u0435\u0442 \u0432\u0445\u043E\u0434\u0430. \u0412 \u0442\u0435\u0440\u043C\u0438\u043D\u0430\u043B\u0435 \u0432\u044B\u043F\u043E\u043B\u043D\u0438\u0442\u0435:" }), _jsx("code", { className: "block bg-muted px-2 py-1.5 rounded text-[11px]", children: "codex login" }), _jsx("p", { children: "\u041F\u043E\u0441\u043B\u0435 \u044D\u0442\u043E\u0433\u043E \u043D\u0430\u0436\u043C\u0438\u0442\u0435 Re-check." })] }))] }), _jsxs("div", { className: "space-y-3", children: [_jsxs(Label, { htmlFor: "codex-cli-path", className: "flex items-center gap-2", children: [_jsx(Terminal, { className: "w-4 h-4" }), "\u041F\u0443\u0442\u044C \u043A \u0431\u0438\u043D\u0430\u0440\u044E", _jsx("span", { className: "text-muted-foreground font-normal text-xs", children: "(\u043E\u043F\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E, \u0435\u0441\u043B\u0438 \u043D\u0435 \u0432 PATH)" })] }), _jsx(Input, { id: "codex-cli-path", type: "text", placeholder: "codex", value: preferences?.codexCliPath || '', onChange: (e) => onChange({ codexCliPath: e.target.value }) }), _jsxs("p", { className: "text-xs text-muted-foreground", children: ["\u041E\u0441\u0442\u0430\u0432\u044C\u0442\u0435 \u043F\u0443\u0441\u0442\u044B\u043C \u0434\u043B\u044F \u0430\u0432\u0442\u043E-\u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u0438\u044F. \u041F\u0440\u0438\u043C\u0435\u0440:", ' ', _jsx("code", { className: "bg-muted px-1 rounded", children: "/usr/local/bin/codex" }), ' ', "\u0438\u043B\u0438", ' ', _jsx("code", { className: "bg-muted px-1 rounded", children: "C:\\Users\\...\\codex.cmd" })] })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs(Label, { htmlFor: "codex-model", className: "flex items-center gap-2", children: [_jsx(Cpu, { className: "w-4 h-4" }), "\u041C\u043E\u0434\u0435\u043B\u044C", _jsx("span", { className: "text-muted-foreground font-normal text-xs", children: "(\u043E\u043F\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E)" })] }), _jsx(Input, { id: "codex-model", type: "text", placeholder: "gpt-5.4", value: preferences?.codexModel || '', onChange: (e) => onChange({ codexModel: e.target.value }) }), _jsxs("p", { className: "text-xs text-muted-foreground", children: ["\u041F\u0435\u0440\u0435\u0434\u0430\u0451\u0442\u0441\u044F \u0432 ", _jsx("code", { className: "bg-muted px-1 rounded", children: "codex exec -m" }), ". \u041F\u0443\u0441\u0442\u043E \u2014 \u043C\u043E\u0434\u0435\u043B\u044C \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E \u0438\u0437 \u043A\u043E\u043D\u0444\u0438\u0433\u0430 Codex."] })] }), _jsxs("div", { className: "flex items-center justify-between space-x-2 rounded-xl border bg-background/40 px-4 py-3", children: [_jsxs(Label, { htmlFor: "codex-web-search-cli", className: "flex flex-col space-y-1", children: [_jsxs("span", { className: "flex items-center gap-2", children: [_jsx(Globe, { className: "w-4 h-4" }), "\u0420\u0430\u0437\u0440\u0435\u0448\u0430\u0442\u044C WebSearch"] }), _jsx("span", { className: "font-normal text-xs text-muted-foreground", children: "Codex \u0441\u043C\u043E\u0436\u0435\u0442 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C \u0432\u0441\u0442\u0440\u043E\u0435\u043D\u043D\u044B\u0439 \u0432\u0435\u0431-\u043F\u043E\u0438\u0441\u043A \u0434\u043B\u044F \u043D\u043E\u0432\u0438\u043D\u043E\u043A" })] }), _jsx(Switch, { id: "codex-web-search-cli", checked: preferences?.codexUseWebSearch ?? true, onCheckedChange: (checked) => onChange({ codexUseWebSearch: checked }) })] })] }));
}
function CliStatusIcon({ status, loading, error, }) {
    if (loading) {
        return (_jsx("div", { className: "p-2 rounded-lg bg-muted text-muted-foreground", children: _jsx(Loader2, { className: "w-5 h-5 animate-spin" }) }));
    }
    if (error || !status?.installed) {
        return (_jsx("div", { className: "p-2 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400", children: _jsx(XCircle, { className: "w-5 h-5" }) }));
    }
    if (!status.authed) {
        return (_jsx("div", { className: "p-2 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400", children: _jsx(AlertTriangle, { className: "w-5 h-5" }) }));
    }
    return (_jsx("div", { className: "p-2 rounded-lg bg-green-500/15 text-green-600 dark:text-green-400", children: _jsx(CheckCircle2, { className: "w-5 h-5" }) }));
}
