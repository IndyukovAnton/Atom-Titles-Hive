import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { useFormContext, Controller } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger, } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
export function DatePicker({ name, label, placeholder = "Выберите дату", disabled }) {
    const { control } = useFormContext();
    return (_jsxs("div", { className: "space-y-2", children: [label && _jsx(Label, { className: "text-sm font-medium", children: label }), _jsx(Controller, { name: name, control: control, render: ({ field }) => (_jsxs(Popover, { children: [_jsx(PopoverTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", className: cn("w-full justify-start text-left font-normal h-10", !field.value && "text-muted-foreground"), disabled: disabled, children: [_jsx(CalendarIcon, { className: "mr-2 h-4 w-4" }), field.value ? (format(new Date(field.value), "PPP", { locale: ru })) : (_jsx("span", { children: placeholder }))] }) }), _jsx(PopoverContent, { className: "w-auto p-0", align: "start", children: _jsx(Calendar, { mode: "single", selected: field.value ? new Date(field.value) : undefined, onSelect: (date) => field.onChange(date?.toISOString()), initialFocus: true, locale: ru }) })] })) })] }));
}
