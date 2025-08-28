'use client'

import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { AppLayout } from './AppLayout'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  
  // Auth pages that should not have the app layout
  const authPages = ['/auth/signin', '/auth/signup', '/auth/confirm']
  const isAuthPage = authPages.some(page => pathname.startsWith(page))
  
  // If it's an auth page or user is not authenticated, render without app layout
  if (isAuthPage || !user) {
    return <>{children}</>
  }
  
  // Otherwise, render with full app layout (sidebar, header)
  return <AppLayout>{children}</AppLayout>
}