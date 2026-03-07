'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Crown,
  Loader2,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { AdminSidebar } from '@/components/lifeflow/admin-sidebar'

type Role = 'admin' | 'user'
type UserStatus = 'active' | 'inactive'

interface AdminUserRow {
  id: string
  username: string
  fullName: string
  email: string
  role: Role
  createdAt: string | null
  streak: number
  level: number
  xp: number
  lastActiveDate: string | null
  status: UserStatus
  avatarColor: string
  tasksTotal: number
  tasksCompleted: number
}

interface AdminUsersResponse {
  users: AdminUserRow[]
}

function formatDate(value: string | null) {
  if (!value) return 'N/A'
  return new Date(value).toLocaleDateString()
}

function completionRate(total: number, completed: number) {
  if (total <= 0) return 0
  return Math.round((completed / total) * 100)
}

export default function AdminUsersPage() {
  const supabase = useMemo(() => createClient(), [])
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all')
  const [roleFilter, setRoleFilter] = useState<'all' | Role>('all')
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null)
  const [pendingDeleteUser, setPendingDeleteUser] = useState<AdminUserRow | null>(null)
  const [pendingRoleUser, setPendingRoleUser] = useState<AdminUserRow | null>(null)

  const usersQuery = useQuery({
    queryKey: ['admin-users-data'],
    queryFn: async (): Promise<AdminUsersResponse> => {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load users')
      return data
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    if (!usersQuery.error) return
    toast.error((usersQuery.error as Error).message)
  }, [usersQuery.error])

  useEffect(() => {
    const channel = supabase
      .channel('admin-users-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-users-data'] })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-users-data'] })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient, supabase])

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: Role }) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to update role')
    },
    onSuccess: async () => {
      toast.success('Role updated')
      await queryClient.invalidateQueries({ queryKey: ['admin-users-data'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to delete user')
    },
    onSuccess: async () => {
      toast.success('User deleted')
      setPendingDeleteUser(null)
      await queryClient.invalidateQueries({ queryKey: ['admin-users-data'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const users = usersQuery.data?.users ?? []

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const q = search.toLowerCase().trim()
      const matchesSearch =
        !q ||
        user.username.toLowerCase().includes(q) ||
        user.fullName.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q)

      const matchesStatus = statusFilter === 'all' ? true : user.status === statusFilter
      const matchesRole = roleFilter === 'all' ? true : user.role === roleFilter

      return matchesSearch && matchesStatus && matchesRole
    })
  }, [users, search, statusFilter, roleFilter])

  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">
      <AdminSidebar currentPage="users" />

      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="rounded-2xl border border-white/10 bg-[#10131c] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-white lg:text-3xl">User Management</h1>
                <p className="mt-1 text-sm text-white/60">Realtime user data with role and account controls.</p>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/65">
                {filteredUsers.length} users
              </div>
            </div>
          </header>

          <section className="rounded-2xl border border-white/10 bg-[#10131c] p-4">
            <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr_1fr]">
              <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/45" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by username, full name, or email"
                  className="w-full rounded-xl border border-white/10 bg-[#0e1119] py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-white/35 focus:border-blue-400/40 focus:outline-none"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | UserStatus)}
                className="rounded-xl border border-white/10 bg-[#0e1119] px-3 py-2.5 text-sm text-white focus:border-blue-400/40 focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as 'all' | Role)}
                className="rounded-xl border border-white/10 bg-[#0e1119] px-3 py-2.5 text-sm text-white focus:border-blue-400/40 focus:outline-none"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#10131c]">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b border-white/10 bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-white/55">User</th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-white/55">Role</th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-white/55">Status</th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-white/55">Tasks</th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-white/55">Streak</th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-white/55">Joined</th>
                    <th className="px-4 py-3 text-right text-xs uppercase tracking-wide text-white/55">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersQuery.isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-white/60">
                        Loading users...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-sm text-white/60">
                        No users found for current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="flex items-center gap-3 text-left"
                          >
                            <span
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-sm font-semibold text-white"
                              style={{ backgroundColor: user.avatarColor || '#3b82f6' }}
                            >
                              {(user.fullName || user.username || 'U').charAt(0).toUpperCase()}
                            </span>
                            <span>
                              <p className="text-sm font-medium text-white">{user.fullName || user.username}</p>
                              <p className="text-xs text-white/55">{user.email || 'No email'}</p>
                            </span>
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${
                              user.role === 'admin'
                                ? 'border-violet-400/35 bg-violet-500/15 text-violet-200'
                                : 'border-white/15 bg-white/5 text-white/75'
                            }`}
                          >
                            {user.role === 'admin' ? <Crown size={12} /> : <UserRound size={12} />}
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${
                              user.status === 'active'
                                ? 'border-emerald-400/35 bg-emerald-500/15 text-emerald-200'
                                : 'border-zinc-400/35 bg-zinc-500/15 text-zinc-200'
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-white">{user.tasksCompleted}/{user.tasksTotal}</p>
                          <p className="text-xs text-white/55">{completionRate(user.tasksTotal, user.tasksCompleted)}% complete</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-white">{user.streak}</td>
                        <td className="px-4 py-3 text-sm text-white/75">{formatDate(user.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setPendingRoleUser(user)}
                              disabled={updateRoleMutation.isPending}
                              className="inline-flex items-center gap-1 rounded-lg border border-blue-400/30 bg-blue-500/15 px-2.5 py-1.5 text-xs text-blue-200 hover:bg-blue-500/25 disabled:opacity-60"
                            >
                              <ShieldCheck size={12} />
                              {user.role === 'admin' ? 'Set User' : 'Make Admin'}
                            </button>
                            <button
                              onClick={() => setPendingDeleteUser(user)}
                              disabled={user.role === 'admin'}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-400/35 bg-red-500/15 px-2.5 py-1.5 text-xs text-red-200 hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Trash2 size={12} />
                              {user.role === 'admin' ? 'Admin Locked' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <p className="text-xs text-white/50">
            Status rule: <span className="text-white/75">Active</span> if user was active today or within last 7 days, otherwise <span className="text-white/75">Inactive</span>.
          </p>
        </div>
      </main>

      {selectedUser && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedUser(null)} />
          <div className="fixed left-1/2 top-1/2 z-[60] w-[92%] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/15 bg-[#10131c] p-5">
            <h3 className="text-lg font-semibold text-white">User Details</h3>
            <div className="mt-4 grid gap-3 text-sm text-white/80">
              <p><span className="text-white/50">Name:</span> {selectedUser.fullName || selectedUser.username}</p>
              <p><span className="text-white/50">Email:</span> {selectedUser.email || 'N/A'}</p>
              <p><span className="text-white/50">Role:</span> {selectedUser.role}</p>
              <p><span className="text-white/50">Status:</span> {selectedUser.status}</p>
              <p><span className="text-white/50">Tasks:</span> {selectedUser.tasksCompleted}/{selectedUser.tasksTotal}</p>
              <p><span className="text-white/50">Streak:</span> {selectedUser.streak}</p>
              <p><span className="text-white/50">Level / XP:</span> {selectedUser.level} / {selectedUser.xp}</p>
              <p><span className="text-white/50">Joined:</span> {formatDate(selectedUser.createdAt)}</p>
            </div>
            <button
              onClick={() => setSelectedUser(null)}
              className="mt-5 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10"
            >
              Close
            </button>
          </div>
        </>
      )}

      {pendingDeleteUser && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setPendingDeleteUser(null)} />
          <div className="fixed left-1/2 top-1/2 z-[60] w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/15 bg-[#10131c] p-5">
            <h3 className="text-lg font-semibold text-white">Delete User Account?</h3>
            <p className="mt-2 text-sm text-white/70">
              This permanently deletes <span className="font-medium text-white">{pendingDeleteUser.fullName || pendingDeleteUser.username}</span>.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setPendingDeleteUser(null)}
                className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteUserMutation.mutate(pendingDeleteUser.id)}
                disabled={deleteUserMutation.isPending}
                className="flex-1 rounded-xl border border-red-400/35 bg-red-500/20 px-4 py-2.5 text-sm text-red-100 hover:bg-red-500/30 disabled:opacity-60"
              >
                {deleteUserMutation.isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" /> Deleting...
                  </span>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {pendingRoleUser && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setPendingRoleUser(null)} />
          <div className="fixed left-1/2 top-1/2 z-[60] w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/15 bg-[#10131c] p-5">
            <h3 className="text-lg font-semibold text-white">Confirm Role Change</h3>
            <p className="mt-2 text-sm text-white/70">
              {pendingRoleUser.role === 'admin'
                ? `Set ${pendingRoleUser.fullName || pendingRoleUser.username} to user role?`
                : `Grant admin role to ${pendingRoleUser.fullName || pendingRoleUser.username}?`}
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setPendingRoleUser(null)}
                className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateRoleMutation.mutate({
                    id: pendingRoleUser.id,
                    role: pendingRoleUser.role === 'admin' ? 'user' : 'admin',
                  })
                  setPendingRoleUser(null)
                }}
                disabled={updateRoleMutation.isPending}
                className="flex-1 rounded-xl border border-blue-400/35 bg-blue-500/20 px-4 py-2.5 text-sm text-blue-100 hover:bg-blue-500/30 disabled:opacity-60"
              >
                {updateRoleMutation.isPending ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
