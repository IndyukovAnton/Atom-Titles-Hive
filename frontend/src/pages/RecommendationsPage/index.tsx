import { useState } from 'react';
import { Sparkles, Library, TrendingUp, Brain } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

import type { RecommendationItem } from '@/api/recommendations';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

import { Sidebar, HomeHeader } from '@/components/HomePage';
import { useAuthStore } from '@/store/authStore';
import { useGroupManagement } from '@/hooks/useGroupManagement';
import AddMediaModal from '@/components/AddMediaModal';
import CreateGroupModal from '@/components/CreateGroupModal';
import type { MediaEntry } from '@/api/media';

import { TopRatedSection } from './TopRatedSection';
import { GenresSection } from './GenresSection';
import { AiAssistantSection } from './AiAssistantSection';

export default function RecommendationsPage() {
  const [activeTab, setActiveTab] = useState('top-rated');
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalInitialData, setAddModalInitialData] = useState<
    Partial<MediaEntry> | undefined
  >(undefined);

  const [selectedGroupId, setSelectedGroupId] = useState<number | null | 'all'>(
    'all',
  );

  const {
    groupStats,
    loadGroups,
    deleteGroup,
    isGroupModalOpen,
    editingGroup,
    openCreateGroupModal,
    openEditGroupModal,
    closeGroupModal,
    targetParentId,
  } = useGroupManagement(selectedGroupId, setSelectedGroupId);

  const handleSelectGroup = (id: number | null | 'all') => {
    navigate('/', { state: { groupId: id } });
  };

  const handleAddRecommendation = (item: RecommendationItem) => {
    setAddModalInitialData({
      title: item.title,
      description: item.description,
      image: item.image,
      rating: item.rating,
      tags: item.genres,
    });
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setAddModalInitialData(undefined);
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-sans">
      <Sidebar
        groupStats={groupStats || { groups: [], ungrouped: 0 }}
        selectedGroupId={selectedGroupId}
        onSelectGroup={handleSelectGroup}
        onCreateGroup={openCreateGroupModal}
        onEditGroup={openEditGroupModal}
        onDeleteGroup={deleteGroup}
      />

      <main className="flex-1 flex flex-col h-full min-w-0">
        <HomeHeader
          title="Рекомендации"
          username={user?.username}
          onAddMedia={() => {
            setAddModalInitialData(undefined);
            setIsAddModalOpen(true);
          }}
          onNavigateToProfile={() => navigate('/profile')}
          onNavigateToSettings={() => navigate('/settings')}
          onLogout={logout}
        />

        <div className="flex-1 overflow-hidden relative bg-muted/10">
          <ScrollArea className="h-full w-full">
            <div className="w-full p-6 space-y-8 animate-in fade-in duration-500 relative z-10 bg-background/80 backdrop-blur-sm rounded-2xl my-4 mx-4 shadow-lg">
              <div className="flex flex-col gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20">
                    <Sparkles className="w-7 h-7 text-amber-500" />
                  </div>
                  <span className="bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent">
                    Your Discover Feed
                  </span>
                </h1>
                <p className="text-muted-foreground ml-14">
                  AI-powered suggestions based on your unique taste.
                </p>
              </div>

              <Tabs
                defaultValue="top-rated"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                  <TabsTrigger
                    value="top-rated"
                    className="flex items-center gap-2"
                  >
                    <TrendingUp className="w-4 h-4" />
                    Top Rated
                  </TabsTrigger>
                  <TabsTrigger
                    value="genres"
                    className="flex items-center gap-2"
                  >
                    <Library className="w-4 h-4" />
                    By Genres
                  </TabsTrigger>
                  <TabsTrigger value="ai" className="flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    AI Assistant
                  </TabsTrigger>
                </TabsList>

                <div className="mt-6 min-h-[400px]">
                  <TabsContent value="top-rated" className="mt-0">
                    <TopRatedSection onAdd={handleAddRecommendation} />
                  </TabsContent>
                  <TabsContent value="genres" className="mt-0">
                    <GenresSection onAdd={handleAddRecommendation} />
                  </TabsContent>
                  <TabsContent value="ai" className="mt-0">
                    <AiAssistantSection onAdd={handleAddRecommendation} />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </ScrollArea>
        </div>
      </main>

      <AddMediaModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onSuccess={() => {
          toast.success('Title added to library');
        }}
        initialData={addModalInitialData as MediaEntry}
      />

      <CreateGroupModal
        isOpen={isGroupModalOpen}
        onClose={closeGroupModal}
        onSuccess={loadGroups}
        initialData={editingGroup}
        parentId={targetParentId}
      />
    </div>
  );
}
