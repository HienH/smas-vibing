/**
 * @fileoverview Unit tests for utility functions.
 *
 * Tests the cn utility function for class name merging.
 */

import { cn } from '@/lib/utils'

describe('Utility Functions', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      const result = cn('class1', 'class2', 'class3')
      expect(result).toBe('class1 class2 class3')
    })

    it('should handle conditional classes', () => {
      const isActive = true
      const result = cn('base-class', isActive && 'active-class')
      expect(result).toBe('base-class active-class')
    })

    it('should handle false conditional classes', () => {
      const isActive = false
      const result = cn('base-class', isActive && 'active-class')
      expect(result).toBe('base-class')
    })

    it('should handle Tailwind classes with conflicts', () => {
      const result = cn('text-red-500', 'text-blue-500')
      expect(result).toBe('text-blue-500')
    })

    it('should handle empty strings and null values', () => {
      const result = cn('base-class', '', null, undefined, 'valid-class')
      expect(result).toBe('base-class valid-class')
    })

    it('should handle arrays of classes', () => {
      const result = cn(['class1', 'class2'], 'class3')
      expect(result).toBe('class1 class2 class3')
    })

    it('should handle objects with boolean values', () => {
      const result = cn({
        'base-class': true,
        'conditional-class': true,
        'false-class': false
      })
      expect(result).toBe('base-class conditional-class')
    })
  })
}) 