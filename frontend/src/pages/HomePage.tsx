import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { mediaApi, type MediaEntry } from '../api/media';
import { groupsApi, type GroupStats } from '../api/groups';
import AddMediaModal from '../components/AddMediaModal';
import CreateGroupModal from '../components/CreateGroupModal';
import ContextMenu from '../components/ContextMenu';
import { FaPlus, FaLayerGroup, FaEdit, FaTrash, FaCog, FaUser } from 'react-icons/fa';
import '../styles/Home.css';

// Using @hello-pangea/dnd for Drag and Drop
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';

export default function HomePage() {
  const { user, logout } = useAuthStore();
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
  
  // Context Menu
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; groupId: number } | null>(null);

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
    // Note: Backend persistence for order is not implemented yet, so this is visual only for session
  };

  // Context Menu Handlers
  const handleContextMenu = (e: React.MouseEvent, groupId: number) => {
    e.preventDefault();
    setContextMenu({ x: e.pageX, y: e.pageY, groupId });
  };

  const handleDeleteGroup = async (id: number) => {
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

  return (
    <div className="home-container" onClick={() => setContextMenu(null)}>
      <header className="home-header">
        <div className="header-content">
          <Link to="/" style={{ textDecoration: 'none', color: 'white' }}>
            <h1>Web Titles Tracker</h1>
          </Link>
          <div className="user-section">
            <Link to="/profile" className="nav-link" title="Профиль">
              <FaUser /> {user?.username}
            </Link>
            <Link to="/settings" className="nav-link" title="Настройки">
              <FaCog />
            </Link>
            <button onClick={logout} className="btn-logout">Выйти</button>
          </div>
        </div>
      </header>

      <div className="main-layout-wrapper">
        
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <h3>Группы</h3>
            <button className="btn-icon" onClick={() => { setEditingGroup(null); setIsGroupModalOpen(true); }} title="Создать группу">
              <FaPlus size={12} />
            </button>
          </div>
          
          <div className="groups-list">
            <div 
              className={`group-item ${selectedGroupId === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedGroupId('all')}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <FaLayerGroup />
                <span>Все записи</span>
              </div>
            </div>

            <div 
              className={`group-item ${selectedGroupId === null ? 'active' : ''}`}
              onClick={() => setSelectedGroupId(null)}
            >
              <span>📂 Без группы</span>
              <span className="count">{groupStats?.ungrouped || 0}</span>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="groups">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {groupStats?.groups.map((group, index) => (
                      <Draggable key={group.id} draggableId={group.id.toString()} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`group-item ${selectedGroupId === group.id ? 'active' : ''}`}
                            onClick={() => setSelectedGroupId(group.id)}
                            onContextMenu={(e) => handleContextMenu(e, group.id)}
                            style={{ ...provided.draggableProps.style }}
                          >
                            <span>📁 {group.name}</span>
                            <span className="count">{group.count}</span>
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
        </aside>

        <main className="home-main">
          <div className="content-wrapper">
            <div className="page-header">
              <h2>
                {selectedGroupId === 'all' ? 'Моя медиатека' : 
                 selectedGroupId === null ? 'Без группы' : 
                 groupStats?.groups.find(g => g.id === selectedGroupId)?.name || 'Группа'}
              </h2>
              <button className="btn-add" onClick={() => setIsAddModalOpen(true)}>+ Добавить</button>
            </div>

            {isLoading && (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Загрузка...</p>
              </div>
            )}

            {error && (
              <div className="error-state">
                <p>{error}</p>
                <button onClick={handleRefresh} className="btn-retry">Попробовать снова</button>
              </div>
            )}

            {!isLoading && !error && mediaList.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3>Список пуст</h3>
                <p>В этой категории пока нет записей</p>
                <button className="btn-add-large" onClick={() => setIsAddModalOpen(true)}>+ Добавить запись</button>
              </div>
            )}

            {!isLoading && !error && mediaList.length > 0 && (
              <div className="media-grid">
                {mediaList.map(media => (
                  <div key={media.id} className="media-card">
                    {media.image && (
                      <div className="media-image">
                        <img src={media.image} alt={media.title} />
                      </div>
                    )}
                    <div className="media-content">
                      <h3 className="media-title">{media.title}</h3>
                      {media.category && <span className="media-category">{media.category}</span>}
                      <div className="media-rating">
                        <span className="rating-stars">{'⭐'.repeat(Math.round(media.rating / 2))}</span>
                        <span className="rating-value">{media.rating}/10</span>
                      </div>
                      {media.description && (
                        <p className="media-description">{media.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

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

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          options={[
            {
              label: 'Редактировать',
              icon: <FaEdit />,
              onClick: () => handleEditGroup(contextMenu.groupId),
            },
            {
              label: 'Удалить',
              icon: <FaTrash />,
              confirm: true,
              color: '#ef4444',
              onClick: () => handleDeleteGroup(contextMenu.groupId),
            },
          ]}
        />
      )}
    </div>
  );
}
