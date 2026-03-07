import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function isOnboardingComplete(profile: Record<string, unknown> | null) {
  if (!profile) return false

  const explicitFlag = profile.onboarding_completed
  if (typeof explicitFlag === 'boolean') return explicitFlag

  const fullName = typeof profile.full_name === 'string' ? profile.full_name.trim() : ''
  const dailyGoal = typeof profile.daily_goal === 'number' ? profile.daily_goal : null
  const accentColor = typeof profile.accent_color === 'string' ? profile.accent_color.trim() : ''

  return Boolean(fullName && dailyGoal && accentColor)
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
  const isAdminPage = request.nextUrl.pathname.startsWith('/admin')
  const isOnboardingPage = request.nextUrl.pathname.startsWith('/onboarding')

  if (!user && !isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError?.message?.toLowerCase().includes('infinite recursion detected in policy')) {
      if (isAuthPage) {
        const url = request.nextUrl.clone()
        url.pathname = '/onboarding'
        return NextResponse.redirect(url)
      }

      if (isAdminPage) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }

      return supabaseResponse
    }

    const profileData = (profile ?? null) as Record<string, unknown> | null
    const onboardingComplete = isOnboardingComplete(profileData)

    if (isAuthPage) {
      const url = request.nextUrl.clone()
      url.pathname = onboardingComplete ? '/dashboard' : '/onboarding'
      return NextResponse.redirect(url)
    }

    if (!isOnboardingPage && !onboardingComplete) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }

    if (isOnboardingPage && onboardingComplete) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    if (isAdminPage && profileData?.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
