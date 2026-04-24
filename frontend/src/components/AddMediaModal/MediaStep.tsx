import { useFormContext } from 'react-hook-form';
import { Download, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CoverImagePicker } from '@/components/CoverImagePicker';

interface MediaStepProps {
  isSubmitting: boolean;
  coverMode: 'file' | 'search';
  setCoverMode: (mode: 'file' | 'search') => void;
  currentImage?: string;
  error: string | null;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function MediaStep({
  isSubmitting,
  coverMode,
  setCoverMode,
  currentImage,
  error,
  handleFileUpload,
}: MediaStepProps) {
  const { setValue, watch } = useFormContext();
  const title = watch('title') as string | undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-col h-full">
        <Tabs
          value={coverMode}
          onValueChange={(v) => setCoverMode(v as 'file' | 'search')}
          className="w-full flex-1 flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <Label className="text-base font-medium">Обложка</Label>
            <TabsList className="grid w-[300px] grid-cols-2">
              <TabsTrigger value="file" className="cursor-pointer">
                Загрузить
              </TabsTrigger>
              <TabsTrigger value="search" className="cursor-pointer">
                Поиск
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 min-h-0">
            <TabsContent value="file" className="mt-0 space-y-6">
              <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-10 hover:bg-muted/50 transition-colors cursor-pointer relative">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isSubmitting}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="text-center space-y-2">
                  <div className="bg-primary/10 p-4 rounded-full inline-flex mb-2">
                    <Download className="h-8 w-8 text-primary" />
                  </div>
                  <p className="font-medium">Нажмите для выбора файла</p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, WEBP (Макс 5MB)
                  </p>
                </div>
              </div>

              {currentImage && (
                <div className="flex justify-center animate-in fade-in zoom-in-95 duration-200">
                  <div className="relative w-[180px] aspect-[2/3] rounded-lg overflow-hidden shadow-md border group">
                    <img
                      src={currentImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setValue('image', '')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="search" className="mt-0 h-full flex flex-col">
              <CoverImagePicker
                initialQuery={title ? `Обложка ${title}` : ''}
                onSelect={(base64) => {
                  setValue('image', base64);
                  setCoverMode('file');
                  toast.success('Обложка выбрана!');
                }}
                className="flex-1"
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
