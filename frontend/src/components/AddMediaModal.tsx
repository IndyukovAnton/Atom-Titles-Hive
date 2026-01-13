import { useState, type FormEvent, useEffect } from 'react';
import { mediaApi, type CreateMediaData } from '../api/media';
import { groupsApi, type Group } from '../api/groups';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

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
        groupId: null,
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
      if (dataToSend.groupId === null) delete dataToSend.groupId;

      await mediaApi.create(dataToSend);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create media');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Добавить запись</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6 pt-2">
          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-4">
              {error}
            </div>
          )}

          <form id="add-media-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Название <span className="text-destructive">*</span></Label>
              <Input
                id="title"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Введите название"
                required
                autoFocus
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Категория</Label>
                <Select
                  value={formData.category}
                  onValueChange={(val) => setFormData({ ...formData, category: val })}
                  disabled={isLoading}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Movie">Фильм</SelectItem>
                    <SelectItem value="Series">Сериал</SelectItem>
                    <SelectItem value="Book">Книга</SelectItem>
                    <SelectItem value="Game">Игра</SelectItem>
                    <SelectItem value="Anime">Аниме</SelectItem>
                    <SelectItem value="Manga">Манга</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rating">Оценка (1-10) <span className="text-destructive">*</span></Label>
                <Input
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
                         // handle empty
                    }
                  }}
                  onBlur={e => {
                    let val = parseInt(e.target.value);
                    if (isNaN(val) || val < 1) val = 1;
                    if (val > 10) val = 10;
                    setFormData({ ...formData, rating: val });
                  }}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="group">Группа</Label>
              <Select
                value={formData.groupId?.toString() || "null"}
                onValueChange={(val) => setFormData({ ...formData, groupId: val === "null" ? null : Number(val) })}
                disabled={isLoading}
              >
                <SelectTrigger id="group">
                  <SelectValue placeholder="Без группы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Без группы</SelectItem>
                  {groups.map(g => (
                    <SelectItem key={g.id} value={g.id.toString()}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">URL обложки</Label>
              <Input
                type="url"
                id="image"
                value={formData.image}
                onChange={e => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://example.com/image.jpg"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Описание / Заметки</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ваши мысли..."
                rows={3}
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Дата начала</Label>
                <Input
                  type="date"
                  id="startDate"
                  value={formData.startDate}
                  onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Дата окончания</Label>
                <Input
                  type="date"
                  id="endDate"
                  value={formData.endDate}
                  onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                  disabled={isLoading}
                />
              </div>
            </div>
          </form>
        </ScrollArea>

        <DialogFooter className="p-6 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Отмена
          </Button>
          <Button type="submit" form="add-media-form" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
