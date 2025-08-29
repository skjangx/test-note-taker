'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle } from 'lucide-react'

export default function ConfirmPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-8">
        {/* App Header/Logo */}
        <div className="text-center">
          <div className="text-6xl mb-4">📝</div>
          <h1 className="text-3xl font-bold text-foreground">Notes</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Capture your thoughts, organize your ideas
          </p>
        </div>
        
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-700 dark:text-green-400">
              Email Confirmed! 🎉
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Your account has been successfully verified
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-green-50 dark:bg-green-950/50 p-4 border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>Great!</strong> Your email has been confirmed and your account is now active.
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Your account is now ready! You can sign in with your credentials to start taking notes.
              </p>
              
              <p className="text-xs text-muted-foreground">
                We&apos;ve prepared sample notes and folders to get you started!
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Attribution Footer */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Built by{' '}
            <span className="font-medium">skjangx</span>
            {' '}to test Supabase BE
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Aug 27th to 28th, 2025
          </p>
        </div>
      </div>
    </div>
  )
}