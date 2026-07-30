import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Hash, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { TooltipProvider } from '@/components/ui/tooltip';
import AddMediaModal from '@/components/AddMediaModal';
import PhotoViewer from '@/components/PhotoViewer';
import { AiSourceBadge } from '@/components/AiSourceBadge';
import { localizeCategory, localizeGenre, localizeTag, } from '@/utils/localization';
import { useMediaDetail } from './useMediaDetail';
import { getCategoryIcon } from './mediaHelpers';
import { MediaDetailPoster } from './MediaDetailPoster';
import { MediaGallery } from './MediaGallery';
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.03, delayChildren: 0.05 },
    },
};
const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};
export default function MediaDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(null);
    const { media, isLoading, error, refresh, uploadFile, deleteFile, deleteRecord, } = useMediaDetail(id);
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-background", children: _jsxs("div", { className: "flex flex-col items-center gap-4", children: [_jsxs("div", { className: "relative", children: [_jsx("div", { className: "w-16 h-16 border-4 border-muted rounded-full" }), _jsx("div", { className: "absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" })] }), _jsx("p", { className: "text-muted-foreground animate-pulse", children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430..." })] }) }));
    }
    if (error || !media) {
        return (_jsxs("div", { className: "min-h-screen flex flex-col items-center justify-center gap-6 bg-background", children: [_jsx("div", { className: "p-6 rounded-full bg-destructive/10", children: _jsx(Trash2, { className: "h-12 w-12 text-destructive" }) }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-xl font-semibold text-foreground mb-2", children: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438" }), _jsx("p", { className: "text-muted-foreground", children: error || 'Запись не найдена' })] }), _jsxs(Button, { onClick: () => navigate('/'), children: [_jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }), " \u041D\u0430 \u0433\u043B\u0430\u0432\u043D\u0443\u044E"] })] }));
    }
    return (_jsx(TooltipProvider, { children: _jsxs("div", { className: "min-h-screen bg-background relative overflow-hidden", children: [_jsxs("div", { className: "absolute inset-0 pointer-events-none", children: [_jsx("div", { className: "absolute -top-1/2 -right-1/4 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl" }), _jsx("div", { className: "absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-accent-purple/5 blur-3xl" })] }), _jsx("header", { className: "sticky top-0 z-40 border-b bg-background/60 backdrop-blur-xl", children: _jsx("div", { className: "container max-w-7xl mx-auto px-4 h-16 flex items-center justify-between", children: _jsxs(Button, { variant: "ghost", size: "sm", onClick: () => navigate(-1), className: "gap-2 hover:bg-primary/10 transition-colors", children: [_jsx(ArrowLeft, { className: "h-4 w-4" }), _jsx("span", { className: "hidden sm:inline", children: "\u041D\u0430\u0437\u0430\u0434" })] }) }) }), _jsx("main", { className: "container max-w-7xl mx-auto px-4 py-8 relative z-10", children: _jsxs(motion.div, { variants: containerVariants, initial: "hidden", animate: "visible", className: "grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8 lg:gap-12", children: [_jsx(MediaDetailPoster, { media: media, onOpenLightbox: () => setLightboxIndex(0), onEdit: () => setIsEditOpen(true), onDelete: deleteRecord }), _jsxs(motion.div, { variants: itemVariants, className: "space-y-6", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2 mb-4 lg:hidden select-none", children: [media.category && (_jsxs(Badge, { variant: "secondary", className: "gap-1.5", children: [getCategoryIcon(media.category), localizeCategory(media.category)] })), media.startDate && (_jsx(Badge, { variant: "outline", children: new Date(media.startDate).getFullYear() }))] }), _jsxs("div", { className: "flex flex-wrap items-center gap-3 mb-4", children: [_jsx("h1", { className: "text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight", children: media.title }), media.source === 'ai' && (_jsx(AiSourceBadge, { className: "px-2.5 py-1.5 text-xs" }))] }), media.genres && media.genres.length > 0 && (_jsx("div", { className: "flex flex-wrap gap-2 select-none", children: media.genres.map((genre) => (_jsx(Badge, { variant: "outline", className: "px-3 py-1", children: localizeGenre(genre) }, genre))) }))] }), _jsx(Separator, {}), _jsxs("div", { className: "space-y-3", children: [_jsx("h2", { className: "text-sm font-semibold text-muted-foreground uppercase tracking-wider select-none", children: "\u041E \u0442\u0430\u0439\u0442\u043B\u0435" }), _jsx("p", { className: "text-base leading-relaxed text-foreground/90 whitespace-pre-line", children: media.description || (_jsx("span", { className: "text-muted-foreground italic", children: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u0435\u0442..." })) })] }), media.tags && media.tags.length > 0 && (_jsxs("div", { className: "space-y-3", children: [_jsxs("h2", { className: "text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 select-none", children: [_jsx(Hash, { className: "h-4 w-4" }), " \u0422\u0435\u0433\u0438"] }), _jsx("div", { className: "flex flex-wrap gap-2 select-none", children: media.tags.map((tag) => (_jsxs("span", { className: "px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium", children: ["#", localizeTag(tag)] }, tag))) })] })), _jsx(Separator, {}), _jsx(MediaGallery, { media: media, onUpload: uploadFile, onDeleteFile: deleteFile, onOpenLightbox: setLightboxIndex })] })] }) }), _jsx(AddMediaModal, { isOpen: isEditOpen, onClose: () => setIsEditOpen(false), onSuccess: refresh, initialData: media }), _jsx(PhotoViewer, { files: [
                        ...(media.image
                            ? [{ id: -1, url: media.image, type: 'image' }]
                            : []),
                        ...(media.files || []),
                    ], currentIndex: lightboxIndex, onClose: () => setLightboxIndex(null), onIndexChange: setLightboxIndex })] }) }));
}
