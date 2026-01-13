# Style Guide & UI Component System

## Overview

Atom Titles-Hive uses a modern, unified styling system based on **Tailwind CSS v4** and **shadcn/ui**. This ensures consistency, accessibility, and ease of maintenance across the entire frontend application.

## Core Technologies

- **Tailwind CSS v4**: Utility-first CSS framework for layout, spacing, colors, and typography.
- **shadcn/ui**: Reusable component library built on Radix UI and Tailwind CSS.
- **Lucide React**: Icon library for consistent visual language.
- **Class Variance Authority (CVA)**: For managing component variants.

## Theming

The application supports both **Light** and **Dark** modes.
- Colors are defined as CSS variables in `frontend/src/index.css` (using OKLCH color space for better perceptional uniformity).
- The theme is toggled via `ThemeContext` which applies the `.dark` class to the `<html>` element.

### Color Palette

Colors are semantic:
- `primary`: Main brand color.
- `secondary`: Secondary actions / backgrounds.
- `muted`: Subdued text and backgrounds.
- `destructive`: Errors and danger actions.
- `background` / `foreground`: Base page colors.

## Component Usage

All UI components are located in `frontend/src/components/ui`.
Always import components from the alias `@/components/ui/...`.

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Example
<Card>
  <CardContent>
    <Button variant="default">Click me</Button>
  </CardContent>
</Card>
```

## Layouts

- **AuthLayout**: Centered card layout for authentication pages.
- **MainLayout**: Minimal container for authenticated pages (Sidebar + Content).
- **Responsive Design**: Mobile-first approach. Use `md:`, `lg:`, `xl:` breakpoints.

## Icons

Use `lucide-react` for all icons.

```tsx
import { User, Settings, LogOut } from 'lucide-react';
```

## Best Practices

1. **Avoid custom CSS**: Use Tailwind utilities whenever possible.
2. **Avoid inline styles**: Use `className` with Tailwind.
3. **Use `cn()`**: generic `classNames` utility for merging Tailwind classes conditionnally.
   ```tsx
   <div className={cn("base-class", isActive && "active-class")}>...</div>
   ```
4. **Spacing**: Use standard Tailwind spacing (e.g., `p-4`, `m-2`, `gap-6`).

## Component directory structure

- `src/components/ui/` - Generic shadcn components.
- `src/components/` - Domain-specific compounds (e.g., `AddMediaModal`).
- `src/layouts/` - Page wrappers.
