import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { Button } from '../ui/button';

describe('Button Component', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>);
    
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('should handle onClick event', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button', { name: 'Click me' });
    await user.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should apply default variant', () => {
    render(<Button>Default Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-variant', 'default');
  });

  it('should apply destructive variant', () => {
    render(<Button variant="destructive">Delete</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-variant', 'destructive');
  });

  it('should apply outline variant', () => {
    render(<Button variant="outline">Outline</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-variant', 'outline');
  });

  it('should apply secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-variant', 'secondary');
  });

  it('should apply ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-variant', 'ghost');
  });

  it('should apply link variant', () => {
    render(<Button variant="link">Link</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-variant', 'link');
  });

  it('should apply default size', () => {
    render(<Button>Default Size</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-size', 'default');
  });

  it('should apply small size', () => {
    render(<Button size="sm">Small</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-size', 'sm');
  });

  it('should apply large size', () => {
    render(<Button size="lg">Large</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-size', 'lg');
  });

  it('should apply icon size', () => {
    render(<Button size="icon" aria-label="Icon button">🔍</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-size', 'icon');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should not trigger onClick when disabled', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should apply custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('should render as child component when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    
    const link = screen.getByRole('link', { name: 'Link Button' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test');
  });

  it('should combine variant and size props', () => {
    render(<Button variant="destructive" size="lg">Large Destructive</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-variant', 'destructive');
    expect(button).toHaveAttribute('data-size', 'lg');
  });

  it('should treat button as submit type by default (browser behavior)', () => {
    render(<Button>Submit</Button>);
    
    const button = screen.getByRole('button');
    // React/Shadcn does not explicitly set type="submit" by default in DOM, 
    // relying on browser default. checking for missing attribute.
    expect(button).not.toHaveAttribute('type');
  });

  it('should accept custom type attribute', () => {
    render(<Button type="submit">Submit</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'submit');
  });
});
