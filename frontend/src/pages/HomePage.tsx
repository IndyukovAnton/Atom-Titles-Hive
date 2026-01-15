import { useState,  useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import AddMediaModal from '../components/AddMediaModal';
import CreateGroupModal from '../components/CreateGroupModal';
import {
  Sidebar,
  MediaGrid,
  HomeHeader,
  SearchBar,
  FilterPanel
} from '../components/HomePage';
import { useMediaData } from '../hooks/useMediaData';
import { useGroupManagement } from '../hooks/useGroupManagement';
import { useSearch } from '../hooks/useSearch';
import { useFilters } from '../hooks/useFilters';
import { ScrollArea } from "@/components/ui/scroll-area";
import { DndContext, useSensor, useSensors, PointerSensor, type DragEndEvent } from '@dnd-kit/core';
import { mediaApi } from '../api/media';
import { FallingText } from '../components/easter-eggs/FallingText';

export default function HomePage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [selectedGroupId, setSelectedGroupId] = useState<number | null | 'all'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Хуки для поиска и фильтрации
  const {
    searchQuery,
    setSearchQuery,
    suggestions,
    isSearching,
    clearSearch,
  } = useSearch();

  const {
    filters,
    updateFilter,
    removeFilter,
    clearFilters,
    hasActiveFilters,
    isFilterPanelOpen,
    toggleFilterPanel,
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
    deleteGroup, 
    isGroupModalOpen, 
    editingGroup, 
    openCreateGroupModal, 
    openEditGroupModal, 
    closeGroupModal,
    targetParentId
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
    }
  };

  // Пасхалка - тройной клик
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<NodeJS.Timeout>();
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

  const handleSelectSuggestion = (media: any) => {
    // Можно реализовать навигацию к выбранному медиа или другую логику
    console.log('Selected media:', media);
    // Например, можно открыть модальное окно с деталями
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      {FallingTextComponent}
      <div className="flex h-screen w-full bg-background overflow-hidden font-sans">
        <Sidebar 
          groupStats={groupStats}
          selectedGroupId={selectedGroupId}
          onSelectGroup={setSelectedGroupId}
          onCreateGroup={openCreateGroupModal}
          onEditGroup={openEditGroupModal}
          onDeleteGroup={deleteGroup}
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
      </div>
    </DndContext>
  );
}


