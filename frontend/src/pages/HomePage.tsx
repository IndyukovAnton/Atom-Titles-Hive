import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import AddMediaModal from '../components/AddMediaModal';
import CreateGroupModal from '../components/CreateGroupModal';
import { GuidedTour } from '../components/onboarding/GuidedTour';
import {
  Sidebar,
  MediaGrid,
  HomeHeader,
  SearchBar,
  FilterPanel
} from '../components/HomePage';
import { GROUP_ROOT_DROPPABLE_ID } from '../components/HomePage/Sidebar';
import { ConfirmationDialog } from '../components/ui/confirmation-dialog';
import { useMediaData } from '../hooks/useMediaData';
import { useGroupManagement } from '../hooks/useGroupManagement';
import { useSearch } from '../hooks/useSearch';
import { useFilters } from '../hooks/useFilters';
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { mediaApi, type MediaEntry } from '../api/media';
import { libraryApi } from '../api/library';
import { logger } from '@/utils/logger';
import {
  collectDescendantIds,
  isNoopMove,
  resolveGroupDrop,
  type DropPosition,
  type GroupDropResolution,
} from '@/utils/group-tree';

interface GroupDragState {
  isGroupDragging: boolean;
  draggedGroupName: string | null;
  overId: string | null;
  position: DropPosition | null;
  forbidden: boolean;
}

const INITIAL_GROUP_DRAG_STATE: GroupDragState = {
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
function getDropPosition(event: DragOverEvent | DragEndEvent): DropPosition {
  const { over, delta, activatorEvent } = event;
  if (!over) return 'inside';

  const pointerY =
    activatorEvent instanceof PointerEvent
      ? activatorEvent.clientY + delta.y
      : null;
  if (pointerY === null || over.rect.height === 0) return 'inside';

  const ratio = (pointerY - over.rect.top) / over.rect.height;
  if (ratio < 0.25) return 'before';
  if (ratio > 0.75) return 'after';
  return 'inside';
}

export default function HomePage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedGroupId, setSelectedGroupId] = useState<number | null | 'all'>(location.state?.groupId ?? 'all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;
    libraryApi
      .listFavoriteMediaIds()
      .then((ids) => {
        if (!cancelled) setFavoriteIds(new Set(ids));
      })
      .catch(() => {
        // ignore — favorite indicator just won't be shown
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggleFavorite = async (mediaId: number, next: boolean) => {
    // Optimistic update
    setFavoriteIds((prev) => {
      const updated = new Set(prev);
      if (next) updated.add(mediaId);
      else updated.delete(mediaId);
      return updated;
    });
    try {
      if (next) {
        await libraryApi.addMediaFavorite(mediaId);
      } else {
        await libraryApi.removeMediaFavorite(mediaId);
      }
    } catch (err) {
      // Revert on failure
      setFavoriteIds((prev) => {
        const reverted = new Set(prev);
        if (next) reverted.delete(mediaId);
        else reverted.add(mediaId);
        return reverted;
      });
      logger.error('Failed to toggle favorite', err);
    }
  };

  // Хуки для поиска и фильтрации
  const {
    searchQuery,
    setSearchQuery,
    suggestions,
    isSearching,
    clearSearch,
  } = useSearch();

  // Onboarding Tour Logic
  const [showTour, setShowTour] = useState(false);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const replayTourRequested = useAuthStore((s) => s.replayTourRequested);
  const clearTourReplayRequest = useAuthStore((s) => s.clearTourReplayRequest);

  useEffect(() => {
    if (user?.hasCompletedOnboarding) return;
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
    if (user?.hasCompletedOnboarding) return;
    try {
      await updateProfile({ hasCompletedOnboarding: true });
    } catch (e) {
      logger.error('Failed to sync onboarding status', e);
    }
  };
  
  const TOUR_STEPS = [
      {
          title: "Добро пожаловать!",
          description: "Seen — это ваше пространство для организации фильмов, книг, игр и аниме. Давайте быстро пробежимся по функционалу.",
          position: "center" as const
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
          position: "center" as const
      }
  ];

  const {
    filters,
    updateFilter,
    removeFilter,
    clearFilters,
    hasActiveFilters,
    isFilterPanelOpen,
    // toggleFilterPanel, // unused
    setIsFilterPanelOpen,
  } = useFilters();

  const { mediaList, isLoading: isMediaLoading, error: mediaError, loadMedia } = useMediaData({
    selectedGroupId,
    searchQuery,
    filters,
  });

  const {
    groupStats,
    loadGroups,
    isGroupModalOpen,
    editingGroup,
    openCreateGroupModal,
    openEditGroupModal,
    closeGroupModal,
    targetParentId,
    moveGroup,
    confirmDelete,
    deleteGroup,
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,
    groupToDelete
  } = useGroupManagement(selectedGroupId, setSelectedGroupId);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const groups = useMemo(() => groupStats?.groups ?? [], [groupStats]);
  const [groupDragState, setGroupDragState] = useState<GroupDragState>(
    INITIAL_GROUP_DRAG_STATE,
  );

  const handleRefresh = async () => {
    await Promise.all([loadMedia(), loadGroups()]);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const activeId = event.active.id.toString();
    if (!activeId.startsWith('group-')) return;

    const groupId = Number(activeId.replace('group-', ''));
    setGroupDragState({
      ...INITIAL_GROUP_DRAG_STATE,
      isGroupDragging: true,
      draggedGroupName: groups.find((g) => g.id === groupId)?.name ?? null,
    });
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    const activeId = active.id.toString();
    if (!activeId.startsWith('group-')) return;

    const next: GroupDragState = { ...INITIAL_GROUP_DRAG_STATE, isGroupDragging: true, draggedGroupName: groupDragState.draggedGroupName };

    if (over) {
      const overId = over.id.toString();

      if (overId === GROUP_ROOT_DROPPABLE_ID) {
        next.overId = overId;
        next.position = 'inside';
      } else if (overId.startsWith('group-') && overId !== 'group-null') {
        const activeNum = Number(activeId.replace('group-', ''));
        const targetNum = Number(overId.replace('group-', ''));
        const forbidden =
          targetNum === activeNum ||
          collectDescendantIds(groups, activeNum).has(targetNum);

        next.overId = overId;
        next.forbidden = forbidden;
        next.position = forbidden ? null : getDropPosition(event);
      }
    }

    setGroupDragState(next);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setGroupDragState(INITIAL_GROUP_DRAG_STATE);

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    if (activeId.startsWith('media-')) {
        if (!overId.startsWith('group-')) return;

        const mediaId = Number(activeId.replace('media-', ''));
        const groupIdRaw = overId.replace('group-', '');
        const groupId = groupIdRaw === 'null' ? null : Number(groupIdRaw);

        // Запись уже в этой группе — запрос не нужен
        const currentGroupId =
          (active.data.current as MediaEntry | undefined)?.groupId ?? null;
        if (currentGroupId === groupId) return;

        try {
            await mediaApi.update(mediaId, { groupId });
            await handleRefresh();
        } catch (e) {
            logger.error('Failed to move media', e);
        }
        return;
    }

    if (activeId.startsWith('group-')) {
        const groupId = Number(activeId.replace('group-', ''));

        let resolution: GroupDropResolution | null = null;
        if (overId === GROUP_ROOT_DROPPABLE_ID) {
          resolution = { parentId: null, beforeId: null };
        } else if (overId.startsWith('group-') && overId !== 'group-null') {
          const targetId = Number(overId.replace('group-', ''));
          resolution = resolveGroupDrop({
            activeId: groupId,
            targetId,
            position: getDropPosition(event),
            groups,
          });
        }

        // null — дроп запрещён (себя/потомка) или ничего не меняет
        if (!resolution) return;
        if (isNoopMove(groups, groupId, resolution)) return;

        await moveGroup(groupId, resolution);
        // Состав поддеревьев изменился — список записей родителя тоже
        await loadMedia();
    }
  };

  const handleDragCancel = () => {
    setGroupDragState(INITIAL_GROUP_DRAG_STATE);
  };

  const getPageTitle = () => {
    if (selectedGroupId === 'all') return 'Моя медиатека';
    if (selectedGroupId === null) return 'Без группы';
    return groupStats?.groups.find(g => g.id === selectedGroupId)?.name || 'Группа';
  };

  const handleSelectSuggestion = (media: MediaEntry) => {
    // TODO: открыть детали выбранной записи из поиска
    void media;
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex h-screen w-full bg-background overflow-hidden font-sans">
        <Sidebar
          groupStats={groupStats}
          selectedGroupId={selectedGroupId}
          onSelectGroup={setSelectedGroupId}
          onCreateGroup={openCreateGroupModal}
          onEditGroup={openEditGroupModal}
          onDeleteGroup={confirmDelete}
          isGroupDragging={groupDragState.isGroupDragging}
          dropIndicator={{
            overId: groupDragState.overId,
            position: groupDragState.position,
            forbidden: groupDragState.forbidden,
          }}
        />

        <main className="flex-1 flex flex-col h-full min-w-0">
          <HomeHeader
            title={getPageTitle()}
            username={user?.username}
            avatar={user?.preferences?.avatar}
            onAddMedia={() => setIsAddModalOpen(true)}
            onNavigateToProfile={() => navigate('/profile')}
            onNavigateToSettings={() => navigate('/settings')}
            onLogout={logout}
          />

          {/* Панель поиска и фильтров */}
          <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="px-6 py-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    onClear={clearSearch}
                    suggestions={suggestions}
                    isSearching={isSearching}
                    onSelectSuggestion={handleSelectSuggestion}
                  />
                </div>
                <FilterPanel
                  filters={filters}
                  onUpdateFilter={updateFilter}
                  onRemoveFilter={removeFilter}
                  onClearFilters={clearFilters}
                  hasActiveFilters={hasActiveFilters}
                  isOpen={isFilterPanelOpen}
                  onOpenChange={setIsFilterPanelOpen}
                />
              </div>
              
              {/* Активные фильтры badge */}
              {hasActiveFilters && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Активные фильтры:</span>
                  {filters.category && (
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded">
                      {filters.category}
                    </span>
                  )}
                  {filters.minRating !== undefined && (
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded">
                      Рейтинг ≥ {filters.minRating}
                    </span>
                  )}
                  {filters.maxRating !== undefined && (
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded">
                      Рейтинг ≤ {filters.maxRating}
                    </span>
                  )}
                  {filters.genres && filters.genres.length > 0 && (
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded">
                      {filters.genres.length} жанр(ов)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-hidden relative bg-muted/10">
            <ScrollArea className="h-full w-full">
               <div className="p-6">
                  <MediaGrid
                    mediaList={mediaList}
                    isLoading={isMediaLoading}
                    error={mediaError}
                    onRefresh={handleRefresh}
                    onAddMedia={() => setIsAddModalOpen(true)}
                    favoriteIds={favoriteIds}
                    onToggleFavorite={(id, next) => void handleToggleFavorite(id, next)}
                  />
               </div>
            </ScrollArea>
          </div>
        </main>

        <AddMediaModal 
          isOpen={isAddModalOpen} 
          onClose={() => setIsAddModalOpen(false)} 
          onSuccess={handleRefresh} 
        />

        <CreateGroupModal
          isOpen={isGroupModalOpen}
          onClose={closeGroupModal}
          onSuccess={loadGroups}
          initialData={editingGroup}
          parentId={targetParentId}
          groups={groups}
        />

        <ConfirmationDialog
          isOpen={isDeleteConfirmOpen}
          onClose={() => setIsDeleteConfirmOpen(false)}
          onConfirm={() => groupToDelete && deleteGroup(groupToDelete)}
          title="Удалить группу?"
          description="Это действие нельзя отменить. Все записи внутри группы станут нераспределенными."
          confirmText="Удалить"
          variant="destructive"
        />
      </div>
        <GuidedTour
          isOpen={showTour}
          onSkip={handleCloseTour}
          onComplete={handleCloseTour}
          steps={TOUR_STEPS}
        />
        <DragOverlay dropAnimation={null}>
          {groupDragState.isGroupDragging && groupDragState.draggedGroupName ? (
            <div className="rounded-md bg-secondary px-3 py-2 text-sm font-medium shadow-lg ring-1 ring-border">
              {groupDragState.draggedGroupName}
            </div>
          ) : null}
        </DragOverlay>
    </DndContext>
  );
}


