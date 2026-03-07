import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function AdminOverviewPage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // Total users
  const { count: totalUsers } = await adminClient
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  // Tasks created today
  const today = new Date().toISOString().split('T')[0]
  const { count: tasksToday } = await adminClient
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today)

  // Tasks completed today
  const { count: completedToday } = await adminClient
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')
    .gte('completed_at', today)

  return (
    <div>
      {/* Pass these stats into your v0 admin dashboard component */}
      <pre>{JSON.stringify({ totalUsers, tasksToday, completedToday }, null, 2)}</pre>
    </div>
  )
}