import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
/**
 * Обёртка над Textarea с интеграцией react-hook-form
 * Автоматически отображает ошибки валидации
 */
export const FormTextarea = forwardRef(({ name, label, required, description, className, ...props }, ref) => {
    const { register, formState: { errors }, } = useFormContext();
    const error = errors[name];
    const errorMessage = error?.message;
    const { ref: registerRef, ...registerProps } = register(name);
    return (_jsxs("div", { className: "space-y-2", children: [label && (_jsxs(Label, { htmlFor: name, children: [label, required && _jsx("span", { className: "text-destructive ml-1", children: "*" })] })), _jsx(Textarea, { id: name, ...registerProps, ...props, ref: (e) => {
                    registerRef(e);
                    if (typeof ref === 'function') {
                        ref(e);
                    }
                    else if (ref) {
                        ref.current = e;
                    }
                }, className: cn(error && 'border-destructive focus-visible:ring-destructive', className), "aria-invalid": !!error, "aria-describedby": error ? `${name}-error` : description ? `${name}-description` : undefined }), description && !error && (_jsx("p", { id: `${name}-description`, className: "text-sm text-muted-foreground", children: description })), error && (_jsx("p", { id: `${name}-error`, className: "text-sm text-destructive", role: "alert", children: errorMessage }))] }));
});
FormTextarea.displayName = 'FormTextarea';
