# Color System Documentation

## Overview
We utilize the **OKLCH** color space for our design system. OKLCH offers better perceptual uniformity compared to HSL and RGB, making it ideal for creating accessible and harmonious color palettes.

## Implementation
Colors are defined as CSS variables in `src/index.css`.
We follow the Tailwind CSS v4 conventions using `@theme inline`.

### Color Palette

| Variable | Description | Light Mode Example | Dark Mode Example |
|----------|-------------|--------------------|-------------------|
| `--background` | Page background | `oklch(1 0 0)` (White) | `oklch(0.141 0.005 285.823)` (Dark Blue) |
| `--foreground` | Default text color | `oklch(0.141 0.005 285.823)` | `oklch(0.985 0 0)` (White) |
| `--primary` | Primary brand color | `oklch(0.21 0.006 285.885)` | `oklch(0.92 0.004 286.32)` |
| `--muted` | Muted backgrounds | `oklch(0.967 0.001 286.375)` | `oklch(0.274 0.006 286.033)` |
| `--destructive` | Error/Danger actions | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` |

## Theming Mechanism
- **Class-based**: Use the `.dark` class on the root element (`<html>`).
- **Context**: Managed via `ThemeContext.tsx` and persisted in `localStorage`.
- **System Preference**: Automatically detects system preference on first load.

## Best Practices
1. **Always use variables**: Never hardcode colors. Use `bg-background`, `text-primary`, etc.
2. **Opacity modifiers**: Use standard slash syntax, e.g., `bg-primary/20`.
3. **Contrast**: Ensure text on colored backgrounds is accessible.

## Adding New Colors
If adding a new color, define it in both `:root` and `.dark` blocks in `src/index.css` using OKLCH values.
