'use client'

import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { AppLayout } from './AppLayout'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  const { user, loading, isSettingUpUser } = useAuth()
  
  // Auth pages that should not have the app layout
  const authPages = ['/auth/signin', '/auth/signup', '/auth/confirm']
  const isAuthPage = authPages.some(page => pathname.startsWith(page))
  
  // If it's an auth page, user is not authenticated, still loading, or user is being set up, render without app layout
  if (isAuthPage || !user || loading || isSettingUpUser) {
    return <>{children}</>
  }
  
  // Otherwise, render with full app layout (sidebar, header)
  return <AppLayout>{children}</AppLayout>
}