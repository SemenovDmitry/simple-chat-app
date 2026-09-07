import type { PropsWithChildren } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const Layout = ({ children }: PropsWithChildren) => {
  const { user, logout } = useAuth()

  const getInitials = (email?: string | null) => {
    if (!email) return '?'
    return email.slice(0, 2).toUpperCase()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center text-lg font-semibold tracking-tight transition-opacity hover:opacity-80"
          >
            Simple Chat
          </Link>

          {/* Right side */}
          <div className="flex items-center">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs">
                      {getInitials(user.email)}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.email}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          Авторизован
                        </p>
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={logout}
                  >
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login" className="flex items-center">
                <Button size="sm">Войти</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto flex max-w-5xl flex-col px-4 py-6">
        {children}
      </main>
    </div>
  )
}

export default Layout