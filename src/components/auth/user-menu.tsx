/**
 * @fileoverview User menu component with sign out functionality.
 *
 * Displays user information and provides sign out option in a dropdown menu.
 */
'use client'

import { signOut, useSession } from 'next-auth/react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { LogOut, User } from 'lucide-react'

/**
 * @description User menu component with sign out functionality.
 * @returns {JSX.Element} The user menu component.
 */
export function UserMenu() {
    const { data: session } = useSession()

    const handleSignOut = async () => {
        try {
            await signOut({
                callbackUrl: '/',
                redirect: true
            })
        } catch (error) {
            // console.error('Sign out failed:', error)
        }
    }

    if (!session?.user) {
        return null
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="flex items-center gap-2 hover:bg-green-100"
                    aria-label="User menu"
                >
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">{session.user.name}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-red-600 focus:text-red-700 focus:bg-red-50"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
} 