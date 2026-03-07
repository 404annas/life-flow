'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Compass, Loader2, Shield, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Destination = '/auth/login' | '/onboarding' | '/dashboard' | '/admin'

function destinationLabel(path: Destination) {
  if (path === '/admin') return 'Admin Dashboard'
  if (path === '/dashboard') return 'Dashboard'
  if (path === '/onboarding') return 'Onboarding'
  return 'Login'
}

export default function NotFoundPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [isResolving, setIsResolving] = useState(true)
  const [target, setTarget] = useState<Destination>('/auth/login')
  const [seconds, setSeconds] = useState(6)

  useEffect(() => {
    let mounted = true

    const resolveDestination = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!mounted) return

      if (!user) {
        setTarget('/auth/login')
        setIsResolving(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, onboarding_completed, full_name, daily_goal, accent_color')
        .eq('id', user.id)
        .single()

      if (!mounted) return

      const onboardingComplete =
        profile?.onboarding_completed === true ||
        Boolean(
          (profile?.full_name ?? '').trim() &&
          typeof profile?.daily_goal === 'number' &&
          (profile?.accent_color ?? '').trim()
        )

      if (!onboardingComplete) {
        setTarget('/onboarding')
      } else if (profile?.role === 'admin') {
        setTarget('/admin')
      } else {
        setTarget('/dashboard')
      }

      setIsResolving(false)
    }

    resolveDestination()
    return () => {
      mounted = false
    }
  }, [supabase])

  useEffect(() => {
    if (isResolving) return

    setSeconds(6)
    const tick = setInterval(() => {
      setSeconds((prev) => (prev > 1 ? prev - 1 : 1))
    }, 1000)

    const redirectTimer = setTimeout(() => {
      router.replace(target)
    }, 6000)

    return () => {
      clearInterval(tick)
      clearTimeout(redirectTimer)
    }
  }, [isResolving, router, target])

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070b14] px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,#0ea5e933,transparent_40%),radial-gradient(ellipse_at_bottom,#22c55e22,transparent_35%)]" />

      <section className="relative w-full max-w-xl rounded-3xl border border-white/15 bg-[#0e1422]/90 p-7 shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
          <Sparkles size={12} />
          Fallback Route
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-white">404</h1>
        <p className="mt-2 text-base text-white/70">This route does not exist in the current app navigation.</p>

        <div className="mt-6 rounded-2xl border border-white/12 bg-white/[0.04] p-4">
          <p className="text-sm text-white/60">Detected destination</p>
          <p className="mt-1 flex items-center gap-2 text-lg font-semibold text-white">
            {target === '/admin' ? <Shield size={18} /> : <Compass size={18} />}
            {destinationLabel(target)}
          </p>
          <p className="mt-1 text-xs text-white/45">Path: {target}</p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            onClick={() => router.replace(target)}
            className="rounded-xl border border-cyan-300/35 bg-cyan-500/20 px-4 py-2.5 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/30"
          >
            Go To {destinationLabel(target)}
          </button>
          <button
            onClick={() => router.back()}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
          >
            Go Back
          </button>
        </div>

        <div className="mt-5 text-xs text-white/55">
          {isResolving ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 size={13} className="animate-spin" />
              Resolving your access route...
            </span>
          ) : (
            <span>Auto-redirect in {seconds}s</span>
          )}
        </div>
      </section>
    </main>
  )
}
