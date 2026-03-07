import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface Params {
  params: Promise<{ id: string }>
}

async function verifyAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { ok: false as const, status: 401, error: 'Unauthorized', meId: null }
  }

  const { data: me, error: roleError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (roleError || me?.role !== 'admin') {
    return { ok: false as const, status: 403, error: 'Forbidden', meId: user.id }
  }

  return { ok: true as const, meId: user.id }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Missing SUPABASE_SERVICE_ROLE_KEY in environment variables' },
        { status: 500 }
      )
    }

    const verify = await verifyAdmin()
    if (!verify.ok) {
      return NextResponse.json({ error: verify.error }, { status: verify.status })
    }

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const role = body?.role

    if (role !== 'user' && role !== 'admin') {
      return NextResponse.json({ error: 'Invalid role value' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    if (id === verify.meId && role !== 'admin') {
      return NextResponse.json({ error: 'You cannot remove your own admin role' }, { status: 400 })
    }

    const { error } = await adminClient.from('profiles').update({ role }).eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500 }
    )
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Missing SUPABASE_SERVICE_ROLE_KEY in environment variables' },
        { status: 500 }
      )
    }

    const verify = await verifyAdmin()
    if (!verify.ok) {
      return NextResponse.json({ error: verify.error }, { status: verify.status })
    }

    const { id } = await params
    if (id === verify.meId) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 })
    }

    const adminClient = createAdminClient()
    const { data: targetProfile, error: targetProfileError } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', id)
      .single()

    if (targetProfileError) {
      return NextResponse.json({ error: targetProfileError.message }, { status: 500 })
    }

    if (targetProfile?.role === 'admin') {
      return NextResponse.json(
        { error: 'Admin accounts cannot be deleted directly. Change role to user first.' },
        { status: 400 }
      )
    }

    const { error } = await adminClient.auth.admin.deleteUser(id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500 }
    )
  }
}
