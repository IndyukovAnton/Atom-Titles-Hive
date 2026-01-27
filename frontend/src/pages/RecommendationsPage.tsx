import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sparkles, Library, TrendingUp, Brain, Plus, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

import { recommendationsApi } from '../api/recommendations';
import type { RecommendationItem } from '../api/recommendations';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { ScrollArea } from '../components/ui/scroll-area';

// Layout & functionality imports
import { Sidebar, HomeHeader } from '../components/HomePage';
import { useAuthStore } from '../store/authStore';
import { useGroupManagement } from '../hooks/useGroupManagement';
import AddMediaModal from '../components/AddMediaModal';
import CreateGroupModal from '../components/CreateGroupModal';
import type { MediaEntry } from '../api/media';

export default function RecommendationsPage() {
  const [activeTab, setActiveTab] = useState('top-rated');
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalInitialData, setAddModalInitialData] = useState<
    Partial<MediaEntry> | undefined
  >(undefined);

  // Group Management for Sidebar
  // We use detailed state for sidebar to function correctly, though selecting a group navigates away
  const [selectedGroupId, setSelectedGroupId] = useState<number | null | 'all'>(
    'all',
  ); // Local state, mostly unused as we navigate on select

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
    // Navigate to Home with selected group
    navigate('/', { state: { groupId: id } });
  };

  const handleAddRecommendation = (item: RecommendationItem) => {
    // Pre-fill modal with recommendation data
    setAddModalInitialData({
      title: item.title,
      description: item.description,
      image: item.image,
      rating: item.rating,
      // We can map genres to tags or description if needed, logic inside modal handles tags separately
      // Add basic mapping
      tags: item.genres,
      // Default category can be inferred or set to Movie if unknown
      // category: 'Movie' // Let user choose
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
            <div className="container mx-auto p-6 space-y-8 animate-in fade-in duration-500 max-w-7xl relative z-10 bg-background/80 backdrop-blur-sm rounded-2xl my-4 shadow-lg">
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
          // Maybe refresh recommendations if they depend on library?
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

function TopRatedSection({
  onAdd,
}: {
  onAdd: (item: RecommendationItem) => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['recommendations', 'top-rated'],
    queryFn: () => recommendationsApi.getTopRated(10),
  });

  if (isLoading) {
    return <LoadingGrid />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-card/50">
        <Library className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No titles found</h3>
        <p className="text-muted-foreground">
          Add some titles to your library to see top rated ones here.
        </p>
      </div>
    );
  }

  return <RecommendationsGrid items={data} type="internal" onAdd={onAdd} />;
}

function GenresSection({
  onAdd,
}: {
  onAdd: (item: RecommendationItem) => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['recommendations', 'genres'],
    queryFn: () => recommendationsApi.getByGenres(),
  });

  if (isLoading) {
    return <LoadingGrid />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-card/50">
        <Library className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Need more data</h3>
        <p className="text-muted-foreground max-w-sm mt-2">
          Add titles to your library and rate them to help us analyse your
          favorite genres.
        </p>
      </div>
    );
  }

  return (
    <RecommendationsGrid items={data || []} type="external" onAdd={onAdd} />
  );
}

function AiAssistantSection({
  onAdd,
}: {
  onAdd: (item: RecommendationItem) => void;
}) {
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState('openai');
  const [apiKey, setApiKey] = useState('');

  const mutation = useMutation({
    mutationFn: (data: { prompt: string; provider: string; apiKey?: string }) =>
      recommendationsApi.getAiRecommendations(
        data.prompt,
        data.provider,
        data.apiKey,
      ),
    onError: () => {
      toast.error('Failed to generate recommendations');
    },
    onSuccess: () => {
      toast.success('Recommendations generated successfully!');
    },
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    mutation.mutate({ prompt, provider, apiKey });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1 h-fit border-0 shadow-lg overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20">
                <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              AI Assistant
            </CardTitle>
            {/* Status indicator */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
                mutation.isPending
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  : 'bg-green-500/15 text-green-600 dark:text-green-400'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  mutation.isPending
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-green-500'
                }`}
              />
              {mutation.isPending ? 'Processing' : 'Ready'}
            </div>
          </div>
          <CardDescription>
            Умные рекомендации на основе ваших предпочтений
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Провайдер</label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger className="focus:ring-indigo-500">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI (GPT-4)</SelectItem>
                  <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                  <SelectItem value="google">Google (Gemini)</SelectItem>
                  <SelectItem value="local">Local LLM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">
                API Key{' '}
                <span className="text-muted-foreground font-normal">
                  (опционально)
                </span>
              </label>
              <Input
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="focus-visible:ring-indigo-500"
              />
              <p className="text-xs text-muted-foreground">
                Оставьте пустым для использования системного ключа
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Ваш запрос</label>
              <textarea
                className="flex w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[120px] resize-none"
                placeholder="Хочу что-то похожее на Cyberpunk Edgerunners, но с большим количеством комедии..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white border-0 shadow-lg"
              size="lg"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                  Генерация...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Сгенерировать
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="lg:col-span-2">
        {mutation.data ? (
          <RecommendationsGrid items={mutation.data} type="ai" onAdd={onAdd} />
        ) : (
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center border border-dashed rounded-2xl p-12 text-center text-muted-foreground bg-gradient-to-br from-indigo-500/5 to-violet-500/5">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 mb-4">
              <Brain className="w-12 h-12 text-indigo-500/50" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              Готов к работе
            </h3>
            <p className="max-w-md mt-2">
              Опишите, что вы ищете, и наш AI проанализирует тысячи тайтлов,
              чтобы найти идеальное совпадение.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function RecommendationsGrid({
  items,
  onAdd,
}: {
  items: RecommendationItem[];
  type?: 'internal' | 'external' | 'ai';
  onAdd: (item: RecommendationItem) => void;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item, idx) => (
        <motion.div
          key={`${item.title}-${idx}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: idx * 0.05 }}
        >
          <Card className="h-full flex flex-col hover:shadow-2xl transition-all duration-300 overflow-hidden group border-0 shadow-md bg-card/80 backdrop-blur-sm hover:-translate-y-1">
            <div className="relative aspect-[2/3] overflow-hidden bg-muted">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.title}
                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-muted to-muted/50">
                  <Library className="w-12 h-12 text-muted-foreground/30" />
                </div>
              )}
              <div className="absolute top-2 right-2 flex gap-1">
                {item.rating && (
                  <Badge className="bg-black/70 text-white backdrop-blur-md shadow-lg font-bold border-0 px-2.5 py-1">
                    <Star className="w-3 h-3 mr-1 fill-amber-400 text-amber-400" />
                    {item.rating}
                  </Badge>
                )}
              </div>

              {/* Enhanced Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-4">
                <Button
                  size="lg"
                  className="w-full gap-2 font-semibold shadow-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  onClick={() => onAdd(item)}
                >
                  <Plus className="w-5 h-5" />
                  Add to Library
                </Button>
              </div>
            </div>
            <CardHeader className="p-4 pb-2 space-y-2">
              <CardTitle
                className="line-clamp-1 text-base font-bold"
                title={item.title}
              >
                {item.title}
              </CardTitle>
              <div className="flex flex-wrap gap-1.5">
                {(item.genres || []).slice(0, 2).map((g: string, i: number) => {
                  const colors = [
                    'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
                    'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
                    'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30',
                    'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
                  ];
                  return (
                    <Badge
                      key={g}
                      variant="outline"
                      className={`text-[10px] h-5 px-2 font-medium ${colors[i % colors.length]}`}
                    >
                      {g}
                    </Badge>
                  );
                })}
                {item.category && (
                  <Badge
                    variant="outline"
                    className="text-[10px] h-5 px-2 bg-muted/50"
                  >
                    {item.category}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2 flex-grow">
              {item.description && (
                <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                  {item.description}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col space-y-3">
          <Skeleton className="h-[300px] w-full rounded-xl" />
          <div className="space-y-2 p-2">
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-4 w-[60%]" />
            <Skeleton className="h-16 w-full mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}
