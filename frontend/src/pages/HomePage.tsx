import { useState, useRef, useEffect } from 'react';
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
import { ConfirmationDialog } from '../components/ui/confirmation-dialog';
import { useMediaData } from '../hooks/useMediaData';
import { useGroupManagement } from '../hooks/useGroupManagement';
import { useSearch } from '../hooks/useSearch';
import { useFilters } from '../hooks/useFilters';
import { ScrollArea } from "@/components/ui/scroll-area";
import { DndContext, useSensor, useSensors, PointerSensor, type DragEndEvent } from '@dnd-kit/core';
import { mediaApi, type MediaEntry } from '../api/media';
import { FallingText } from '../components/easter-eggs/FallingText';

export default function HomePage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedGroupId, setSelectedGroupId] = useState<number | null | 'all'>(location.state?.groupId ?? 'all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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
  
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('atom-titles-hive-tour-completed');
    // Trigger if either local flag is missing OR backend profile says onboarding is not complete
    if (!hasSeenTour || (user && !user.hasCompletedOnboarding)) {
       // Wait longer to avoid splash overlap (4.1s splash + 0.9s margin)
       const timer = setTimeout(() => setShowTour(true), 5000);
       return () => clearTimeout(timer);
    }
  }, [user?.hasCompletedOnboarding, user]);

  const { updateProfile } = useAuthStore();

  const handleSkipTour = async () => {
     setShowTour(false);
     localStorage.setItem('atom-titles-hive-tour-completed', 'true');
     try {
       await updateProfile({ hasCompletedOnboarding: true });
     } catch (e) {
       console.error('Failed to sync onboarding status', e);
     }
  };

  const handleCompleteTour = async () => {
     setShowTour(false);
     localStorage.setItem('atom-titles-hive-tour-completed', 'true');
     try {
       await updateProfile({ hasCompletedOnboarding: true });
     } catch (e) {
       console.error('Failed to sync onboarding status', e);
     }
  };
  
  const TOUR_STEPS = [
      {
          title: "Добро пожаловать!",
          description: "Atom Titles-Hive — это ваше пространство для организации фильмов, книг, игр и аниме. Давайте быстро пробежимся по функционалу.",
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
          description: "Вы готовы к работе. Наслаждайтесь использованием Atom Titles-Hive!",
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

  const handleRefresh = async () => {
    await Promise.all([loadMedia(), loadGroups()]);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    if (activeId.startsWith('media-') && overId.startsWith('group-')) {
        const mediaId = Number(activeId.replace('media-', ''));
        const groupIdRaw = overId.replace('group-', '');
        const groupId = groupIdRaw === 'null' ? null : Number(groupIdRaw);

        try {
            await mediaApi.update(mediaId, { groupId });
            await handleRefresh();
        } catch (e) {
            console.error('Failed to move media', e);
        }
    } else if (activeId.startsWith('group-') && overId.startsWith('group-')) {
        const groupId = Number(activeId.replace('group-', ''));
        const targetGroupIdRaw = overId.replace('group-', '');
        
        // Don't allow dropping a group into itself
        if (activeId === overId) return;

        const targetGroupId = targetGroupIdRaw === 'null' ? null : Number(targetGroupIdRaw);
        
        await moveGroup(groupId, targetGroupId);
        await handleRefresh();
    }
  };

  // Пасхалка - тройной клик
  const clickCountRef = useRef(0);
  // Используем any или ReturnType, так как NodeJS типы могут быть не видны
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { FallingTextComponent, activate: activateFallingText } = FallingText({});

  const handleTitleClick = () => {
    clickCountRef.current += 1;

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    if (clickCountRef.current === 3) {
      activateFallingText();
      clickCountRef.current = 0;
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 500);
    }
  };

  const getPageTitle = () => {
    if (selectedGroupId === 'all') return 'Моя медиатека';
    if (selectedGroupId === null) return 'Без группы';
    return groupStats?.groups.find(g => g.id === selectedGroupId)?.name || 'Группа';
  };

  const handleSelectSuggestion = (media: MediaEntry) => {
    // Можно реализовать навигацию к выбранному медиа или другую логику
    console.log('Selected media:', media);
    // Например, можно открыть модальное окно с деталями
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      {FallingTextComponent}
      <div className="flex h-screen w-full bg-background overflow-hidden font-sans">
        <Sidebar 
          key={groupStats ? `${groupStats.groups.length}-${groupStats.ungrouped}` : 'sidebar'}
          groupStats={groupStats}
          selectedGroupId={selectedGroupId}
          onSelectGroup={setSelectedGroupId}
          onCreateGroup={openCreateGroupModal}
          onEditGroup={openEditGroupModal}
          onDeleteGroup={confirmDelete}
        />

        <main className="flex-1 flex flex-col h-full min-w-0">
          <div onClick={handleTitleClick} className="cursor-pointer select-none">
            <HomeHeader 
              title={getPageTitle()}
              username={user?.username}
              onAddMedia={() => setIsAddModalOpen(true)}
              onNavigateToProfile={() => navigate('/profile')}
              onNavigateToSettings={() => navigate('/settings')}
              onLogout={logout}
            />
          </div>

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
          onSkip={handleSkipTour}
          onComplete={handleCompleteTour}
          steps={TOUR_STEPS}
        />
    </DndContext>
  );
}


