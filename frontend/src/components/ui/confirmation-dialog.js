import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
export function ConfirmationDialog({ isOpen, onClose, onConfirm, title, description, confirmText = "Подтвердить", cancelText = "Отмена", variant = "default", }) {
    return (_jsx(Dialog, { open: isOpen, onOpenChange: onClose, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: title }), _jsx(DialogDescription, { children: description })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "ghost", onClick: onClose, children: cancelText }), _jsx(Button, { variant: variant, onClick: () => {
                                onConfirm();
                                onClose();
                            }, children: confirmText })] })] }) }));
}
