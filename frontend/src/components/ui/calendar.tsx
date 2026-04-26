import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

// react-day-picker v9 переименовал большинство классов (caption → month_caption,
// table → month_grid, head_row → weekdays, и т.д.) и убрал nav_button_*.
// Этот компонент использует v9 API.
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row gap-4',
        month: 'flex flex-col gap-4',
        month_caption: 'flex items-center justify-center h-7 relative',
        caption_label: 'text-sm font-medium',
        nav: 'flex items-center gap-1 absolute right-1 top-1 z-10',
        button_previous: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 p-0 bg-transparent opacity-70 hover:opacity-100',
        ),
        button_next: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 p-0 bg-transparent opacity-70 hover:opacity-100',
        ),
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday:
          'text-muted-foreground w-9 h-8 font-normal text-[0.75rem] flex items-center justify-center',
        week: 'flex w-full mt-1',
        day: 'h-9 w-9 p-0 text-center text-sm relative focus-within:relative focus-within:z-20',
        day_button: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md',
        ),
        selected:
          '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground [&>button]:focus:bg-primary',
        today: '[&>button]:bg-accent [&>button]:text-accent-foreground',
        outside:
          '[&>button]:text-muted-foreground [&>button]:opacity-50 aria-selected:[&>button]:opacity-30',
        disabled: '[&>button]:text-muted-foreground [&>button]:opacity-40',
        range_start: 'rounded-l-md',
        range_end: 'rounded-r-md',
        range_middle:
          '[&>button]:bg-accent [&>button]:text-accent-foreground [&>button]:rounded-none',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: cls }) =>
          orientation === 'left' ? (
            <ChevronLeft className={cn('h-4 w-4', cls)} />
          ) : (
            <ChevronRight className={cn('h-4 w-4', cls)} />
          ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
