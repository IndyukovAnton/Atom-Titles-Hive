import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Pin, Star, Plus, Trash2 } from 'lucide-react';
import { toast } from '@/utils/app-toast';
import { useNavigate } from 'react-router-dom';
import { Sidebar, HomeHeader } from '@/components/HomePage';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
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
        // fallthrough
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
export default function ConsiderationsPage() {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addModalInitialData, setAddModalInitialData] = useState(undefined);
    const [addingRecId, setAddingRecId] = useState(null);
    const [selectedGroupId, setSelectedGroupId] = useState('all');
    const { groupStats, loadGroups, deleteGroup, isGroupModalOpen, editingGroup, openCreateGroupModal, openEditGroupModal, closeGroupModal, targetParentId, } = useGroupManagement(selectedGroupId, setSelectedGroupId);
    const refresh = async () => {
        setLoading(true);
        try {
            const rows = await libraryApi.listConsiderations();
            setItems(rows);
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
    const handleAddToLibrary = (rec) => {
        const initial = aiCardToAddMediaInitial(savedRecToAICard(rec));
        setAddModalInitialData(initial);
        setAddingRecId(rec.id);
        setIsAddModalOpen(true);
    };
    const handleAddSuccess = async () => {
        if (addingRecId !== null) {
            try {
                await libraryApi.removeSavedRecommendation(addingRecId);
                setItems((prev) => prev.filter((r) => r.id !== addingRecId));
            }
            catch {
                toast.error('Запись добавлена в библиотеку, но убрать её из «Подумаю» не удалось');
            }
            setAddingRecId(null);
        }
        toast.success('Название добавлено в библиотеку');
    };
    const handleMoveToFavorites = async (rec) => {
        try {
            await libraryApi.updateSavedRecommendationStatus(rec.id, 'favorited');
            setItems((prev) => prev.filter((r) => r.id !== rec.id));
            toast.success('Перемещено в «Избранное»');
        }
        catch (err) {
            toast.error(err instanceof Error ? err.message : 'Не удалось');
        }
    };
    const handleRemove = async (rec) => {
        try {
            await libraryApi.removeSavedRecommendation(rec.id);
            setItems((prev) => prev.filter((r) => r.id !== rec.id));
            toast.success('Убрано');
        }
        catch (err) {
            toast.error(err instanceof Error ? err.message : 'Не удалось');
        }
    };
    return (_jsxs("div", { className: "flex h-screen w-full bg-background overflow-hidden font-sans", children: [_jsx(Sidebar, { groupStats: groupStats || { groups: [], ungrouped: 0 }, selectedGroupId: selectedGroupId, onSelectGroup: handleSelectGroup, onCreateGroup: openCreateGroupModal, onEditGroup: openEditGroupModal, onDeleteGroup: deleteGroup }), _jsxs("main", { className: "flex-1 flex flex-col h-full min-w-0", children: [_jsx(HomeHeader, { title: "\u041F\u043E\u0434\u0443\u043C\u0430\u044E", username: user?.username, onAddMedia: () => {
                            setAddModalInitialData(undefined);
                            setIsAddModalOpen(true);
                        }, onNavigateToProfile: () => navigate('/profile'), onNavigateToSettings: () => navigate('/settings'), onLogout: logout }), _jsx("div", { className: "flex-1 overflow-hidden relative bg-muted/10", children: _jsx(ScrollArea, { className: "h-full w-full", children: _jsxs("div", { className: "w-full p-6 space-y-6 mx-4 my-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20", children: _jsx(Pin, { className: "w-7 h-7 text-indigo-500" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent", children: "\u041F\u043E\u0434\u0443\u043C\u0430\u044E" }), _jsx("p", { className: "text-muted-foreground text-sm", children: "\u0420\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u0438, \u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u043E\u0442\u043B\u043E\u0436\u0435\u043D\u044B \u043D\u0430 \u00AB\u043F\u043E\u0442\u043E\u043C\u00BB" })] })] }), loading && items.length === 0 && (_jsx("div", { className: "text-center py-16 text-muted-foreground", children: "\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u044E..." })), !loading && items.length === 0 && (_jsxs("div", { className: "text-center py-20 text-muted-foreground border border-dashed rounded-2xl bg-gradient-to-br from-indigo-500/5 to-violet-500/5", children: [_jsx(Pin, { className: "w-12 h-12 mx-auto mb-4 text-indigo-500/40" }), _jsx("p", { className: "font-medium text-lg text-foreground", children: "\u0420\u0430\u0437\u0434\u0435\u043B \u043F\u043E\u043A\u0430 \u043F\u0443\u0441\u0442" }), _jsx("p", { className: "max-w-md mx-auto mt-2 text-sm", children: "\u041D\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0447\u043A\u0435 \u0420\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u0438 \u0436\u043C\u0438 \uD83D\uDCCC \u043D\u0430 \u043B\u044E\u0431\u043E\u0439 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0435 \u2014 \u043E\u043D\u0430 \u043F\u043E\u043F\u0430\u0434\u0451\u0442 \u0441\u044E\u0434\u0430." }), _jsx(Button, { className: "mt-4", variant: "outline", onClick: () => navigate('/recommendations'), children: "\u041A \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u044F\u043C" })] })), items.length > 0 && (_jsx("div", { className: "grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4", children: items.map((rec, idx) => (_jsxs("div", { className: "relative group", children: [_jsx(AICard, { card: savedRecToAICard(rec), index: idx, onAdd: () => handleAddToLibrary(rec) }), _jsxs("div", { className: "absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10", children: [_jsx("button", { type: "button", onClick: () => void handleMoveToFavorites(rec), title: "\u0412 \u00AB\u0418\u0437\u0431\u0440\u0430\u043D\u043D\u043E\u0435\u00BB", className: "p-2 rounded-full bg-black/70 backdrop-blur-md text-white shadow-lg hover:bg-rose-500/80", children: _jsx(Star, { className: "w-3.5 h-3.5" }) }), _jsx("button", { type: "button", onClick: () => handleAddToLibrary(rec), title: "\u0412 \u0431\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0443", className: "p-2 rounded-full bg-black/70 backdrop-blur-md text-white shadow-lg hover:bg-emerald-500/80", children: _jsx(Plus, { className: "w-3.5 h-3.5" }) }), _jsx("button", { type: "button", onClick: () => void handleRemove(rec), title: "\u0423\u0431\u0440\u0430\u0442\u044C", className: "p-2 rounded-full bg-black/70 backdrop-blur-md text-white shadow-lg hover:bg-rose-500/80", children: _jsx(Trash2, { className: "w-3.5 h-3.5" }) })] })] }, rec.id))) }))] }) }) })] }), _jsx(AddMediaModal, { isOpen: isAddModalOpen, onClose: () => {
                    setIsAddModalOpen(false);
                    setAddModalInitialData(undefined);
                    setAddingRecId(null);
                }, onSuccess: () => void handleAddSuccess(), initialData: addModalInitialData }), _jsx(CreateGroupModal, { isOpen: isGroupModalOpen, onClose: closeGroupModal, onSuccess: loadGroups, initialData: editingGroup, parentId: targetParentId })] }));
}
