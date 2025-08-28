'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useUIStore } from '@/lib/store/ui';
import { useNotesStore } from '@/lib/store/notes';
import { useToast } from '@/hooks/use-toast';
import { cache } from '@/lib/cache';
import { Download, Upload, Trash2, Moon, Sun, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useUIStore();
  const { notes } = useNotesStore();
  const { success, error } = useToast();

  const handleExportData = () => {
    try {
      const data = cache.get();
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
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
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        cache.set(data);
        success('Data imported successfully! Refreshing page...');
        setTimeout(() => window.location.reload(), 1000);
      } catch (err) {
        error('Invalid backup file format');
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllData = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      cache.clear();
      success('All data cleared successfully! Refreshing page...');
      setTimeout(() => window.location.reload(), 1000);
    }
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
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Total Notes</p>
                <p className="text-sm text-muted-foreground">{notes.length} notes stored locally</p>
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
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Notes App - A modern note-taking application built with Next.js, Tailwind CSS, and shadcn/ui.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Currently running in prototype mode with local storage.
            </p>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}