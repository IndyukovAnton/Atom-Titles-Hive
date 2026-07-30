import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { runInteractiveUpdateCheck } from '@/utils/updater';
/**
 * Floating "check for updates" button. Used on auth screens so a broken build
 * can always self-recover via the updater without the user reaching Settings.
 */
export function UpdateChecker({ label, className }) {
    const [isChecking, setIsChecking] = useState(false);
    const handleClick = async () => {
        setIsChecking(true);
        try {
            await runInteractiveUpdateCheck();
        }
        finally {
            setIsChecking(false);
        }
    };
    return (_jsxs(Button, { variant: "ghost", size: "sm", onClick: handleClick, disabled: isChecking, className: className, title: "\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F", children: [isChecking ? (_jsx(Loader2, { className: "h-4 w-4 animate-spin" })) : (_jsx(Download, { className: "h-4 w-4" })), _jsx("span", { className: "ml-2 text-xs", children: label ?? `v${__APP_VERSION__}` })] }));
}
