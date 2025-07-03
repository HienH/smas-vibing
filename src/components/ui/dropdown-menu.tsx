/**
 * @fileoverview Dropdown menu UI component using shadcn/ui pattern.
 *
 * Provides accessible dropdown menu primitives for filtering and selection.
 */
'use client'
import * as React from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'

/**
 * @description DropdownMenu root component.
 */
export const DropdownMenu = DropdownMenuPrimitive.Root

/**
 * @description DropdownMenu trigger component.
 */
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

/**
 * @description DropdownMenu content component.
 */
export const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Content
    ref={ref}
    className={
      'z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white p-1 shadow-md focus:outline-none ' +
      (className || '')
    }
    {...props}
  />
))
DropdownMenuContent.displayName = 'DropdownMenuContent'

/**
 * @description DropdownMenu item component.
 */
export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={
      'flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-green-100 focus:text-green-900 ' +
      (className || '')
    }
    {...props}
  />
))
DropdownMenuItem.displayName = 'DropdownMenuItem' 