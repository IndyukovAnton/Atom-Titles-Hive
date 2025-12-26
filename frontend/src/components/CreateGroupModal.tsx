import { useState, type FormEvent, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { groupsApi } from '../api/groups';
import { FaTimes } from 'react-icons/fa';
import '../styles/Modal.css';
import { Button } from "./Button/Button";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: { id: number; name: string } | null;
}

export default function CreateGroupModal({ isOpen, onClose, onSuccess, initialData }: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialData ? initialData.name : '');
      setError(null);
    }
  }, [isOpen, initialData]);

  // Lock scroll
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
      if (initialData) {
        await groupsApi.update(initialData.id, { name });
      } else {
        await groupsApi.create({ name });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save group');
    } finally {
      setIsLoading(false);
    }
  };

  const modalContent = (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{initialData ? 'Редактировать группу' : 'Создать группу'}</h2>
          <Button onClick={onClose}>
            <FaTimes />
          </Button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="groupName">Название</label>
            <input
              type="text"
              id="groupName"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Например: 'Must Watch', 'Anime 2024'"
              required
              autoFocus
            />
          </div>

          <div className="modal-footer">
            <Button onClick={onClose}>
              Отмена
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'Сохранение...' : (initialData ? 'Сохранить' : 'Создать')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
