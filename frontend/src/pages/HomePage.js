import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import AddMediaModal from '../components/AddMediaModal';
import CreateGroupModal from '../components/CreateGroupModal';
import { GuidedTour } from '../components/onboarding/GuidedTour';
import { Sidebar, MediaGrid, HomeHeader, SearchBar, FilterPanel } from '../components/HomePage';
import { GROUP_ROOT_DROPPABLE_ID } from '../components/HomePage/Sidebar';
import { ConfirmationDialog } from '../components/ui/confirmation-dialog';
import { useMediaData } from '../hooks/useMediaData';
import { useGroupManagement } from '../hooks/useGroupManagement';
import { useSearch } from '../hooks/useSearch';
import { useFilters } from '../hooks/useFilters';
import { ScrollArea } from "@/components/ui/scroll-area";
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, } from '@dnd-kit/core';
import { mediaApi } from '../api/media';
import { libraryApi } from '../api/library';
import { logger } from '@/utils/logger';
import { collectDescendantIds, isNoopMove, resolveGroupDrop, } from '@/utils/group-tree';
const INITIAL_GROUP_DRAG_STATE = {
    isGroupDragging: false,
    draggedGroupName: null,
    overId: null,
    position: null,
    forbidden: false,
};
/**
 * Позиция курсора относительно строки-цели: верхняя/нижняя четверть —
 * сортировка (before/after), середина — вложение (inside).
 */
function getDropPosition(event) {
    const { over, delta, activatorEvent } = event;
    if (!over)
        return 'inside';
    const pointerY = activatorEvent instanceof PointerEvent
        ? activatorEvent.clientY + delta.y
        : null;
    if (pointerY === null || over.rect.height === 0)
        return 'inside';
    const ratio = (pointerY - over.rect.top) / over.rect.height;
    if (ratio < 0.25)
        return 'before';
    if (ratio > 0.75)
        return 'after';
    return 'inside';
}
export default function HomePage() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [selectedGroupId, setSelectedGroupId] = useState(location.state?.groupId ?? 'all');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [favoriteIds, setFavoriteIds] = useState(new Set());
    useEffect(() => {
        let cancelled = false;
        libraryApi
            .listFavoriteMediaIds()
            .then((ids) => {
            if (!cancelled)
                setFavoriteIds(new Set(ids));
        })
            .catch(() => {
            // ignore — favorite indicator just won't be shown
        });
        return () => {
            cancelled = true;
        };
    }, []);
    const handleToggleFavorite = async (mediaId, next) => {
        // Optimistic update
        setFavoriteIds((prev) => {
            const updated = new Set(prev);
            if (next)
                updated.add(mediaId);
            else
                updated.delete(mediaId);
            return updated;
        });
        try {
            if (next) {
                await libraryApi.addMediaFavorite(mediaId);
            }
            else {
                await libraryApi.removeMediaFavorite(mediaId);
            }
        }
        catch (err) {
            // Revert on failure
            setFavoriteIds((prev) => {
                const reverted = new Set(prev);
                if (next)
                    reverted.delete(mediaId);
                else
                    reverted.add(mediaId);
                return reverted;
            });
            logger.error('Failed to toggle favorite', err);
        }
    };
    // Хуки для поиска и фильтрации
    const { searchQuery, setSearchQuery, suggestions, isSearching, clearSearch, } = useSearch();
    // Onboarding Tour Logic
    const [showTour, setShowTour] = useState(false);
    const updateProfile = useAuthStore((s) => s.updateProfile);
    const replayTourRequested = useAuthStore((s) => s.replayTourRequested);
    const clearTourReplayRequest = useAuthStore((s) => s.clearTourReplayRequest);
    useEffect(() => {
        if (user?.hasCompletedOnboarding)
            return;
        // Wait longer to avoid splash overlap (4.1s splash + 0.9s margin)
        const timer = setTimeout(() => setShowTour(true), 5000);
        return () => clearTimeout(timer);
    }, [user?.hasCompletedOnboarding]);
    useEffect(() => {
        if (replayTourRequested) {
            setShowTour(true);
            clearTourReplayRequest();
        }
    }, [replayTourRequested, clearTourReplayRequest]);
    const handleCloseTour = async () => {
        setShowTour(false);
        if (user?.hasCompletedOnboarding)
            return;
        try {
            await updateProfile({ hasCompletedOnboarding: true });
        }
        catch (e) {
            logger.error('Failed to sync onboarding status', e);
        }
    };
    const TOUR_STEPS = [
        {
            title: "Добро пожаловать!",
            description: "Seen — это ваше пространство для организации фильмов, книг, игр и аниме. Давайте быстро пробежимся по функционалу.",
            position: "center"
        },
        {
            targetId: "sidebar-tour-header",
            title: "Ваши группы",
            description: "Здесь вы можете создавать папки и подпапки для сортировки вашей коллекции. Перетаскивайте элементы, чтобы организовать их.",
        },
        {
            targetId: "add-media-btn",
            title: "Добавить запись",
            description: "Нажмите эту кнопку, чтобы добавить новый фильм, книгу или игру в вашу коллекцию.",
        },
        {
            targetId: "search-bar",
            title: "Поиск и фильтры",
            description: "Используйте поиск и фильтры для быстрого нахождения нужной записи по названию, тегам или рейтингу.",
        },
        {
            title: "Готово!",
            description: "Вы готовы к работе. Наслаждайтесь использованием Seen!",
            position: "center"
        }
    ];
    const { filters, updateFilter, removeFilter, clearFilters, hasActiveFilters, isFilterPanelOpen, 
    // toggleFilterPanel, // unused
    setIsFilterPanelOpen, } = useFilters();
    const { mediaList, isLoading: isMediaLoading, error: mediaError, loadMedia } = useMediaData({
        selectedGroupId,
        searchQuery,
        filters,
    });
    const { groupStats, loadGroups, isGroupModalOpen, editingGroup, openCreateGroupModal, openEditGroupModal, closeGroupModal, targetParentId, moveGroup, confirmDelete, deleteGroup, isDeleteConfirmOpen, setIsDeleteConfirmOpen, groupToDelete } = useGroupManagement(selectedGroupId, setSelectedGroupId);
    const sensors = useSensors(useSensor(PointerSensor, {
        activationConstraint: {
            distance: 8,
        },
    }));
    const groups = useMemo(() => groupStats?.groups ?? [], [groupStats]);
    const [groupDragState, setGroupDragState] = useState(INITIAL_GROUP_DRAG_STATE);
    const handleRefresh = async () => {
        await Promise.all([loadMedia(), loadGroups()]);
    };
    const handleDragStart = (event) => {
        const activeId = event.active.id.toString();
        if (!activeId.startsWith('group-'))
            return;
        const groupId = Number(activeId.replace('group-', ''));
        setGroupDragState({
            ...INITIAL_GROUP_DRAG_STATE,
            isGroupDragging: true,
            draggedGroupName: groups.find((g) => g.id === groupId)?.name ?? null,
        });
    };
    const handleDragOver = (event) => {
        const { active, over } = event;
        const activeId = active.id.toString();
        if (!activeId.startsWith('group-'))
            return;
        const next = { ...INITIAL_GROUP_DRAG_STATE, isGroupDragging: true, draggedGroupName: groupDragState.draggedGroupName };
        if (over) {
            const overId = over.id.toString();
            if (overId === GROUP_ROOT_DROPPABLE_ID) {
                next.overId = overId;
                next.position = 'inside';
            }
            else if (overId.startsWith('group-') && overId !== 'group-null') {
                const activeNum = Number(activeId.replace('group-', ''));
                const targetNum = Number(overId.replace('group-', ''));
                const forbidden = targetNum === activeNum ||
                    collectDescendantIds(groups, activeNum).has(targetNum);
                next.overId = overId;
                next.forbidden = forbidden;
                next.position = forbidden ? null : getDropPosition(event);
            }
        }
        setGroupDragState(next);
    };
    const handleDragEnd = async (event) => {
        setGroupDragState(INITIAL_GROUP_DRAG_STATE);
        const { active, over } = event;
        if (!over)
            return;
        const activeId = active.id.toString();
        const overId = over.id.toString();
        if (activeId.startsWith('media-')) {
            if (!overId.startsWith('group-'))
                return;
            const mediaId = Number(activeId.replace('media-', ''));
            const groupIdRaw = overId.replace('group-', '');
            const groupId = groupIdRaw === 'null' ? null : Number(groupIdRaw);
            // Запись уже в этой группе — запрос не нужен
            const currentGroupId = active.data.current?.groupId ?? null;
            if (currentGroupId === groupId)
                return;
            try {
                await mediaApi.update(mediaId, { groupId });
                await handleRefresh();
            }
            catch (e) {
                logger.error('Failed to move media', e);
            }
            return;
        }
        if (activeId.startsWith('group-')) {
            const groupId = Number(activeId.replace('group-', ''));
            let resolution = null;
            if (overId === GROUP_ROOT_DROPPABLE_ID) {
                resolution = { parentId: null, beforeId: null };
            }
            else if (overId.startsWith('group-') && overId !== 'group-null') {
                const targetId = Number(overId.replace('group-', ''));
                resolution = resolveGroupDrop({
                    activeId: groupId,
                    targetId,
                    position: getDropPosition(event),
                    groups,
                });
            }
            // null — дроп запрещён (себя/потомка) или ничего не меняет
            if (!resolution)
                return;
            if (isNoopMove(groups, groupId, resolution))
                return;
            await moveGroup(groupId, resolution);
            // Состав поддеревьев изменился — список записей родителя тоже
            await loadMedia();
        }
    };
    const handleDragCancel = () => {
        setGroupDragState(INITIAL_GROUP_DRAG_STATE);
    };
    const getPageTitle = () => {
        if (selectedGroupId === 'all')
            return 'Моя медиатека';
        if (selectedGroupId === null)
            return 'Без группы';
        return groupStats?.groups.find(g => g.id === selectedGroupId)?.name || 'Группа';
    };
    const handleSelectSuggestion = (media) => {
        // TODO: открыть детали выбранной записи из поиска
        void media;
    };
    return (_jsxs(DndContext, { sensors: sensors, onDragStart: handleDragStart, onDragOver: handleDragOver, onDragEnd: handleDragEnd, onDragCancel: handleDragCancel, children: [_jsxs("div", { className: "flex h-screen w-full bg-background overflow-hidden font-sans", children: [_jsx(Sidebar, { groupStats: groupStats, selectedGroupId: selectedGroupId, onSelectGroup: setSelectedGroupId, onCreateGroup: openCreateGroupModal, onEditGroup: openEditGroupModal, onDeleteGroup: confirmDelete, isGroupDragging: groupDragState.isGroupDragging, dropIndicator: {
                            overId: groupDragState.overId,
                            position: groupDragState.position,
                            forbidden: groupDragState.forbidden,
                        } }), _jsxs("main", { className: "flex-1 flex flex-col h-full min-w-0", children: [_jsx(HomeHeader, { title: getPageTitle(), username: user?.username, avatar: user?.preferences?.avatar, onAddMedia: () => setIsAddModalOpen(true), onNavigateToProfile: () => navigate('/profile'), onNavigateToSettings: () => navigate('/settings'), onLogout: logout }), _jsx("div", { className: "border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", children: _jsxs("div", { className: "px-6 py-4 space-y-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "flex-1", children: _jsx(SearchBar, { value: searchQuery, onChange: setSearchQuery, onClear: clearSearch, suggestions: suggestions, isSearching: isSearching, onSelectSuggestion: handleSelectSuggestion }) }), _jsx(FilterPanel, { filters: filters, onUpdateFilter: updateFilter, onRemoveFilter: removeFilter, onClearFilters: clearFilters, hasActiveFilters: hasActiveFilters, isOpen: isFilterPanelOpen, onOpenChange: setIsFilterPanelOpen })] }), hasActiveFilters && (_jsxs("div", { className: "flex items-center gap-2 text-xs text-muted-foreground", children: [_jsx("span", { children: "\u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0435 \u0444\u0438\u043B\u044C\u0442\u0440\u044B:" }), filters.category && (_jsx("span", { className: "px-2 py-1 bg-primary/10 text-primary rounded", children: filters.category })), filters.minRating !== undefined && (_jsxs("span", { className: "px-2 py-1 bg-primary/10 text-primary rounded", children: ["\u0420\u0435\u0439\u0442\u0438\u043D\u0433 \u2265 ", filters.minRating] })), filters.maxRating !== undefined && (_jsxs("span", { className: "px-2 py-1 bg-primary/10 text-primary rounded", children: ["\u0420\u0435\u0439\u0442\u0438\u043D\u0433 \u2264 ", filters.maxRating] })), filters.genres && filters.genres.length > 0 && (_jsxs("span", { className: "px-2 py-1 bg-primary/10 text-primary rounded", children: [filters.genres.length, " \u0436\u0430\u043D\u0440(\u043E\u0432)"] }))] }))] }) }), _jsx("div", { className: "flex-1 overflow-hidden relative bg-muted/10", children: _jsx(ScrollArea, { className: "h-full w-full", children: _jsx("div", { className: "p-6", children: _jsx(MediaGrid, { mediaList: mediaList, isLoading: isMediaLoading, error: mediaError, onRefresh: handleRefresh, onAddMedia: () => setIsAddModalOpen(true), favoriteIds: favoriteIds, onToggleFavorite: (id, next) => void handleToggleFavorite(id, next) }) }) }) })] }), _jsx(AddMediaModal, { isOpen: isAddModalOpen, onClose: () => setIsAddModalOpen(false), onSuccess: handleRefresh }), _jsx(CreateGroupModal, { isOpen: isGroupModalOpen, onClose: closeGroupModal, onSuccess: loadGroups, initialData: editingGroup, parentId: targetParentId, groups: groups }), _jsx(ConfirmationDialog, { isOpen: isDeleteConfirmOpen, onClose: () => setIsDeleteConfirmOpen(false), onConfirm: () => groupToDelete && deleteGroup(groupToDelete), title: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0433\u0440\u0443\u043F\u043F\u0443?", description: "\u042D\u0442\u043E \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u043D\u0435\u043B\u044C\u0437\u044F \u043E\u0442\u043C\u0435\u043D\u0438\u0442\u044C. \u0412\u0441\u0435 \u0437\u0430\u043F\u0438\u0441\u0438 \u0432\u043D\u0443\u0442\u0440\u0438 \u0433\u0440\u0443\u043F\u043F\u044B \u0441\u0442\u0430\u043D\u0443\u0442 \u043D\u0435\u0440\u0430\u0441\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u043D\u044B\u043C\u0438.", confirmText: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C", variant: "destructive" })] }), _jsx(GuidedTour, { isOpen: showTour, onSkip: handleCloseTour, onComplete: handleCloseTour, steps: TOUR_STEPS }), _jsx(DragOverlay, { dropAnimation: null, children: groupDragState.isGroupDragging && groupDragState.draggedGroupName ? (_jsx("div", { className: "rounded-md bg-secondary px-3 py-2 text-sm font-medium shadow-lg ring-1 ring-border", children: groupDragState.draggedGroupName })) : null })] }));
}
