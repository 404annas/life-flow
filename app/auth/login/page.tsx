'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GlassmorphismCard } from '@/components/lifeflow/glasmorphism-card'
import { FloatingLabelInput } from '@/components/lifeflow/floating-label-input'
import { GradientText } from '@/components/lifeflow/gradient-text'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/hooks/useAuth'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { signIn, loading, error } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      toast.error('Email and Password are required')
      return
    }

    await signIn(email, password)
  }

  return (
    <GlassmorphismCard className="animate-fade-in-up">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">
          <GradientText>LifeFlow</GradientText>
        </h1>
        <p className="text-white/60 text-sm">Get things done, your way</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FloatingLabelInput
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <FloatingLabelInput
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button
          type="submit"
          className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-500 transition-all duration-300 cursor-pointer"
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      {error && (
        <p className="mt-3 text-sm text-red-400 text-center">{error}</p>
      )}

      <div className="mt-6 text-center text-white/60 text-sm">
        Don't have an account?{' '}
        <Link href="/auth/signup" className="text-white hover:text-white/80 font-semibold transition-colors duration-300 cursor-pointer">
          Sign up
        </Link>
      </div>
    </GlassmorphismCard>
  )
}
