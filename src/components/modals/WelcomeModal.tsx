'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, FolderOpen, Tag } from 'lucide-react'

export function WelcomeModal() {
  const { showWelcomeModal, setShowWelcomeModal, user } = useAuth()

  if (!showWelcomeModal) return null

  const userName = user?.email?.split('@')[0] || 'there'

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto animate-in fade-in-0 zoom-in-95 duration-300">
        <CardHeader className="text-center pb-4">
          <div className="text-6xl mb-4">📝</div>
          <CardTitle className="text-3xl font-bold mb-2">Notes</CardTitle>
          <p className="text-lg text-muted-foreground mb-4">
            Capture your thoughts, organize your ideas
          </p>
          <CardTitle className="text-2xl font-bold">Welcome, {userName}! 🎉</CardTitle>
          <p className="text-muted-foreground mt-2">
            Your account is ready and we&apos;ve prepared some sample content to get you started.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <FileText className="h-5 w-5 text-blue-600" />
              <div className="text-sm">
                <p className="font-medium">Sample Notes</p>
                <p className="text-muted-foreground">Explore different note types and features</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <FolderOpen className="h-5 w-5 text-green-600" />
              <div className="text-sm">
                <p className="font-medium">Organized Folders</p>
                <p className="text-muted-foreground">Personal, Work, and Ideas folders ready to use</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Tag className="h-5 w-5 text-purple-600" />
              <div className="text-sm">
                <p className="font-medium">Smart Tags</p>
                <p className="text-muted-foreground">Color-coded tags for better organization</p>
              </div>
            </div>
          </div>
          
          <div className="pt-4">
            <Button 
              onClick={() => setShowWelcomeModal(false)}
              className="w-full"
              size="lg"
            >
              Let&apos;s Get Started!
            </Button>
          </div>
          
          <p className="text-xs text-center text-muted-foreground">
            You can delete or modify the sample content anytime
          </p>
        </CardContent>
      </Card>
    </div>
  )
}