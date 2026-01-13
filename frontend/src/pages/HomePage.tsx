import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import AddMediaModal from '../components/AddMediaModal';
import CreateGroupModal from '../components/CreateGroupModal';
import {
  Sidebar,
  MediaGrid,
  HomeHeader
} from '../components/HomePage';
import { useMediaData } from '../hooks/useMediaData';
import { useGroupManagement } from '../hooks/useGroupManagement';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { ScrollArea } from "@/components/ui/scroll-area";

export default function HomePage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [selectedGroupId, setSelectedGroupId] = useState<number | null | 'all'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { mediaList, isLoading: isMediaLoading, error: mediaError, loadMedia } = useMediaData(selectedGroupId);
  const { 
    groupStats, 
    setGroupStats, 
    loadGroups, 
    deleteGroup, 
    isGroupModalOpen, 
    editingGroup, 
    openCreateGroupModal, 
    openEditGroupModal, 
    closeGroupModal 
  } = useGroupManagement(selectedGroupId, setSelectedGroupId);
  
  const { onDragEnd } = useDragAndDrop(groupStats, setGroupStats);

  const handleRefresh = async () => {
    await Promise.all([loadMedia(), loadGroups()]);
  };

  const getPageTitle = () => {
    if (selectedGroupId === 'all') return 'Моя медиатека';
    if (selectedGroupId === null) return 'Без группы';
    return groupStats?.groups.find(g => g.id === selectedGroupId)?.name || 'Группа';
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-sans">
      <Sidebar 
        groupStats={groupStats}
        selectedGroupId={selectedGroupId}
        onSelectGroup={setSelectedGroupId}
        onCreateGroup={openCreateGroupModal}
        onEditGroup={openEditGroupModal}
        onDeleteGroup={deleteGroup}
        onDragEnd={onDragEnd}
      />

      <main className="flex-1 flex flex-col h-full min-w-0">
        <HomeHeader 
          title={getPageTitle()}
          username={user?.username}
          onAddMedia={() => setIsAddModalOpen(true)}
          onNavigateToProfile={() => navigate('/profile')}
          onNavigateToSettings={() => navigate('/settings')}
          onLogout={logout}
        />

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
      />
    </div>
  );
}

