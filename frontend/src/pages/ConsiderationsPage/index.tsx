import { useEffect, useState } from 'react';
import { Pin, Star, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

import { Sidebar, HomeHeader } from '@/components/HomePage';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { useGroupManagement } from '@/hooks/useGroupManagement';
import AddMediaModal from '@/components/AddMediaModal';
import CreateGroupModal from '@/components/CreateGroupModal';
import type { MediaEntry } from '@/api/media';
import { libraryApi, type SavedRecommendation } from '@/api/library';
import { AICard } from '@/components/recommendations/AICard';
import { aiCardToAddMediaInitial } from '@/components/recommendations/aiCardMapping';
import type { AICard as AICardData } from '@/api/recommendations';

const parseMaybeGenres = (raw: unknown): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw))
    return raw.filter((g): g is string => typeof g === 'string');
  if (typeof raw !== 'string') return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed))
      return parsed.filter((g): g is string => typeof g === 'string');
  } catch {
    // fallthrough
  }
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

const savedRecToAICard = (r: SavedRecommendation): AICardData => ({
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

  const [items, setItems] = useState<SavedRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

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

  const refresh = async () => {
    setLoading(true);
    try {
      const rows = await libraryApi.listConsiderations();
      setItems(rows);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const handleSelectGroup = (id: number | null | 'all') => {
    navigate('/', { state: { groupId: id } });
  };

  const handleAddToLibrary = (rec: SavedRecommendation) => {
    const initial = aiCardToAddMediaInitial(savedRecToAICard(rec));
    setAddModalInitialData(initial);
    setIsAddModalOpen(true);
  };

  const handleMoveToFavorites = async (rec: SavedRecommendation) => {
    try {
      await libraryApi.updateSavedRecommendationStatus(rec.id, 'favorited');
      setItems((prev) => prev.filter((r) => r.id !== rec.id));
      toast.success('Перемещено в «Избранное»');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не удалось');
    }
  };

  const handleRemove = async (rec: SavedRecommendation) => {
    try {
      await libraryApi.removeSavedRecommendation(rec.id);
      setItems((prev) => prev.filter((r) => r.id !== rec.id));
      toast.success('Убрано');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не удалось');
    }
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
          title="Подумаю"
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
            <div className="w-full p-6 space-y-6 mx-4 my-4 bg-background/80 backdrop-blur-sm rounded-2xl shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20">
                  <Pin className="w-7 h-7 text-indigo-500" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
                    Подумаю
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    Рекомендации, которые отложены на «потом»
                  </p>
                </div>
              </div>

              {loading && items.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  Загружаю...
                </div>
              )}

              {!loading && items.length === 0 && (
                <div className="text-center py-20 text-muted-foreground border border-dashed rounded-2xl bg-gradient-to-br from-indigo-500/5 to-violet-500/5">
                  <Pin className="w-12 h-12 mx-auto mb-4 text-indigo-500/40" />
                  <p className="font-medium text-lg text-foreground">
                    Раздел пока пуст
                  </p>
                  <p className="max-w-md mx-auto mt-2 text-sm">
                    На страничке Рекомендации жми 📌 на любой карточке —
                    она попадёт сюда.
                  </p>
                  <Button
                    className="mt-4"
                    variant="outline"
                    onClick={() => navigate('/recommendations')}
                  >
                    К рекомендациям
                  </Button>
                </div>
              )}

              {items.length > 0 && (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {items.map((rec, idx) => (
                    <div key={rec.id} className="relative group">
                      <AICard
                        card={savedRecToAICard(rec)}
                        index={idx}
                        onAdd={() => handleAddToLibrary(rec)}
                      />
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button
                          type="button"
                          onClick={() => void handleMoveToFavorites(rec)}
                          title="В «Избранное»"
                          className="p-2 rounded-full bg-black/70 backdrop-blur-md text-white shadow-lg hover:bg-rose-500/80"
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddToLibrary(rec)}
                          title="В библиотеку"
                          className="p-2 rounded-full bg-black/70 backdrop-blur-md text-white shadow-lg hover:bg-emerald-500/80"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleRemove(rec)}
                          title="Убрать"
                          className="p-2 rounded-full bg-black/70 backdrop-blur-md text-white shadow-lg hover:bg-rose-500/80"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </main>

      <AddMediaModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setAddModalInitialData(undefined);
        }}
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
