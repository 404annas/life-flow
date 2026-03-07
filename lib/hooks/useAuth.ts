'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

function mapAuthError(message: string) {
  const normalized = message.toLowerCase()
  if (normalized.includes('invalid login credentials')) {
    return 'Authentication failed: email or password is incorrect.'
  }
  if (normalized.includes('email not confirmed')) {
    return 'Authentication failed: please verify your email before signing in.'
  }
  if (normalized.includes('user already registered')) {
    return 'Sign-up blocked: an account with this email already exists.'
  }
  return message
}

export function useAuth() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signUp = async (
    email: string,
    password: string,
    username: string,
    avatarColor?: string
  ) => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          avatar_color: avatarColor,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      const mapped = mapAuthError(error.message)
      setError(mapped)
      toast.error(mapped)
    } else {
      toast.success('Account created. Redirecting to onboarding.')
      router.push('/onboarding')
    }
    setLoading(false)
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      const mapped = mapAuthError(error.message)
      setError(mapped)
      toast.error(mapped)
    } else {
      toast.success('Authentication successful. Redirecting to dashboard.')
      router.push('/dashboard')
    }
    setLoading(false)
  }

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const signInWithMagicLink = async (email: string) => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      const mapped = mapAuthError(error.message)
      setError(mapped)
      toast.error(mapped)
    } else {
      setError('Check your email for the magic link!')
      toast.success('Magic link issued. Check your inbox to continue.')
    }
    setLoading(false)
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error(mapAuthError(error.message))
      return
    }
    toast.success('Session closed successfully.')
    router.push('/auth/login')
  }

  return { signUp, signIn, signInWithGoogle, signInWithMagicLink, signOut, loading, error }
}
