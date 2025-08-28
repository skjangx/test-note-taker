'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

export function AuthTest() {
  const { user, loading, emailConfirmationSent, signIn, signUp, signOut, resendConfirmation } = useAuth()
  const { success, error: showError } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)

  const handleAuth = async () => {
    if (!email || !password) {
      showError('Please enter email and password')
      return
    }

    if (isSignUp) {
      const { error, emailConfirmationSent: confirmationSent } = await signUp(email, password)
      if (error) {
        showError(`Error: ${error.message}`)
        console.error('Supabase error:', error)
      } else if (confirmationSent) {
        success('Check your email for confirmation!')
        setPassword('') // Clear password but keep email for resend
      } else {
        success('Account created and signed in!')
        setEmail('')
        setPassword('')
      }
    } else {
      const { error } = await signIn(email, password)
      if (error) {
        showError(`Error: ${error.message}`)
        console.error('Supabase error:', error)
      } else {
        success('Signed in successfully!')
        setEmail('')
        setPassword('')
      }
    }
  }

  const handleResendConfirmation = async () => {
    if (!email) {
      showError('Please enter your email address')
      return
    }
    
    const { error } = await resendConfirmation(email)
    if (error) {
      showError(`Error: ${error.message}`)
    } else {
      success('Confirmation email sent!')
    }
  }

  if (loading) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardContent className="p-6">
          <div className="text-center">Loading auth...</div>
        </CardContent>
      </Card>
    )
  }

  if (emailConfirmationSent && !user) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle>📧 Check Your Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-muted-foreground">
              We&apos;ve sent a confirmation link to <strong>{email}</strong>
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Click the link in your email to complete your account setup.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={handleResendConfirmation} variant="outline" className="w-full">
              Resend Confirmation Email
            </Button>
            <Button 
              onClick={() => window.location.reload()} 
              variant="ghost" 
              className="w-full text-sm"
            >
              I&apos;ve confirmed my email
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (user) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle>✅ Connected to Supabase!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Created:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
            <p><strong>Confirmed:</strong> {user.email_confirmed_at ? '✅ Yes' : '❌ No'}</p>
          </div>
          <Button onClick={signOut} variant="outline" className="w-full">
            Sign Out
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>🧪 Test Supabase Auth</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsSignUp(false)}
            variant={!isSignUp ? "default" : "outline"}
            className="flex-1"
          >
            Sign In
          </Button>
          <Button 
            onClick={() => setIsSignUp(true)}
            variant={isSignUp ? "default" : "outline"}  
            className="flex-1"
          >
            Sign Up
          </Button>
        </div>
        
        <Button onClick={handleAuth} className="w-full">
          {isSignUp ? 'Create Account' : 'Sign In'}
        </Button>
        
        <div className="text-xs text-muted-foreground">
          {isSignUp ? 'You\'ll receive an email confirmation' : 'Use existing account'}
        </div>
      </CardContent>
    </Card>
  )
}