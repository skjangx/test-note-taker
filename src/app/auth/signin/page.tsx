'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

export default function SignInPage() {
  const { signIn } = useAuth()
  const { success, error: showError } = useToast()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate email field
    if (!email.trim()) {
      showError('Please enter your email address')
      return
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      showError('Please enter a valid email address')
      return
    }
    
    // Validate password field
    if (!password) {
      showError('Please enter your password')
      return
    }

    setIsLoading(true)
    
    try {
      const { error, isNewUser } = await signIn(email, password)
      
      console.log('Sign-in result:', { error, isNewUser });
      
      if (error) {
        console.log('Error detected:', error.message);
        
        // Handle specific error cases for better UX
        if (error.message.includes('Email not confirmed')) {
          console.log('Showing email not confirmed error');
          showError(`Please check your email and click the confirmation link before signing in. If you need a new confirmation email, try signing up again.`)
        } else if (error.message.includes('Invalid login credentials') || 
                   error.message.includes('User not found') ||
                   error.message.includes('Invalid email or password') ||
                   error.message.toLowerCase().includes('email not found') ||
                   error.message.toLowerCase().includes('user not found')) {
          console.log('Showing no account found error');
          showError(`No account found for "${email}". Please check your email or sign up for a new account.`)
        } else if (error.message.includes('Invalid email') || 
                   error.message.includes('Invalid password')) {
          console.log('Showing invalid credentials error');
          showError('Invalid email or password. Please check your credentials and try again.')
        } else {
          console.log('Showing generic error:', error.message);
          showError(error.message)
        }
      } else {
        // Only show welcome toast for existing users (new users get welcome modal)
        if (!isNewUser) {
          success('Welcome!')
        }
        router.push('/')
      }
    } catch (err) {
      console.log('Caught exception:', err);
      showError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

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
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <p className="text-muted-foreground">
            Sign in to your account to continue
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link 
                href="/auth/signup" 
                className="font-medium text-primary hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Attribution Footer */}
      <div className="text-center mt-8">
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