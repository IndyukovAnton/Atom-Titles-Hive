import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useCallback, useMemo, useState } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { groupsApi } from '../api/groups';
import { AxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { FormInput } from '@/components/Form';
import { groupSchema } from '@/schemas/groupSchema';
import { buildParentOptions } from '@/utils/group-tree';
import { toast } from '@/utils/app-toast';
const ROOT_PARENT_VALUE = 'root';
export default function CreateGroupModal({ isOpen, onClose, onSuccess, initialData, parentId, groups = [], }) {
    const [error, setError] = useState(null);
    const methods = useForm({
        resolver: zodResolver(groupSchema),
        defaultValues: {
            name: '',
            parentId: null,
        },
    });
    const { handleSubmit, reset, formState: { isSubmitting }, } = methods;
    // Свою группу и её потомков нельзя выбрать родителем — получится цикл
    const parentOptions = useMemo(() => buildParentOptions(groups, initialData?.id), [groups, initialData?.id]);
    useEffect(() => {
        if (isOpen) {
            reset({
                name: initialData?.name || '',
                parentId: initialData
                    ? (initialData.parentId ?? null)
                    : (parentId ?? null),
            });
        }
    }, [isOpen, initialData, parentId, reset]);
    const onSubmit = useCallback(async (data) => {
        setError(null);
        try {
            if (initialData) {
                await groupsApi.update(initialData.id, data);
                toast.success('Группа обновлена');
            }
            else {
                await groupsApi.create(data);
                toast.success('Группа создана');
            }
            onSuccess();
            onClose();
        }
        catch (err) {
            const error = err;
            const errorMessage = error.response?.data?.message || 'Не удалось сохранить группу';
            setError(errorMessage);
            toast.error(errorMessage);
        }
    }, [initialData, onSuccess, onClose]);
    const handleClose = useCallback(() => {
        if (!isSubmitting) {
            // Ошибка с прошлой сессии не должна дожить до следующего открытия
            setError(null);
            onClose();
        }
    }, [isSubmitting, onClose]);
    // Обработка клавиши Escape
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen && !isSubmitting) {
                handleClose();
            }
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, isSubmitting, handleClose]);
    return (_jsx(Dialog, { open: isOpen, onOpenChange: (open) => !open && handleClose(), children: _jsxs(DialogContent, { className: "sm:max-w-[425px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: initialData ? 'Редактировать группу' : 'Создать группу' }), _jsx(DialogDescription, { className: "sr-only", children: initialData
                                ? 'Форма редактирования группы'
                                : 'Форма создания новой группы' })] }), error && (_jsx("div", { className: "bg-destructive/15 text-destructive text-sm p-3 rounded-md", role: "alert", children: error })), _jsx(FormProvider, { ...methods, children: _jsxs("form", { onSubmit: handleSubmit(onSubmit), className: "space-y-4 py-4", children: [_jsx(FormInput, { name: "name", label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435", placeholder: "\u041D\u0430\u043F\u0440\u0438\u043C\u0435\u0440: 'Must Watch', 'Anime 2024'", required: true, autoFocus: true, disabled: isSubmitting }), _jsx(Controller, { name: "parentId", control: methods.control, render: ({ field }) => (_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "parentId", children: "\u0420\u043E\u0434\u0438\u0442\u0435\u043B\u044C\u0441\u043A\u0430\u044F \u043F\u0430\u043F\u043A\u0430" }), _jsxs(Select, { value: field.value == null
                                                ? ROOT_PARENT_VALUE
                                                : String(field.value), onValueChange: (value) => field.onChange(value === ROOT_PARENT_VALUE ? null : Number(value)), disabled: isSubmitting, children: [_jsx(SelectTrigger, { id: "parentId", className: "w-full", children: _jsx(SelectValue, { placeholder: "\u0411\u0435\u0437 \u0440\u043E\u0434\u0438\u0442\u0435\u043B\u044C\u0441\u043A\u043E\u0439 \u043F\u0430\u043F\u043A\u0438" }) }), _jsx(SelectContent, { children: parentOptions.map((option) => (_jsx(SelectItem, { value: option.id == null
                                                            ? ROOT_PARENT_VALUE
                                                            : String(option.id), disabled: option.disabled, children: _jsx("span", { style: {
                                                                paddingLeft: option.id == null
                                                                    ? 0
                                                                    : `${(option.depth - 1) * 16}px`,
                                                            }, children: option.name }) }, option.id ?? ROOT_PARENT_VALUE))) })] }), _jsx("p", { className: "text-sm text-muted-foreground", children: "\u0413\u0434\u0435 \u0431\u0443\u0434\u0435\u0442 \u043D\u0430\u0445\u043E\u0434\u0438\u0442\u044C\u0441\u044F \u043F\u0430\u043F\u043A\u0430" })] })) }), _jsxs(DialogFooter, { children: [_jsx(Button, { type: "button", variant: "outline", onClick: handleClose, disabled: isSubmitting, children: "\u041E\u0442\u043C\u0435\u043D\u0430" }), _jsxs(Button, { type: "submit", disabled: isSubmitting, children: [isSubmitting && (_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" })), isSubmitting
                                                ? 'Сохранение...'
                                                : initialData
                                                    ? 'Сохранить'
                                                    : 'Создать'] })] })] }) })] }) }));
}
