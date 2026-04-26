import { forwardRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label?: string;
  required?: boolean;
  description?: string;
}

/**
 * Обёртка над Input с интеграцией react-hook-form
 * Автоматически отображает ошибки валидации.
 * Для type="password" добавляет toggle Eye/EyeOff и подавляет дублирующий
 * браузерный «реveal» (Edge ::-ms-reveal — см. правило в index.css).
 */
export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ name, label, required, description, className, type, ...props }, ref) => {
    const {
      register,
      formState: { errors },
    } = useFormContext();

    const error = errors[name];
    const errorMessage = error?.message as string | undefined;

    const isPassword = type === 'password';
    const [showPassword, setShowPassword] = useState(false);
    const effectiveType = isPassword && showPassword ? 'text' : type;

    const { ref: registerRef, ...registerProps } = register(name, {
      valueAsNumber: type === 'number',
    });

    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={name}>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
        <div className={isPassword ? 'relative' : undefined}>
          <Input
            id={name}
            type={effectiveType}
            {...registerProps}
            {...props}
            ref={(e) => {
              registerRef(e);
              if (typeof ref === 'function') {
                ref(e);
              } else if (ref) {
                (ref as React.MutableRefObject<HTMLInputElement | null>).current = e;
              }
            }}
            className={cn(
              error && 'border-destructive focus-visible:ring-destructive',
              isPassword && 'pr-10',
              className,
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${name}-error` : description ? `${name}-description` : undefined}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
        {description && !error && (
          <p id={`${name}-description`} className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
        {error && (
          <p id={`${name}-error`} className="text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
