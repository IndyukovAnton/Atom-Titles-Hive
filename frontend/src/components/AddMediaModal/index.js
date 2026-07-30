import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { FormProvider } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Image as ImageIcon, Info, ListChecks, Loader2, X, } from 'lucide-react';
import CreateGroupModal from '@/components/CreateGroupModal';
import { useMediaForm } from '@/hooks/useMediaForm';
import { InfoStep } from './InfoStep';
import { DetailsStep } from './DetailsStep';
import { MediaStep } from './MediaStep';
import { PreviewCard } from './PreviewCard';
const STEP_DESCRIPTIONS = {
    info: 'Название, категория и оценка',
    details: 'Жанры, теги и описание',
    media: 'Обложка',
};
export default function AddMediaModal({ isOpen, onClose, onSuccess, initialData, }) {
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
    // Предзаполненная форма без id (напр. из рекомендаций) — это создание, а не редактирование
    const isEditMode = Boolean(initialData?.id);
    const { methods, handleSubmit, isSubmitting, activeStep, setActiveStep, error, coverMode, setCoverMode, stepProgress, currentImage, dateLabels, groupOptions, loadGroups, handleFileUpload, onSubmit, validateAndNext, } = useMediaForm({ isOpen, initialData, onSuccess, onClose });
    const goBack = () => setActiveStep(activeStep === 'media' ? 'details' : 'info');
    const goNext = () => validateAndNext(activeStep === 'info' ? 'details' : 'media');
    // В режиме редактирования сохранение отделено от навигации: «Сохранить»
    // закреплена слева и доступна на любом шаге, «Далее» только переключает шаги.
    const showNextButton = isEditMode ? activeStep !== 'media' : activeStep === 'info';
    return (_jsxs(_Fragment, { children: [_jsx(Dialog, { open: isOpen, onOpenChange: (open) => !open && onClose(), children: _jsxs(DialogContent, { className: "sm:max-w-[780px] max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0", showCloseButton: false, children: [_jsx("div", { className: "absolute top-0 left-0 w-full h-1 bg-muted overflow-hidden", children: _jsx(Progress, { value: stepProgress, className: "h-full rounded-none" }) }), _jsx(DialogHeader, { className: "p-6 pb-4 border-b", children: _jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { className: "flex-1", children: [_jsx(DialogTitle, { className: "text-lg font-semibold", children: initialData?.id
                                                    ? 'Редактировать запись'
                                                    : 'Добавить новую запись' }), _jsx(DialogDescription, { className: "text-sm text-muted-foreground mt-1", children: STEP_DESCRIPTIONS[activeStep] })] }), _jsx(Button, { variant: "ghost", size: "icon", onClick: onClose, className: "shrink-0 cursor-pointer", children: _jsx(X, { className: "h-4 w-4" }) })] }) }), _jsx("div", { className: "px-6 py-3 border-b bg-muted/30", children: _jsxs("div", { className: "flex justify-center items-center gap-1", children: [_jsx(StepButton, { active: activeStep === 'info', onClick: () => setActiveStep('info'), icon: _jsx(Info, { className: "h-4 w-4" }), label: "\u0418\u043D\u0444\u043E" }), _jsx(ChevronRight, { className: "h-4 w-4 text-muted-foreground/50" }), _jsx(StepButton, { active: activeStep === 'details', onClick: () => setActiveStep('details'), icon: _jsx(ListChecks, { className: "h-4 w-4" }), label: "\u0414\u0435\u0442\u0430\u043B\u0438" }), _jsx(ChevronRight, { className: "h-4 w-4 text-muted-foreground/50" }), _jsx(StepButton, { active: activeStep === 'media', onClick: () => setActiveStep('media'), icon: _jsx(ImageIcon, { className: "h-4 w-4" }), label: "\u041C\u0435\u0434\u0438\u0430" })] }) }), _jsx(FormProvider, { ...methods, children: _jsxs("div", { className: "flex-1 grid md:grid-cols-[1fr_260px] gap-0 min-h-0", children: [_jsx(ScrollArea, { className: "px-6 py-4 min-h-0", children: _jsx("div", { className: "pb-4", children: _jsxs("form", { id: "add-media-form", onSubmit: handleSubmit(onSubmit), className: "space-y-6", children: [activeStep === 'info' && (_jsx(InfoStep, { isSubmitting: isSubmitting, groupOptions: groupOptions, onOpenCreateGroup: () => setIsCreateGroupOpen(true) })), activeStep === 'details' && (_jsx(DetailsStep, { isSubmitting: isSubmitting, dateLabels: dateLabels })), activeStep === 'media' && (_jsx(MediaStep, { isSubmitting: isSubmitting, coverMode: coverMode, setCoverMode: setCoverMode, currentImage: currentImage, error: error, handleFileUpload: handleFileUpload }))] }) }) }), _jsx("aside", { className: "hidden md:block border-l bg-muted/20 px-5 py-4 overflow-y-auto", children: _jsx(PreviewCard, {}) })] }) }), _jsxs("footer", { className: "p-4 flex items-center justify-between border-t", children: [_jsxs("div", { className: "flex items-center gap-2", children: [isEditMode ? (_jsx(SubmitButton, { isSubmitting: isSubmitting, label: "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C" })) : (activeStep !== 'info' && (_jsx(SubmitButton, { isSubmitting: isSubmitting, label: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C" }))), _jsx(Button, { type: "button", variant: "ghost", onClick: onClose, disabled: isSubmitting, className: "cursor-pointer", children: "\u041E\u0442\u043C\u0435\u043D\u0430" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [activeStep !== 'info' && (_jsxs(Button, { type: "button", variant: "ghost", onClick: goBack, className: "cursor-pointer", children: [_jsx(ChevronLeft, { className: "h-4 w-4 mr-1" }), "\u041D\u0430\u0437\u0430\u0434"] })), showNextButton && (_jsxs(Button, { type: "button", onClick: goNext, className: "cursor-pointer", children: ["\u0414\u0430\u043B\u0435\u0435", _jsx(ChevronRight, { className: "h-4 w-4 ml-1" })] }))] })] })] }) }), _jsx(CreateGroupModal, { isOpen: isCreateGroupOpen, onClose: () => setIsCreateGroupOpen(false), onSuccess: () => {
                    loadGroups();
                    setIsCreateGroupOpen(false);
                } })] }));
}
function SubmitButton({ isSubmitting, label, }) {
    return (_jsx(Button, { type: "submit", form: "add-media-form", disabled: isSubmitting, className: "min-w-[100px] cursor-pointer bg-success text-white hover:bg-success/90", children: isSubmitting ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "\u0421\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435..."] })) : (label) }));
}
function StepButton({ active, onClick, icon, label, }) {
    return (_jsxs("button", { type: "button", onClick: onClick, className: `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer ${active
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`, children: [icon, _jsx("span", { className: "text-sm font-medium", children: label })] }));
}
