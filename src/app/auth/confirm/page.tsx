'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function ConfirmPageContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      const token = searchParams.get('token')
      const type = searchParams.get('type')

      if (!token || type !== 'signup') {
        setStatus('error')
        setMessage('Invalid confirmation link')
        return
      }

      try {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup',
        })

        if (error) {
          setStatus('error')
          setMessage(`Confirmation failed: ${error.message}`)
        } else {
          setStatus('success')
          setMessage('Email confirmed successfully! You can now sign in.')
          
          // Redirect to home after 2 seconds
          setTimeout(() => {
            router.push('/')
          }, 2000)
        }
      } catch (err) {
        setStatus('error')
        setMessage('An unexpected error occurred')
      }
    }

    handleEmailConfirmation()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center">
            {status === 'loading' && '⏳ Confirming Email...'}
            {status === 'success' && '✅ Email Confirmed!'}
            {status === 'error' && '❌ Confirmation Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{message}</p>
          
          {status === 'success' && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Redirecting to home page...
              </p>
              <Button onClick={() => router.push('/')} className="w-full">
                Continue to App
              </Button>
            </div>
          )}
          
          {status === 'error' && (
            <Button onClick={() => router.push('/')} variant="outline" className="w-full">
              Back to Home
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center">⏳ Loading...</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">Please wait...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <ConfirmPageContent />
    </Suspense>
  )
}