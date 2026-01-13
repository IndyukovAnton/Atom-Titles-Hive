import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { mediaApi, type MediaEntry } from '../api/media';
import { groupsApi, type GroupStats } from '../api/groups';
import AddMediaModal from '../components/AddMediaModal';
import CreateGroupModal from '../components/CreateGroupModal';
import { 
  Plus, 
  Layers, 
  FolderOpen, 
  Edit, 
  Trash, 
  Settings, 
  User, 
  LogOut, 
  Loader2, 
  Star
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mediaList, setMediaList] = useState<MediaEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<{id: number, name: string} | null>(null);
  
  // Groups & Filtering
  const [groupStats, setGroupStats] = useState<GroupStats | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null | 'all'>('all');
  
  useEffect(() => {
    loadData();
  }, [selectedGroupId]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [mediaData, statsData] = await Promise.all([
        mediaApi.getAll({ 
          groupId: selectedGroupId === 'all' ? undefined : selectedGroupId 
        }),
        groupsApi.getStats()
      ]);
      
      setMediaList(mediaData);
      setGroupStats(statsData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Не удалось загрузить данные');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadData();
  };

  // DnD Handler
  const onDragEnd = (result: DropResult) => {
    if (!result.destination || !groupStats) return;

    const items = Array.from(groupStats.groups);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setGroupStats({ ...groupStats, groups: items });
  };

  const handleDeleteGroup = async (id: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту группу?')) return;
    try {
      await groupsApi.delete(id);
      if (selectedGroupId === id) setSelectedGroupId('all');
      loadData();
    } catch (e) {
      alert('Ошибка при удалении группы');
    }
  };

  const handleEditGroup = (id: number) => {
    const group = groupStats?.groups.find(g => g.id === id);
    if (group) {
      setEditingGroup({ id: group.id, name: group.name });
      setIsGroupModalOpen(true);
    }
  };

  const getPageTitle = () => {
    if (selectedGroupId === 'all') return 'Моя медиатека';
    if (selectedGroupId === null) return 'Без группы';
    return groupStats?.groups.find(g => g.id === selectedGroupId)?.name || 'Группа';
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/20 flex flex-col shrink-0">
        <div className="p-4 border-b flex items-center justify-between h-14">
          <span className="font-semibold tracking-tight">Группы</span>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => { setEditingGroup(null); setIsGroupModalOpen(true); }} 
            title="Создать группу"
            className="h-8 w-8"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-1">
            <Button
              variant={selectedGroupId === 'all' ? "secondary" : "ghost"}
              className={cn("w-full justify-start", selectedGroupId === 'all' && "bg-secondary/50 font-medium")}
              onClick={() => setSelectedGroupId('all')}
            >
              <Layers className="mr-2 h-4 w-4" />
              Все записи
            </Button>

            <Button
              variant={selectedGroupId === null ? "secondary" : "ghost"}
              className={cn("w-full justify-start justify-between group", selectedGroupId === null && "bg-secondary/50 font-medium")}
              onClick={() => setSelectedGroupId(null)}
            >
              <div className="flex items-center">
                <FolderOpen className="mr-2 h-4 w-4" />
                Без группы
              </div>
              {groupStats?.ungrouped ? (
                <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full">{groupStats.ungrouped}</span>
              ) : null}
            </Button>

            <div className="my-2 border-t border-border/50" />
            
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="groups">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-1">
                    {groupStats?.groups.map((group, index) => (
                      <Draggable key={group.id} draggableId={group.id.toString()} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <ContextMenu>
                              <ContextMenuTrigger asChild>
                                <Button
                                  variant={selectedGroupId === group.id ? "secondary" : "ghost"}
                                  className={cn("w-full justify-start justify-between font-normal", selectedGroupId === group.id && "bg-secondary/50 font-medium")}
                                  onClick={() => setSelectedGroupId(group.id)}
                                >
                                  <span className="truncate">{group.name}</span>
                                  {group.count > 0 && (
                                    <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full ml-auto">{group.count}</span>
                                  )}
                                </Button>
                              </ContextMenuTrigger>
                              <ContextMenuContent>
                                <ContextMenuItem onClick={() => handleEditGroup(group.id)}>
                                  <Edit className="mr-2 h-4 w-4" /> Редактировать
                                </ContextMenuItem>
                                <ContextMenuItem onClick={() => handleDeleteGroup(group.id)} className="text-destructive focus:text-destructive">
                                  <Trash className="mr-2 h-4 w-4" /> Удалить
                                </ContextMenuItem>
                              </ContextMenuContent>
                            </ContextMenu>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full min-w-0">
        <header className="h-14 border-b flex items-center justify-between px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <h1 className="font-bold text-lg tracking-tight hidden md:block">Titles Tracker</h1>
          <h2 className="text-base font-medium md:hidden">{getPageTitle()}</h2>
          
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-medium text-muted-foreground hidden md:block border-r pr-4 mr-2">
              {getPageTitle()}
            </h2>

            <Button onClick={() => setIsAddModalOpen(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" /> Добавить
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{user?.username}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" /> Профиль
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" /> Настройки
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative bg-muted/10">
          <ScrollArea className="h-full w-full">
             <div className="p-6">
                {isLoading && (
                  <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mb-4" />
                    <p>Загрузка...</p>
                  </div>
                )}

                {error && (
                  <div className="flex flex-col items-center justify-center h-[50vh] text-destructive">
                    <p className="mb-4">{error}</p>
                    <Button onClick={handleRefresh} variant="outline">Попробовать снова</Button>
                  </div>
                )}

                {!isLoading && !error && mediaList.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground space-y-4">
                    <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-4xl">
                      📭
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold text-lg text-foreground">Список пуст</h3>
                      <p>В этой категории пока нет записей</p>
                    </div>
                    <Button onClick={() => setIsAddModalOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" /> Добавить запись
                    </Button>
                  </div>
                )}

                {!isLoading && !error && mediaList.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-12">
                    {mediaList.map(media => (
                      <Card key={media.id} className="overflow-hidden hover:shadow-lg transition-all hover:scale-[1.02] group border-muted">
                        <div className="aspect-[2/3] relative bg-muted overflow-hidden">
                          {media.image ? (
                            <img 
                              src={media.image} 
                              alt={media.title} 
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-secondary/50 text-muted-foreground">
                              No Image
                            </div>
                          )}
                          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-md flex items-center">
                            <Star className="h-3 w-3 text-yellow-400 mr-1 fill-yellow-400" />
                            {media.rating}
                          </div>
                          {media.category && (
                            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md">
                              {media.category}
                            </div>
                          )}
                        </div>
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="leading-tight text-base line-clamp-1" title={media.title}>
                             {media.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 h-20">
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {media.description || 'Нет описания'}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
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
        onClose={() => { setIsGroupModalOpen(false); setEditingGroup(null); }}
        onSuccess={handleRefresh}
        initialData={editingGroup}
      />
    </div>
  );
}
