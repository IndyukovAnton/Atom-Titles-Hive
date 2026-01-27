import { useState } from 'react';
import { Plus, X, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useFormContext, Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';

interface TagInputProps {
  name: string;
  label?: string;
  placeholder?: string;
  suggestions?: string[];
  disabled?: boolean;
}

export function TagInput({
  name,
  label,
  suggestions = [],
  disabled,
}: TagInputProps) {
  const { control } = useFormContext();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  return (
    <div className="space-y-2">
      {label && <Label className="text-sm font-medium">{label}</Label>}
      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          const currentTags = (field.value as string[]) || [];

          const handleSelect = (tag: string) => {
            const newValue = currentTags.includes(tag)
              ? currentTags.filter((t) => t !== tag)
              : [...currentTags, tag];
            field.onChange(newValue);
          };

          const createTag = () => {
            const trimmed = inputValue.trim();
            if (trimmed && !currentTags.includes(trimmed)) {
              field.onChange([...currentTags, trimmed]);
              setInputValue('');
            }
          };

          const removeTag = (tag: string) => {
            field.onChange(currentTags.filter((t) => t !== tag));
          };

          return (
            <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-all min-h-[42px]">
              {currentTags.map((tag: string) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="flex items-center gap-1 animate-in fade-in zoom-in duration-200"
                >
                  {tag}
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-destructive transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTag(tag);
                    }}
                  />
                </Badge>
              ))}

              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    disabled={disabled}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Добавить
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Поиск или ввод..."
                      value={inputValue}
                      onValueChange={setInputValue}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && inputValue) {
                          createTag();
                        }
                      }}
                    />
                    <CommandList>
                      <CommandEmpty>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-xs h-8"
                          onClick={createTag}
                        >
                          Создать "{inputValue}"
                        </Button>
                      </CommandEmpty>
                      <CommandGroup heading="Предложения">
                        {suggestions.map((tag) => (
                          <CommandItem
                            key={tag}
                            onSelect={() => handleSelect(tag)}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                currentTags.includes(tag)
                                  ? 'opacity-100'
                                  : 'opacity-0',
                              )}
                            />
                            {tag}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          );
        }}
      />
    </div>
  );
}
