import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
/**
 * Обёртка над Input с интеграцией react-hook-form
 * Автоматически отображает ошибки валидации.
 * Для type="password" добавляет toggle Eye/EyeOff и подавляет дублирующий
 * браузерный «реveal» (Edge ::-ms-reveal — см. правило в index.css).
 */
export const FormInput = forwardRef(({ name, label, required, description, className, type, ...props }, ref) => {
    const { register, formState: { errors }, } = useFormContext();
    const error = errors[name];
    const errorMessage = error?.message;
    const isPassword = type === 'password';
    const [showPassword, setShowPassword] = useState(false);
    const effectiveType = isPassword && showPassword ? 'text' : type;
    const { ref: registerRef, ...registerProps } = register(name, {
        valueAsNumber: type === 'number',
    });
    return (_jsxs("div", { className: "space-y-2", children: [label && (_jsxs(Label, { htmlFor: name, children: [label, required && _jsx("span", { className: "text-destructive ml-1", children: "*" })] })), _jsxs("div", { className: isPassword ? 'relative' : undefined, children: [_jsx(Input, { id: name, type: effectiveType, ...registerProps, ...props, ref: (e) => {
                            registerRef(e);
                            if (typeof ref === 'function') {
                                ref(e);
                            }
                            else if (ref) {
                                ref.current = e;
                            }
                        }, className: cn(error && 'border-destructive focus-visible:ring-destructive', isPassword && 'pr-10', className), "aria-invalid": !!error, "aria-describedby": error ? `${name}-error` : description ? `${name}-description` : undefined }), isPassword && (_jsx("button", { type: "button", onClick: () => setShowPassword((v) => !v), className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer", "aria-label": showPassword ? 'Скрыть пароль' : 'Показать пароль', tabIndex: -1, children: showPassword ? _jsx(EyeOff, { size: 18 }) : _jsx(Eye, { size: 18 }) }))] }), description && !error && (_jsx("p", { id: `${name}-description`, className: "text-sm text-muted-foreground", children: description })), error && (_jsx("p", { id: `${name}-error`, className: "text-sm text-destructive", role: "alert", children: errorMessage }))] }));
});
FormInput.displayName = 'FormInput';
