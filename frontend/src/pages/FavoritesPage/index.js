import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Star, Plus, Pin, Trash2 } from 'lucide-react';
import { toast } from '@/utils/app-toast';
import { useNavigate } from 'react-router-dom';
import { Sidebar, HomeHeader } from '@/components/HomePage';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/authStore';
import { useGroupManagement } from '@/hooks/useGroupManagement';
import AddMediaModal from '@/components/AddMediaModal';
import CreateGroupModal from '@/components/CreateGroupModal';
import { libraryApi } from '@/api/library';
import { AICard } from '@/components/recommendations/AICard';
import { aiCardToAddMediaInitial } from '@/components/recommendations/aiCardMapping';
const parseMaybeGenres = (raw) => {
    if (!raw)
        return [];
    if (Array.isArray(raw))
        return raw.filter((g) => typeof g === 'string');
    if (typeof raw !== 'string')
        return [];
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed))
            return parsed.filter((g) => typeof g === 'string');
    }
    catch {
        // not JSON — comma-split
    }
    return raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
};
const savedRecToAICard = (r) => ({
    title: r.title,
    originalTitle: r.originalTitle ?? undefined,
    type: r.type,
    year: r.year ?? undefined,
    genres: parseMaybeGenres(r.genres),
    whyRecommended: r.whyRecommended,
    estimatedRating: r.estimatedRating ?? undefined,
    releasedRecently: r.releasedRecently ?? undefined,
    posterUrl: r.posterUrl ?? undefined,
    notInLibrary: true,
});
export default function FavoritesPage() {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [favRecs, setFavRecs] = useState([]);
    const [favMedia, setFavMedia] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addModalInitialData, setAddModalInitialData] = useState(undefined);
    const [addingRecId, setAddingRecId] = useState(null);
    const [selectedGroupId, setSelectedGroupId] = useState('all');
    const { groupStats, loadGroups, deleteGroup, isGroupModalOpen, editingGroup, openCreateGroupModal, openEditGroupModal, closeGroupModal, targetParentId, } = useGroupManagement(selectedGroupId, setSelectedGroupId);
    const refresh = async () => {
        setLoading(true);
        try {
            const [recs, media] = await Promise.all([
                libraryApi.listSavedRecommendations('favorited'),
                libraryApi.listFavoriteMedia(),
            ]);
            setFavRecs(recs);
            setFavMedia(media);
        }
        catch (err) {
            toast.error(err instanceof Error ? err.message : 'Ошибка загрузки');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        void refresh();
    }, []);
    const handleSelectGroup = (id) => {
        navigate('/', { state: { groupId: id } });
    };
    const handleAddRecToLibrary = (rec) => {
        const initial = aiCardToAddMediaInitial(savedRecToAICard(rec));
        setAddModalInitialData(initial);
        setAddingRecId(rec.id);
        setIsAddModalOpen(true);
    };
    const handleAddRecSuccess = async () => {
        if (addingRecId !== null) {
            try {
                await libraryApi.removeSavedRecommendation(addingRecId);
                setFavRecs((prev) => prev.filter((r) => r.id !== addingRecId));
            }
            catch {
                toast.error('Запись добавлена в библиотеку, но убрать её из «Избранного» не удалось');
            }
            setAddingRecId(null);
        }
        toast.success('Название добавлено в библиотеку');
    };
    const handleMoveRecToConsider = async (rec) => {
        try {
            await libraryApi.updateSavedRecommendationStatus(rec.id, 'considering');
            setFavRecs((prev) => prev.filter((r) => r.id !== rec.id));
            toast.success('Перемещено в «Подумаю»');
        }
        catch (err) {
            toast.error(err instanceof Error ? err.message : 'Не удалось');
        }
    };
    const handleRemoveRec = async (rec) => {
        try {
            await libraryApi.removeSavedRecommendation(rec.id);
            setFavRecs((prev) => prev.filter((r) => r.id !== rec.id));
            toast.success('Убрано');
        }
        catch (err) {
            toast.error(err instanceof Error ? err.message : 'Не удалось');
        }
    };
    const handleUnfavoriteMedia = async (m) => {
        try {
            await libraryApi.removeMediaFavorite(m.id);
            setFavMedia((prev) => prev.filter((x) => x.id !== m.id));
            toast.success('Убрано из избранного');
        }
        catch (err) {
            toast.error(err instanceof Error ? err.message : 'Не удалось');
        }
    };
    const totalCount = favRecs.length + favMedia.length;
    return (_jsxs("div", { className: "flex h-screen w-full bg-background overflow-hidden font-sans", children: [_jsx(Sidebar, { groupStats: groupStats || { groups: [], ungrouped: 0 }, selectedGroupId: selectedGroupId, onSelectGroup: handleSelectGroup, onCreateGroup: openCreateGroupModal, onEditGroup: openEditGroupModal, onDeleteGroup: deleteGroup }), _jsxs("main", { className: "flex-1 flex flex-col h-full min-w-0", children: [_jsx(HomeHeader, { title: "\u0418\u0437\u0431\u0440\u0430\u043D\u043D\u043E\u0435", username: user?.username, onAddMedia: () => {
                            setAddModalInitialData(undefined);
                            setIsAddModalOpen(true);
                        }, onNavigateToProfile: () => navigate('/profile'), onNavigateToSettings: () => navigate('/settings'), onLogout: logout }), _jsx("div", { className: "flex-1 overflow-hidden relative bg-muted/10", children: _jsx(ScrollArea, { className: "h-full w-full", children: _jsxs("div", { className: "w-full p-6 space-y-6 mx-4 my-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "p-2.5 rounded-xl bg-gradient-to-br from-rose-500/20 to-orange-500/20", children: _jsx(Star, { className: "w-7 h-7 text-rose-500 fill-rose-500/40" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent", children: "\u0418\u0437\u0431\u0440\u0430\u043D\u043D\u043E\u0435" }), _jsxs("p", { className: "text-muted-foreground text-sm", children: ["\u041A\u0430\u0440\u0442\u043E\u0447\u043A\u0438 \u0437\u0430\u043F\u0438\u0441\u0435\u0439 \u0438 \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u0438, \u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u0442\u044B \u0432\u044B\u0434\u0435\u043B\u0438\u043B", ' ', totalCount > 0 && `(${totalCount})`] })] })] }), loading && totalCount === 0 && (_jsx("div", { className: "text-center py-16 text-muted-foreground", children: "\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u044E..." })), !loading && totalCount === 0 && (_jsxs("div", { className: "text-center py-20 text-muted-foreground border border-dashed rounded-2xl bg-gradient-to-br from-rose-500/5 to-orange-500/5", children: [_jsx(Star, { className: "w-12 h-12 mx-auto mb-4 text-rose-500/40" }), _jsx("p", { className: "font-medium text-lg text-foreground", children: "\u0420\u0430\u0437\u0434\u0435\u043B \u043F\u043E\u043A\u0430 \u043F\u0443\u0441\u0442" }), _jsx("p", { className: "max-w-md mx-auto mt-2 text-sm", children: "\u0416\u043C\u0438 \u2B50 \u043D\u0430 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0430\u0445 \u0432 \u0420\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u044F\u0445 \u0438\u043B\u0438 \u043D\u0430 \u0437\u0430\u043F\u0438\u0441\u044F\u0445 \u0432 \u0441\u0432\u043E\u0435\u0439 \u0431\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0435 \u2014 \u043E\u043D\u0438 \u043F\u043E\u043F\u0430\u0434\u0443\u0442 \u0441\u044E\u0434\u0430." }), _jsx(Button, { className: "mt-4", variant: "outline", onClick: () => navigate('/'), children: "\u041A \u043C\u043E\u0435\u0439 \u0431\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0435" })] })), totalCount > 0 && (_jsxs(Tabs, { defaultValue: "all", children: [_jsxs(TabsList, { children: [_jsxs(TabsTrigger, { value: "all", children: ["\u0412\u0441\u0435 (", totalCount, ")"] }), _jsxs(TabsTrigger, { value: "library", children: ["\u0411\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0430 (", favMedia.length, ")"] }), _jsxs(TabsTrigger, { value: "recommendations", children: ["\u0420\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u0438 (", favRecs.length, ")"] })] }), _jsx(TabsContent, { value: "all", className: "mt-4", children: _jsx(FavoritesGrid, { mediaItems: favMedia, recItems: favRecs, onUnfavoriteMedia: handleUnfavoriteMedia, onAddRec: handleAddRecToLibrary, onMoveRecToConsider: handleMoveRecToConsider, onRemoveRec: handleRemoveRec }) }), _jsx(TabsContent, { value: "library", className: "mt-4", children: _jsx(FavoritesGrid, { mediaItems: favMedia, recItems: [], onUnfavoriteMedia: handleUnfavoriteMedia, onAddRec: handleAddRecToLibrary, onMoveRecToConsider: handleMoveRecToConsider, onRemoveRec: handleRemoveRec }) }), _jsx(TabsContent, { value: "recommendations", className: "mt-4", children: _jsx(FavoritesGrid, { mediaItems: [], recItems: favRecs, onUnfavoriteMedia: handleUnfavoriteMedia, onAddRec: handleAddRecToLibrary, onMoveRecToConsider: handleMoveRecToConsider, onRemoveRec: handleRemoveRec }) })] }))] }) }) })] }), _jsx(AddMediaModal, { isOpen: isAddModalOpen, onClose: () => {
                    setIsAddModalOpen(false);
                    setAddModalInitialData(undefined);
                    setAddingRecId(null);
                }, onSuccess: () => void handleAddRecSuccess(), initialData: addModalInitialData }), _jsx(CreateGroupModal, { isOpen: isGroupModalOpen, onClose: closeGroupModal, onSuccess: loadGroups, initialData: editingGroup, parentId: targetParentId })] }));
}
function FavoritesGrid({ mediaItems, recItems, onUnfavoriteMedia, onAddRec, onMoveRecToConsider, onRemoveRec, }) {
    const navigate = useNavigate();
    if (mediaItems.length === 0 && recItems.length === 0) {
        return (_jsx("div", { className: "text-center py-16 text-muted-foreground text-sm", children: "\u0417\u0434\u0435\u0441\u044C \u043F\u043E\u043A\u0430 \u043F\u0443\u0441\u0442\u043E" }));
    }
    return (_jsxs("div", { className: "grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4", children: [mediaItems.map((m) => (_jsxs("div", { className: "relative group rounded-xl overflow-hidden border bg-card/80 backdrop-blur-sm shadow-md hover:shadow-2xl transition-all hover:-translate-y-1", children: [_jsxs("button", { type: "button", onClick: () => navigate(`/media/${m.id}`), className: "block w-full text-left", children: [_jsxs("div", { className: "relative aspect-[2/3] bg-muted", children: [m.image ? (_jsx("img", { src: m.image, alt: m.title, loading: "lazy", className: "object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" })) : (_jsx("div", { className: "flex items-center justify-center w-full h-full text-muted-foreground/40", children: "\u041D\u0435\u0442 \u043E\u0431\u043B\u043E\u0436\u043A\u0438" })), _jsx("div", { className: "absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/70 text-white backdrop-blur-md border border-white/10", children: m.category ?? 'Запись' }), m.rating > 0 && (_jsxs("div", { className: "absolute top-2 right-2 px-2 py-0.5 rounded-full text-[11px] font-bold bg-black/70 text-white backdrop-blur-md", children: ["\u2605 ", m.rating] }))] }), _jsxs("div", { className: "p-3 space-y-1", children: [_jsx("div", { className: "font-semibold leading-tight line-clamp-2", children: m.title }), (() => {
                                        const gs = parseMaybeGenres(m.genres);
                                        return gs.length > 0 ? (_jsx("div", { className: "text-[10px] text-muted-foreground line-clamp-1", children: gs.slice(0, 3).join(' · ') })) : null;
                                    })()] })] }), _jsx("button", { type: "button", onClick: () => onUnfavoriteMedia(m), title: "\u0423\u0431\u0440\u0430\u0442\u044C \u0438\u0437 \u0438\u0437\u0431\u0440\u0430\u043D\u043D\u043E\u0433\u043E", className: "absolute bottom-2 right-2 p-2 rounded-full bg-rose-500/90 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity", children: _jsx(Star, { className: "w-3.5 h-3.5 fill-current" }) })] }, `media-${m.id}`))), recItems.map((rec, idx) => (_jsxs("div", { className: "relative group", children: [_jsx(AICard, { card: savedRecToAICard(rec), index: idx, onAdd: () => onAddRec(rec) }), _jsxs("div", { className: "absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10", children: [_jsx("button", { type: "button", onClick: () => onMoveRecToConsider(rec), title: "\u0412 \u00AB\u041F\u043E\u0434\u0443\u043C\u0430\u044E\u00BB", className: "p-2 rounded-full bg-black/70 backdrop-blur-md text-white shadow-lg hover:bg-indigo-500/80", children: _jsx(Pin, { className: "w-3.5 h-3.5" }) }), _jsx("button", { type: "button", onClick: () => onAddRec(rec), title: "\u0412 \u0431\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0443", className: "p-2 rounded-full bg-black/70 backdrop-blur-md text-white shadow-lg hover:bg-emerald-500/80", children: _jsx(Plus, { className: "w-3.5 h-3.5" }) }), _jsx("button", { type: "button", onClick: () => onRemoveRec(rec), title: "\u0423\u0431\u0440\u0430\u0442\u044C", className: "p-2 rounded-full bg-black/70 backdrop-blur-md text-white shadow-lg hover:bg-rose-500/80", children: _jsx(Trash2, { className: "w-3.5 h-3.5" }) })] })] }, `rec-${rec.id}`)))] }));
}
