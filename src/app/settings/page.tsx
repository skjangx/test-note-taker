'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useUIStore } from '@/lib/store/ui';
import { useNotesStore } from '@/lib/store/notes';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, Trash2, Moon, Sun, ArrowLeft, Eye, EyeOff, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export default function SettingsPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useUIStore();
  const { notes } = useNotesStore();
  const { success, error } = useToast();
  const { user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const handleExportData = () => {
    try {
      // Export current notes from the store (which reflects Supabase data)
      const exportData = {
        notes,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notes-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      success('Data exported successfully!');
    } catch (err) {
      error('Failed to export data');
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    error('Import feature coming soon - data is now stored securely in Supabase');
  };

  const handleClearAllData = () => {
    error('Clear data feature disabled - data is now stored securely in Supabase. Contact support for account deletion.');
  };

  return (
    <div className="p-6 overflow-y-auto h-full w-full">
      <div className="max-w-6xl mx-auto">
        {/* Back Navigation */}
        <div className="mb-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Notes
          </Button>
        </div>
        
        <h1 className="text-2xl font-bold mb-8">Settings</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {theme === 'light' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode">Dark mode</Label>
              <Switch
                id="dark-mode"
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account-email">Email</Label>
              <div className="p-2 bg-muted rounded-md">
                <p className="text-sm font-mono">{user?.email || 'Not signed in'}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="account-password">Password</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-2 bg-muted rounded-md">
                  <p className="text-sm font-mono">
                    {showPassword ? '[Hidden for security]' : '••••••••••••'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-2"
                  title={showPassword ? 'Hide password' : 'Show password info'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {showPassword 
                  ? 'Passwords are encrypted and cannot be displayed for security reasons'
                  : 'Passwords are managed securely by Supabase'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Total Notes</p>
                <p className="text-sm text-muted-foreground">{notes.length} notes stored securely in Supabase</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportData} className="gap-2">
                <Download className="h-4 w-4" />
                Export Data
              </Button>
              
              <Button variant="outline" className="gap-2" asChild>
                <label htmlFor="import-file">
                  <Upload className="h-4 w-4" />
                  Import Data
                  <input
                    id="import-file"
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden"
                  />
                </label>
              </Button>
            </div>

            <div className="pt-4 border-t">
              <Button 
                variant="destructive" 
                onClick={handleClearAllData}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear All Data
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                This will permanently delete all your notes and cannot be undone.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium">📝 Notes</p>
              <p className="text-sm text-muted-foreground">
                A modern note-taking application built with Next.js, Tailwind CSS, shadcn/ui, and Supabase.
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium">🔧 Technology Stack</p>
              <p className="text-sm text-muted-foreground">
                Frontend: Next.js 15, TypeScript, Zustand, Tiptap Editor
              </p>
              <p className="text-sm text-muted-foreground">
                Backend: Supabase (PostgreSQL, Auth, Real-time)
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium">👨‍💻 Development</p>
              <p className="text-sm text-muted-foreground">
                Built by <span className="font-medium">skjangx</span> to test Supabase backend integration
              </p>
              <p className="text-sm text-muted-foreground">
                Development period: August 27-28, 2025
              </p>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}