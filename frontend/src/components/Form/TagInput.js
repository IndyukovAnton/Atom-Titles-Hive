import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Plus, X, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger, } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useFormContext, Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';
export function TagInput({ name, label, suggestions = [], disabled, }) {
    const { control } = useFormContext();
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    return (_jsxs("div", { className: "space-y-2", children: [label && _jsx(Label, { className: "text-sm font-medium", children: label }), _jsx(Controller, { name: name, control: control, render: ({ field }) => {
                    const currentTags = field.value || [];
                    const handleSelect = (tag) => {
                        const newValue = currentTags.includes(tag)
                            ? currentTags.filter((t) => t !== tag)
                            : [...currentTags, tag];
                        field.onChange(newValue);
                    };
                    const createTag = () => {
                        const trimmed = inputValue.trim();
                        if (trimmed && !currentTags.includes(trimmed)) {
                            field.onChange([...currentTags, trimmed]);
                            setInputValue('');
                        }
                    };
                    const removeTag = (tag) => {
                        field.onChange(currentTags.filter((t) => t !== tag));
                    };
                    return (_jsxs("div", { className: "flex flex-wrap gap-2 p-2 border rounded-md bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-all min-h-[42px]", children: [currentTags.map((tag) => (_jsxs(Badge, { variant: "secondary", className: "flex items-center gap-1 pr-1 animate-in fade-in zoom-in duration-200", children: [tag, _jsx("button", { type: "button", "aria-label": `Удалить ${tag}`, onClick: (e) => {
                                            e.stopPropagation();
                                            removeTag(tag);
                                        }, className: "ml-0.5 rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive focus:outline-none focus-visible:ring-1 focus-visible:ring-destructive cursor-pointer", children: _jsx(X, { className: "w-3 h-3" }) })] }, tag))), _jsxs(Popover, { open: open, onOpenChange: setOpen, children: [_jsx(PopoverTrigger, { asChild: true, children: _jsxs(Button, { variant: "ghost", size: "sm", className: "h-7 px-2 text-xs text-muted-foreground hover:text-foreground", disabled: disabled, children: [_jsx(Plus, { className: "w-3 h-3 mr-1" }), "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C"] }) }), _jsx(PopoverContent, { className: "w-[200px] p-0", align: "start", children: _jsxs(Command, { children: [_jsx(CommandInput, { placeholder: "\u041F\u043E\u0438\u0441\u043A \u0438\u043B\u0438 \u0432\u0432\u043E\u0434...", value: inputValue, onValueChange: setInputValue, onKeyDown: (e) => {
                                                        if (e.key === 'Enter' && inputValue) {
                                                            createTag();
                                                        }
                                                    } }), _jsxs(CommandList, { children: [_jsx(CommandEmpty, { children: _jsxs(Button, { variant: "ghost", className: "w-full justify-start text-xs h-8", onClick: createTag, children: ["\u0421\u043E\u0437\u0434\u0430\u0442\u044C \"", inputValue, "\""] }) }), _jsx(CommandGroup, { heading: "\u041F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u044F", children: suggestions.map((tag) => (_jsxs(CommandItem, { onSelect: () => handleSelect(tag), children: [_jsx(Check, { className: cn('mr-2 h-4 w-4', currentTags.includes(tag)
                                                                            ? 'opacity-100'
                                                                            : 'opacity-0') }), tag] }, tag))) })] })] }) })] })] }));
                } })] }));
}
