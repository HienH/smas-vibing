/**
 * @fileoverview Unit tests for Button component.
 *
 * Tests button rendering, variants, sizes, and user interactions.
 */

import { render, screen } from '@/test-utils/render'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  describe('Rendering', () => {
    it('should render button with default props', () => {
      render(<Button>Click me</Button>)
      
      const button = screen.getByRole('button', { name: 'Click me' })
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('bg-green-600', 'text-white', 'hover:bg-green-700')
    })

    it('should render button with custom className', () => {
      render(<Button className="custom-class">Custom Button</Button>)
      
      const button = screen.getByRole('button', { name: 'Custom Button' })
      expect(button).toHaveClass('custom-class')
    })

    it('should render disabled button', () => {
      render(<Button disabled>Disabled Button</Button>)
      
      const button = screen.getByRole('button', { name: 'Disabled Button' })
      expect(button).toBeDisabled()
      expect(button).toHaveClass('disabled:opacity-50', 'disabled:pointer-events-none')
    })
  })

  describe('Variants', () => {
    it('should render default variant', () => {
      render(<Button variant="default">Default Button</Button>)
      
      const button = screen.getByRole('button', { name: 'Default Button' })
      expect(button).toHaveClass('bg-green-600', 'text-white', 'hover:bg-green-700')
    })

    it('should render outline variant', () => {
      render(<Button variant="outline">Outline Button</Button>)
      
      const button = screen.getByRole('button', { name: 'Outline Button' })
      expect(button).toHaveClass('border', 'border-input', 'bg-background')
    })

    it('should render ghost variant', () => {
      render(<Button variant="ghost">Ghost Button</Button>)
      
      const button = screen.getByRole('button', { name: 'Ghost Button' })
      expect(button).toHaveClass('hover:bg-accent', 'hover:text-accent-foreground')
    })

    it('should render link variant', () => {
      render(<Button variant="link">Link Button</Button>)
      
      const button = screen.getByRole('button', { name: 'Link Button' })
      expect(button).toHaveClass('underline-offset-4', 'hover:underline', 'text-primary')
    })
  })

  describe('Sizes', () => {
    it('should render default size', () => {
      render(<Button size="default">Default Size</Button>)
      
      const button = screen.getByRole('button', { name: 'Default Size' })
      expect(button).toHaveClass('h-10', 'px-4', 'py-2')
    })

    it('should render small size', () => {
      render(<Button size="sm">Small Button</Button>)
      
      const button = screen.getByRole('button', { name: 'Small Button' })
      expect(button).toHaveClass('h-9', 'px-3', 'rounded-md')
    })

    it('should render large size', () => {
      render(<Button size="lg">Large Button</Button>)
      
      const button = screen.getByRole('button', { name: 'Large Button' })
      expect(button).toHaveClass('h-11', 'px-8', 'rounded-md')
    })

    it('should render icon size', () => {
      render(<Button size="icon">Icon Button</Button>)
      
      const button = screen.getByRole('button', { name: 'Icon Button' })
      expect(button).toHaveClass('h-10', 'w-10')
    })
  })

  describe('User Interactions', () => {
    it('should handle click events', async () => {
      const user = userEvent.setup()
      const handleClick = jest.fn()
      
      render(<Button onClick={handleClick}>Clickable Button</Button>)
      
      const button = screen.getByRole('button', { name: 'Clickable Button' })
      await user.click(button)
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should not handle click events when disabled', async () => {
      const user = userEvent.setup()
      const handleClick = jest.fn()
      
      render(<Button disabled onClick={handleClick}>Disabled Button</Button>)
      
      const button = screen.getByRole('button', { name: 'Disabled Button' })
      await user.click(button)
      
      expect(handleClick).not.toHaveBeenCalled()
    })

    it('should handle keyboard interactions', async () => {
      const user = userEvent.setup()
      const handleClick = jest.fn()
      
      render(<Button onClick={handleClick}>Keyboard Button</Button>)
      
      const button = screen.getByRole('button', { name: 'Keyboard Button' })
      button.focus()
      await user.keyboard('{Enter}')
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<Button aria-label="Accessible button">Button</Button>)
      
      const button = screen.getByRole('button', { name: 'Accessible button' })
      expect(button).toBeInTheDocument()
    })

    it('should be focusable', () => {
      render(<Button>Focusable Button</Button>)
      
      const button = screen.getByRole('button', { name: 'Focusable Button' })
      button.focus()
      
      expect(button).toHaveFocus()
    })

    it('should have focus visible styles', () => {
      render(<Button>Focus Button</Button>)
      
      const button = screen.getByRole('button', { name: 'Focus Button' })
      expect(button).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2')
    })
  })

  describe('asChild prop', () => {
    it('should render as child component when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      )
      
      const link = screen.getByRole('link', { name: 'Link Button' })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/test')
      expect(link).toHaveClass('bg-green-600', 'text-white')
    })
  })
}) 