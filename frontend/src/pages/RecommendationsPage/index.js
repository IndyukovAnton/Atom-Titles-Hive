import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Sparkles, Library, TrendingUp, Brain } from 'lucide-react';
import { toast } from '@/utils/app-toast';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { libraryApi } from '@/api/library';
import { SAVED_RECS_QUERY_KEY } from '@/hooks/useSavedRecommendations';
import { Tabs, TabsContent, TabsList, TabsTrigger, } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sidebar, HomeHeader } from '@/components/HomePage';
import { useAuthStore } from '@/store/authStore';
import { useGroupManagement } from '@/hooks/useGroupManagement';
import AddMediaModal from '@/components/AddMediaModal';
import CreateGroupModal from '@/components/CreateGroupModal';
import { TopRatedSection } from './TopRatedSection';
import { GenresSection } from './GenresSection';
import { AiAssistantSection } from './AiAssistantSection';
export default function RecommendationsPage() {
    const [activeTab, setActiveTab] = useState('top-rated');
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addModalInitialData, setAddModalInitialData] = useState(undefined);
    // Id закреплённой (📌/⭐) рекомендации, которую сейчас добавляют в библиотеку.
    const [consumingSavedRecId, setConsumingSavedRecId] = useState(null);
    const [selectedGroupId, setSelectedGroupId] = useState('all');
    const { groupStats, loadGroups, deleteGroup, isGroupModalOpen, editingGroup, openCreateGroupModal, openEditGroupModal, closeGroupModal, targetParentId, } = useGroupManagement(selectedGroupId, setSelectedGroupId);
    const handleSelectGroup = (id) => {
        navigate('/', { state: { groupId: id } });
    };
    const handleAddRecommendation = (item, savedRecId) => {
        setAddModalInitialData({
            title: item.title,
            description: item.description,
            image: item.image,
            rating: item.rating,
            genres: item.genres,
            category: item.category,
            source: item.source,
        });
        setConsumingSavedRecId(savedRecId ?? null);
        setIsAddModalOpen(true);
    };
    const handleCloseAddModal = () => {
        setIsAddModalOpen(false);
        setAddModalInitialData(undefined);
        setConsumingSavedRecId(null);
    };
    const handleAddSuccess = async () => {
        if (consumingSavedRecId !== null) {
            try {
                await libraryApi.removeSavedRecommendation(consumingSavedRecId);
                await queryClient.invalidateQueries({
                    queryKey: SAVED_RECS_QUERY_KEY,
                });
            }
            catch {
                toast.error('Запись добавлена, но закреплённая рекомендация осталась — уберите её вручную');
            }
            setConsumingSavedRecId(null);
        }
        toast.success('Название добавлено в библиотеку');
    };
    return (_jsxs("div", { className: "flex h-screen w-full bg-background overflow-hidden font-sans", children: [_jsx(Sidebar, { groupStats: groupStats || { groups: [], ungrouped: 0 }, selectedGroupId: selectedGroupId, onSelectGroup: handleSelectGroup, onCreateGroup: openCreateGroupModal, onEditGroup: openEditGroupModal, onDeleteGroup: deleteGroup }), _jsxs("main", { className: "flex-1 flex flex-col h-full min-w-0", children: [_jsx(HomeHeader, { title: "\u0420\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u0438", username: user?.username, onAddMedia: () => {
                            setAddModalInitialData(undefined);
                            setIsAddModalOpen(true);
                        }, onNavigateToProfile: () => navigate('/profile'), onNavigateToSettings: () => navigate('/settings'), onLogout: logout }), _jsx("div", { className: "flex-1 overflow-hidden relative bg-muted/10", children: _jsx(ScrollArea, { className: "h-full w-full", children: _jsxs("div", { className: "w-full max-w-[1600px] mx-auto p-6 space-y-8 animate-in fade-in duration-500 relative z-10 my-4", children: [_jsxs("div", { className: "flex flex-col gap-3", children: [_jsxs("h1", { className: "text-3xl font-bold tracking-tight text-foreground flex items-center gap-3", children: [_jsx("div", { className: "p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20", children: _jsx(Sparkles, { className: "w-7 h-7 text-amber-500" }) }), _jsx("span", { className: "bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent", children: "\u0412\u0430\u0448\u0430 \u043B\u0435\u043D\u0442\u0430 \u043E\u0442\u043A\u0440\u044B\u0442\u0438\u0439" })] }), _jsx("p", { className: "text-muted-foreground ml-14", children: "\u0418\u0418-\u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u0438 \u043D\u0430 \u043E\u0441\u043D\u043E\u0432\u0435 \u0432\u0430\u0448\u0435\u0433\u043E \u0443\u043D\u0438\u043A\u0430\u043B\u044C\u043D\u043E\u0433\u043E \u0432\u043A\u0443\u0441\u0430." })] }), _jsxs(Tabs, { defaultValue: "top-rated", value: activeTab, onValueChange: setActiveTab, className: "w-full", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-3 lg:w-[400px]", children: [_jsxs(TabsTrigger, { value: "top-rated", className: "flex items-center gap-2", children: [_jsx(TrendingUp, { className: "w-4 h-4" }), "\u0422\u043E\u043F \u043E\u0446\u0435\u043D\u043E\u043A"] }), _jsxs(TabsTrigger, { value: "genres", className: "flex items-center gap-2", children: [_jsx(Library, { className: "w-4 h-4" }), "\u041F\u043E \u0436\u0430\u043D\u0440\u0430\u043C"] }), _jsxs(TabsTrigger, { value: "ai", className: "flex items-center gap-2", children: [_jsx(Brain, { className: "w-4 h-4" }), "AI-\u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442"] })] }), _jsxs("div", { className: "mt-6 min-h-[400px]", children: [_jsx(TabsContent, { value: "top-rated", className: "mt-0", children: _jsx(TopRatedSection, {}) }), _jsx(TabsContent, { value: "genres", className: "mt-0", children: _jsx(GenresSection, { onAdd: handleAddRecommendation }) }), _jsx(TabsContent, { value: "ai", className: "mt-0", children: _jsx(AiAssistantSection, { onAdd: handleAddRecommendation }) })] })] })] }) }) })] }), _jsx(AddMediaModal, { isOpen: isAddModalOpen, onClose: handleCloseAddModal, onSuccess: () => void handleAddSuccess(), initialData: addModalInitialData }), _jsx(CreateGroupModal, { isOpen: isGroupModalOpen, onClose: closeGroupModal, onSuccess: loadGroups, initialData: editingGroup, parentId: targetParentId })] }));
}
