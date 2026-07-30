import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useFormContext, Controller } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
/**
 * Обёртка над Select с интеграцией react-hook-form
 * Автоматически отображает ошибки валидации
 */
export function FormSelect({ name, label, required, placeholder, options, disabled, description, className, }) {
    const { control, formState: { errors }, } = useFormContext();
    const error = errors[name];
    const errorMessage = error?.message;
    return (_jsxs("div", { className: "space-y-2", children: [label && (_jsxs(Label, { htmlFor: name, children: [label, required && _jsx("span", { className: "text-destructive ml-1", children: "*" })] })), _jsx(Controller, { name: name, control: control, render: ({ field }) => (_jsxs(Select, { value: field.value?.toString() || "", onValueChange: field.onChange, disabled: disabled, children: [_jsx(SelectTrigger, { id: name, className: cn(error && 'border-destructive focus:ring-destructive', className), "aria-invalid": !!error, "aria-describedby": error ? `${name}-error` : description ? `${name}-description` : undefined, children: _jsx(SelectValue, { placeholder: placeholder }) }), _jsx(SelectContent, { children: options.map((option) => (_jsx(SelectItem, { value: option.value, children: option.label }, option.value))) })] })) }), description && !error && (_jsx("p", { id: `${name}-description`, className: "text-sm text-muted-foreground", children: description })), error && (_jsx("p", { id: `${name}-error`, className: "text-sm text-destructive", role: "alert", children: errorMessage }))] }));
}
