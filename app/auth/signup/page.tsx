'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GlassmorphismCard } from '@/components/lifeflow/glasmorphism-card'
import { FloatingLabelInput } from '@/components/lifeflow/floating-label-input'
import { GradientText } from '@/components/lifeflow/gradient-text'
import { ColorPicker } from '@/components/lifeflow/color-picker'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/lib/hooks/useAuth'
import { toast } from 'sonner'

const AVATAR_COLORS = [
  { name: 'Purple', value: '#a855f7' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Indigo', value: '#6366f1' },
]

export default function SignupPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0].value)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const { signUp, loading, error } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !email.trim() || !password.trim()) {
      toast.error('All Fields are required')
      return
    }

    if (!termsAccepted) {
      toast.error('All Fields are required')
      return
    }
    await signUp(email, password, username, avatarColor)
  }

  return (
    <GlassmorphismCard className="animate-fade-in-up">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">
          <GradientText>LifeFlow</GradientText>
        </h1>
        <p className="text-white/60 text-sm">Create your account & manage your daily tasks</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FloatingLabelInput
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

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

        <div className="space-y-3">
          <label className="text-white/60 text-sm block">Avatar Color</label>
          <ColorPicker
            colors={AVATAR_COLORS}
            selected={avatarColor}
            onSelect={setAvatarColor}
          />
        </div>

        <div className="flex items-center space-x-2 pt-2">
          <Checkbox
            id="terms"
            checked={termsAccepted}
            onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
          />
          <label htmlFor="terms" className="text-white/60 text-sm cursor-pointer">
            I agree to the{' '}
            <span className="text-white hover:text-white/80 transition-colors">
              Terms & Conditions
            </span>
          </label>
        </div>

        <Button
          type="submit"
          className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-500 transition-all duration-300 cursor-pointer"
          disabled={loading}
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>

      {error && (
        <p className="mt-3 text-sm text-red-400 text-center">{error}</p>
      )}

      <div className="mt-6 text-center text-white/60 text-sm">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-white hover:text-white/80 font-semibold transition-colors">
          Sign in
        </Link>
      </div>
    </GlassmorphismCard>
  )
}
