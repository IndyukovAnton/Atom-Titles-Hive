import { useEffect, useState } from 'react';
import { Star, Plus, Pin, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

import { Sidebar, HomeHeader } from '@/components/HomePage';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    // not JSON — comma-split
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

export default function FavoritesPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [favRecs, setFavRecs] = useState<SavedRecommendation[]>([]);
  const [favMedia, setFavMedia] = useState<MediaEntry[]>([]);
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
      const [recs, media] = await Promise.all([
        libraryApi.listSavedRecommendations('favorited'),
        libraryApi.listFavoriteMedia(),
      ]);
      setFavRecs(recs);
      setFavMedia(media);
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

  const handleAddRecToLibrary = (rec: SavedRecommendation) => {
    const initial = aiCardToAddMediaInitial(savedRecToAICard(rec));
    setAddModalInitialData(initial);
    setIsAddModalOpen(true);
  };

  const handleMoveRecToConsider = async (rec: SavedRecommendation) => {
    try {
      await libraryApi.updateSavedRecommendationStatus(rec.id, 'considering');
      setFavRecs((prev) => prev.filter((r) => r.id !== rec.id));
      toast.success('Перемещено в «Подумаю»');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не удалось');
    }
  };

  const handleRemoveRec = async (rec: SavedRecommendation) => {
    try {
      await libraryApi.removeSavedRecommendation(rec.id);
      setFavRecs((prev) => prev.filter((r) => r.id !== rec.id));
      toast.success('Убрано');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не удалось');
    }
  };

  const handleUnfavoriteMedia = async (m: MediaEntry) => {
    try {
      await libraryApi.removeMediaFavorite(m.id);
      setFavMedia((prev) => prev.filter((x) => x.id !== m.id));
      toast.success('Убрано из избранного');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не удалось');
    }
  };

  const totalCount = favRecs.length + favMedia.length;

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
          title="Избранное"
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
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500/20 to-orange-500/20">
                  <Star className="w-7 h-7 text-rose-500 fill-rose-500/40" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">
                    Избранное
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    Карточки записей и рекомендации, которые ты выделил{' '}
                    {totalCount > 0 && `(${totalCount})`}
                  </p>
                </div>
              </div>

              {loading && totalCount === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  Загружаю...
                </div>
              )}

              {!loading && totalCount === 0 && (
                <div className="text-center py-20 text-muted-foreground border border-dashed rounded-2xl bg-gradient-to-br from-rose-500/5 to-orange-500/5">
                  <Star className="w-12 h-12 mx-auto mb-4 text-rose-500/40" />
                  <p className="font-medium text-lg text-foreground">
                    Раздел пока пуст
                  </p>
                  <p className="max-w-md mx-auto mt-2 text-sm">
                    Жми ⭐ на карточках в Рекомендациях или на записях в
                    своей библиотеке — они попадут сюда.
                  </p>
                  <Button
                    className="mt-4"
                    variant="outline"
                    onClick={() => navigate('/')}
                  >
                    К моей библиотеке
                  </Button>
                </div>
              )}

              {totalCount > 0 && (
                <Tabs defaultValue="all">
                  <TabsList>
                    <TabsTrigger value="all">
                      Все ({totalCount})
                    </TabsTrigger>
                    <TabsTrigger value="library">
                      Библиотека ({favMedia.length})
                    </TabsTrigger>
                    <TabsTrigger value="recommendations">
                      Рекомендации ({favRecs.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="mt-4">
                    <FavoritesGrid
                      mediaItems={favMedia}
                      recItems={favRecs}
                      onUnfavoriteMedia={handleUnfavoriteMedia}
                      onAddRec={handleAddRecToLibrary}
                      onMoveRecToConsider={handleMoveRecToConsider}
                      onRemoveRec={handleRemoveRec}
                    />
                  </TabsContent>
                  <TabsContent value="library" className="mt-4">
                    <FavoritesGrid
                      mediaItems={favMedia}
                      recItems={[]}
                      onUnfavoriteMedia={handleUnfavoriteMedia}
                      onAddRec={handleAddRecToLibrary}
                      onMoveRecToConsider={handleMoveRecToConsider}
                      onRemoveRec={handleRemoveRec}
                    />
                  </TabsContent>
                  <TabsContent value="recommendations" className="mt-4">
                    <FavoritesGrid
                      mediaItems={[]}
                      recItems={favRecs}
                      onUnfavoriteMedia={handleUnfavoriteMedia}
                      onAddRec={handleAddRecToLibrary}
                      onMoveRecToConsider={handleMoveRecToConsider}
                      onRemoveRec={handleRemoveRec}
                    />
                  </TabsContent>
                </Tabs>
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

function FavoritesGrid({
  mediaItems,
  recItems,
  onUnfavoriteMedia,
  onAddRec,
  onMoveRecToConsider,
  onRemoveRec,
}: {
  mediaItems: MediaEntry[];
  recItems: SavedRecommendation[];
  onUnfavoriteMedia: (m: MediaEntry) => void;
  onAddRec: (r: SavedRecommendation) => void;
  onMoveRecToConsider: (r: SavedRecommendation) => void;
  onRemoveRec: (r: SavedRecommendation) => void;
}) {
  const navigate = useNavigate();
  if (mediaItems.length === 0 && recItems.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        Здесь пока пусто
      </div>
    );
  }
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {mediaItems.map((m) => (
        <div
          key={`media-${m.id}`}
          className="relative group rounded-xl overflow-hidden border bg-card/80 backdrop-blur-sm shadow-md hover:shadow-2xl transition-all hover:-translate-y-1"
        >
          <button
            type="button"
            onClick={() => navigate(`/media/${m.id}`)}
            className="block w-full text-left"
          >
            <div className="relative aspect-[2/3] bg-muted">
              {m.image ? (
                <img
                  src={m.image}
                  alt={m.title}
                  loading="lazy"
                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-muted-foreground/40">
                  Нет обложки
                </div>
              )}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/70 text-white backdrop-blur-md border border-white/10">
                {m.category ?? 'Запись'}
              </div>
              {m.rating > 0 && (
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[11px] font-bold bg-black/70 text-white backdrop-blur-md">
                  ★ {m.rating}
                </div>
              )}
            </div>
            <div className="p-3 space-y-1">
              <div className="font-semibold leading-tight line-clamp-2">
                {m.title}
              </div>
              {(() => {
                const gs = parseMaybeGenres(m.genres);
                return gs.length > 0 ? (
                  <div className="text-[10px] text-muted-foreground line-clamp-1">
                    {gs.slice(0, 3).join(' · ')}
                  </div>
                ) : null;
              })()}
            </div>
          </button>
          <button
            type="button"
            onClick={() => onUnfavoriteMedia(m)}
            title="Убрать из избранного"
            className="absolute bottom-2 right-2 p-2 rounded-full bg-rose-500/90 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Star className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>
      ))}

      {recItems.map((rec, idx) => (
        <div key={`rec-${rec.id}`} className="relative group">
          <AICard
            card={savedRecToAICard(rec)}
            index={idx}
            onAdd={() => onAddRec(rec)}
          />
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button
              type="button"
              onClick={() => onMoveRecToConsider(rec)}
              title="В «Подумаю»"
              className="p-2 rounded-full bg-black/70 backdrop-blur-md text-white shadow-lg hover:bg-indigo-500/80"
            >
              <Pin className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onAddRec(rec)}
              title="В библиотеку"
              className="p-2 rounded-full bg-black/70 backdrop-blur-md text-white shadow-lg hover:bg-emerald-500/80"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onRemoveRec(rec)}
              title="Убрать"
              className="p-2 rounded-full bg-black/70 backdrop-blur-md text-white shadow-lg hover:bg-rose-500/80"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
