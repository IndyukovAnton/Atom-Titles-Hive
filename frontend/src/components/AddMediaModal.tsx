import { useState, type FormEvent, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { mediaApi, type CreateMediaData } from '../api/media';
import { groupsApi, type Group } from '../api/groups';
import { FaTimes } from 'react-icons/fa';
import '../styles/Modal.css';
import { Button } from "./Button/Button";

interface AddMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddMediaModal({ isOpen, onClose, onSuccess }: AddMediaModalProps) {
  const [formData, setFormData] = useState<CreateMediaData>({
    title: '',
    rating: 5,
    category: 'Movie',
    description: '',
    image: '',
    startDate: '',
    endDate: '',
    groupId: null,
  });
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load groups and reset form
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        rating: 5,
        category: 'Movie',
        description: '',
        image: '',
        startDate: '',
        endDate: '',
        groupId: null, // Reset group
      });
      setError(null);
      loadGroups();
    }
  }, [isOpen]);

  const loadGroups = async () => {
    try {
      const data = await groupsApi.getAll();
      setGroups(data);
    } catch (e) {
      console.error('Failed to load groups for select', e);
    }
  };

  // ... scroll lock effect ...
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const dataToSend = { ...formData };
      
      if (!dataToSend.startDate) delete dataToSend.startDate;
      if (!dataToSend.endDate) delete dataToSend.endDate;
      if (!dataToSend.image) delete dataToSend.image;
      if (!dataToSend.description) delete dataToSend.description;
      if (dataToSend.groupId === null) delete dataToSend.groupId; // Send undefined if null to skip or handle properly backend

      await mediaApi.create(dataToSend);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create media');
    } finally {
      setIsLoading(false);
    }
  };

  const modalContent = (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Добавить запись</h2>
          <Button onClick={onClose}>
            <FaTimes />
          </Button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="title">Название <span style={{color:'red'}}>*</span></label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="Введите название"
              required
              autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Категория</label>
              <select
                id="category"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Movie">Фильм</option>
                <option value="Series">Сериал</option>
                <option value="Book">Книга</option>
                <option value="Game">Игра</option>
                <option value="Anime">Аниме</option>
                <option value="Manga">Манга</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="rating">Оценка (1-10) <span style={{color:'red'}}>*</span></label>
              <input
                type="number"
                id="rating"
                min="1"
                max="10"
                value={formData.rating}
                onChange={e => {
                  const val = parseInt(e.target.value);
                  if (val >= 1 && val <= 10) {
                    setFormData({ ...formData, rating: val });
                  } else if (e.target.value === '') {
                    // allow empty temporarily
                  }
                }}
                onBlur={e => {
                   let val = parseInt(e.target.value);
                   if (isNaN(val) || val < 1) val = 1;
                   if (val > 10) val = 10;
                   setFormData({ ...formData, rating: val });
                }}
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="group">Группа (Списка)</label>
            <select
              id="group"
              value={formData.groupId || ''}
              onChange={e => setFormData({ ...formData, groupId: e.target.value ? Number(e.target.value) : null })}
            >
              <option value="">Без группы</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="image">URL обложки</label>
            <input
              type="url"
              id="image"
              value={formData.image}
              onChange={e => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </div>


          <div className="form-group">
            <label htmlFor="description">Описание / Заметки</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ваши мысли..."
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">Дата начала</label>
              <input
                type="date"
                id="startDate"
                value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="endDate">Дата окончания</label>
              <input
                type="date"
                id="endDate"
                value={formData.endDate}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer">
            <Button onClick={onClose}>
              Отмена
            </Button>
            <Button disabled={isLoading} onClick={handleSubmit}>
              {isLoading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
