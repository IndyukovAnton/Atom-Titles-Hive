import { forwardRef } from 'react';
import { useFormContext } from 'react-hook-form';
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
 * Автоматически отображает ошибки валидации
 */
export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ name, label, required, description, className, ...props }, ref) => {
    const {
      register,
      formState: { errors },
    } = useFormContext();

    const error = errors[name];
    const errorMessage = error?.message as string | undefined;

    const { ref: registerRef, ...registerProps } = register(name, { valueAsNumber: props.type === 'number' });

    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={name}>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
        <Input
          id={name}
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
          className={cn(error && 'border-destructive focus-visible:ring-destructive', className)}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : description ? `${name}-description` : undefined}
        />
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
