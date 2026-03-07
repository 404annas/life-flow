'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GlassmorphismCard } from '@/components/lifeflow/glasmorphism-card'
import { ProgressDots } from '@/components/lifeflow/progress-dots'
import { StepNavigation } from '@/components/lifeflow/step-navigation'
import { AnimatedGradientBg } from '@/components/lifeflow/animated-gradient-bg'
import { ColorPicker } from '@/components/lifeflow/color-picker'
import { FloatingLabelInput } from '@/components/lifeflow/floating-label-input'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const GOAL_OPTIONS = [
  { label: '3 tasks/day', value: 3 },
  { label: '5 tasks/day', value: 5 },
  { label: '10 tasks/day', value: 10 },
]

const ACCENT_COLORS = [
  { name: 'Purple', value: '#a855f7' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Orange', value: '#f97316' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [dailyGoal, setDailyGoal] = useState<number | null>(null)
  const [accentColor, setAccentColor] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  useEffect(() => {
    let active = true

    const loadProfile = async () => {
      const { data: authData, error: userError } = await supabase.auth.getUser()
      if (!active) return

      if (userError || !authData.user) {
        router.replace('/auth/login')
        return
      }
      const metadata = authData.user.user_metadata as Record<string, unknown> | undefined
      const fullNameFromMetadata =
        metadata && typeof metadata.full_name === 'string' ? metadata.full_name : ''
      if (fullNameFromMetadata) setName(fullNameFromMetadata)

      setIsBootstrapping(false)
    }

    loadProfile()
    return () => {
      active = false
    }
  }, [router, supabase])

  const handleNext = async () => {
    if (step < 2) {
      if (step === 0 && !name.trim()) {
        toast.error('Please enter your name')
        return
      }
      if (step === 1 && !dailyGoal) {
        toast.error('Please choose a daily goal')
        return
      }
      setStep(step + 1)
    } else {
      if (!accentColor) {
        toast.error('Please choose an accent color')
        return
      }

      setIsSaving(true)

      const { data: authData, error: userError } = await supabase.auth.getUser()
      if (userError || !authData.user) {
        toast.error(userError?.message ?? 'User session not found')
        setIsSaving(false)
        return
      }

      const completionPayload: Record<string, unknown> = {
        full_name: name.trim() || null,
        daily_goal: dailyGoal,
        accent_color: accentColor,
        onboarding_completed: true,
      }

      let { error: updateError } = await (supabase.from('profiles') as any)
        .update(completionPayload)
        .eq('id', authData.user.id)

      if (updateError && updateError.message.toLowerCase().includes('onboarding_completed')) {
        // Backward compatibility: if column not deployed yet, persist core onboarding fields.
        const fallback = await supabase
          .from('profiles')
          .update({
            full_name: name.trim() || null,
            daily_goal: dailyGoal,
            accent_color: accentColor,
          })
          .eq('id', authData.user.id)
        // Avoid return payload to prevent RLS select policy recursion on some setups.
        updateError = fallback.error
      }

      if (updateError) {
        if (updateError.message.toLowerCase().includes('infinite recursion detected in policy')) {
          toast.error('Database policy misconfiguration detected. Run ONBOARDING_MIGRATION.sql in Supabase SQL Editor.')
        } else {
          toast.error(updateError.message)
        }
        setIsSaving(false)
        return
      }
      toast.success('Onboarding completed')
      router.push('/dashboard')
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  return (
    <AnimatedGradientBg>
      <div className="flex items-center justify-center min-h-screen px-4">
        <GlassmorphismCard className="animate-fade-in-up max-w-md">
          {isBootstrapping ? (
            <div className="py-8 text-center text-white/70">Loading onboarding...</div>
          ) : (
            <>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              {step === 0 && "What's your name?"}
              {step === 1 && 'Daily task goal'}
              {step === 2 && 'Pick your accent color'}
            </h2>
            <p className="text-white/60 text-sm">
              {step === 0 && 'Help us personalize your LifeFlow experience'}
              {step === 1 && 'How many tasks do you want to focus on daily?'}
              {step === 2 && 'Choose a color that represents you'}
            </p>
          </div>

          <div className="space-y-6 mb-8">
            {step === 0 && (
              <FloatingLabelInput
                label="Your name"
                placeholder="e.g., Alex"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}

            {step === 1 && (
              <div className="grid grid-cols-3 gap-3">
                {GOAL_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setDailyGoal(option.value)}
                    className={`p-4 rounded-lg border transition-all duration-300 text-center font-semibold ${
                      dailyGoal === option.value
                        ? 'bg-blue-600 border-transparent text-white scale-105'
                        : 'border-white/20 text-white/70 hover:border-white/40 hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <ColorPicker
                  colors={ACCENT_COLORS}
                  selected={accentColor ?? ''}
                  onSelect={setAccentColor}
                />
                {accentColor && (
                  <div className="flex justify-center">
                    <div
                      className="w-16 h-16 rounded-full ring-2 ring-white/20 shadow-lg"
                      style={{ backgroundColor: accentColor }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <ProgressDots totalSteps={3} currentStep={step + 1} />
            <StepNavigation
              onBack={handleBack}
              onNext={handleNext}
              isLastStep={step === 2}
              isLoading={isSaving}
            />
          </div>
            </>
          )}
        </GlassmorphismCard>
      </div>
    </AnimatedGradientBg>
  )
}
