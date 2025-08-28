'use client';

import { useEffect, useState } from 'react';
import { useNotesStore } from '@/lib/store/notes';
import { useUIStore } from '@/lib/store/ui';
import { useFoldersStore } from '@/lib/store/folders';
import { useTagsStore } from '@/lib/store/tags';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const loadNotes = useNotesStore((state) => state.loadNotes);
  const loadFolders = useFoldersStore((state) => state.loadFolders);
  const loadTags = useTagsStore((state) => state.loadTags);
  const { theme, sidebarOpen } = useUIStore();
  const [isLoading, setIsLoading] = useState(true);
  
  const showSidebar = pathname !== '/settings';

  
  // Auto-close sidebar on tablet breakpoint
  useEffect(() => {
    const handleResize = () => {
      // Close sidebar when screen width is less than 1024px (lg breakpoint)
      if (window.innerWidth < 1024) {
        useUIStore.getState().setSidebarOpen(false);
      } else {
        // Optionally reopen on larger screens
        useUIStore.getState().setSidebarOpen(true);
      }
    };

    // Check on mount
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  

  useEffect(() => {
    const initializeApp = async () => {
      // Load cached data on mount
      loadNotes();
      loadFolders();
      loadTags();
      
      // Initialize theme
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
      if (savedTheme) {
        useUIStore.getState().setTheme(savedTheme);
      }
      
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 300));
      setIsLoading(false);
    };
    
    initializeApp();
  }, [loadNotes, loadFolders, loadTags]);

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {showSidebar && <Sidebar />}
      
      {/* Overlay for mobile when sidebar is open */}
      {showSidebar && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => useUIStore.getState().setSidebarOpen(false)}
        />
      )}
      
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        showSidebar ? "ml-0 lg:ml-64" : "ml-0" // Only show sidebar margin when sidebar is visible
      )}>
        <Header />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
}