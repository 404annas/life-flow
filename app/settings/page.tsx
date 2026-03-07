'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/lifeflow/app-layout';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { LogOut, Save, ShieldCheck, Trash2 } from 'lucide-react';

interface SettingsData {
  email: string;
  fullName: string;
  username: string;
  dailyGoal: number;
  level: number;
  xp: number;
  streak: number;
  bestStreak: number;
  stats: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [authResolved, setAuthResolved] = useState(false);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [dailyGoal, setDailyGoal] = useState(5);
  const [newPassword, setNewPassword] = useState('');
  const [confirmDelete, setConfirmDelete] = useState('');

  useEffect(() => {
    let active = true;

    const resolveUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;
      setCurrentUserId(user?.id ?? null);
      setCurrentUserEmail(user?.email ?? '');
      setAuthResolved(true);
    };

    resolveUser();
    return () => {
      active = false;
    };
  }, [supabase]);

  const settingsQuery = useQuery({
    queryKey: ['settings-data', currentUserId],
    enabled: authResolved && Boolean(currentUserId),
    queryFn: async (): Promise<SettingsData> => {
      if (!currentUserId) throw new Error('UNAUTHENTICATED');

      const profilePromise = supabase
        .from('profiles')
        .select('full_name, username, daily_goal, level, xp, streak, best_streak')
        .eq('id', currentUserId)
        .single();

      const totalPromise = supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUserId);

      const completedPromise = supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUserId)
        .eq('status', 'completed');

      const pendingPromise = supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUserId)
        .eq('status', 'pending');

      const inProgressPromise = supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUserId)
        .eq('status', 'in_progress');

      const [profileRes, totalRes, completedRes, pendingRes, inProgressRes] = await Promise.all([
        profilePromise,
        totalPromise,
        completedPromise,
        pendingPromise,
        inProgressPromise,
      ]);

      if (profileRes.error) throw profileRes.error;
      if (totalRes.error) throw totalRes.error;
      if (completedRes.error) throw completedRes.error;
      if (pendingRes.error) throw pendingRes.error;
      if (inProgressRes.error) throw inProgressRes.error;

      return {
        email: currentUserEmail,
        fullName: profileRes.data?.full_name ?? '',
        username: profileRes.data?.username ?? '',
        dailyGoal: profileRes.data?.daily_goal ?? 5,
        level: profileRes.data?.level ?? 1,
        xp: profileRes.data?.xp ?? 0,
        streak: profileRes.data?.streak ?? 0,
        bestStreak: profileRes.data?.best_streak ?? 0,
        stats: {
          totalTasks: totalRes.count ?? 0,
          completedTasks: completedRes.count ?? 0,
          pendingTasks: pendingRes.count ?? 0,
          inProgressTasks: inProgressRes.count ?? 0,
        },
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    if (authResolved && !currentUserId) {
      router.replace('/auth/login');
      return;
    }
    if (settingsQuery.error) {
      toast.error((settingsQuery.error as Error).message);
    }
  }, [authResolved, currentUserId, settingsQuery.error, router]);

  useEffect(() => {
    if (!settingsQuery.data) return;
    setFullName(settingsQuery.data.fullName);
    setUsername(settingsQuery.data.username);
    setDailyGoal(settingsQuery.data.dailyGoal);
  }, [settingsQuery.data]);

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId) throw new Error('User session not found');
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim() || null,
          username: username.trim() || null,
          daily_goal: Number.isFinite(dailyGoal) ? dailyGoal : 5,
        })
        .eq('id', currentUserId);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success('Profile updated');
      await queryClient.invalidateQueries({ queryKey: ['settings-data'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async () => {
      if (newPassword.trim().length < 8) {
        throw new Error('Password must be at least 8 characters');
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewPassword('');
      toast.success('Password updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      if (confirmDelete !== 'DELETE') {
        throw new Error("Type DELETE to confirm account deletion");
      }
      const response = await fetch('/api/account/delete', { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to delete account');
      }
      await supabase.auth.signOut();
    },
    onSuccess: () => {
      toast.success('Account deleted');
      router.push('/auth/login');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      return;
    }
    router.push('/auth/login');
  };

  const data = settingsQuery.data;

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 pb-28 lg:pb-10 space-y-6">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="mt-2 text-white/60">Manage your account, security, daily goals and profile details.</p>
        </section>

        {settingsQuery.isLoading ? (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/60">
            Loading settings...
          </section>
        ) : (
          <>
            <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
              <h2 className="text-xl font-semibold text-white">User Details</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-white/70">Email</label>
                  <input
                    value={data?.email ?? ''}
                    disabled
                    className="w-full rounded-xl border border-white/10 bg-[#0f1118] px-3 py-2.5 text-white/70"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-white/70">Username</label>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0f1118] px-3 py-2.5 text-white focus:border-blue-400/40 focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm text-white/70">Full Name</label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0f1118] px-3 py-2.5 text-white focus:border-blue-400/40 focus:outline-none"
                  />
                </div>
              </div>
              <button
                onClick={() => updateProfileMutation.mutate()}
                disabled={updateProfileMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-70"
              >
                <Save size={16} />
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
              </button>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
              <h2 className="text-xl font-semibold text-white">Daily Goal</h2>
              <div className="max-w-sm">
                <label className="mb-2 block text-sm text-white/70">Tasks per day</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(Number(e.target.value || 1))}
                  className="w-full rounded-xl border border-white/10 bg-[#0f1118] px-3 py-2.5 text-white focus:border-blue-400/40 focus:outline-none"
                />
              </div>
              <button
                onClick={() => updateProfileMutation.mutate()}
                disabled={updateProfileMutation.isPending}
                className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-70"
              >
                Update Daily Goal
              </button>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
              <h2 className="text-xl font-semibold text-white">Your Stats</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-[#0f1118] p-4">
                  <p className="text-xs text-white/60">Total Tasks</p>
                  <p className="mt-1 text-2xl font-bold text-white">{data?.stats.totalTasks ?? 0}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#0f1118] p-4">
                  <p className="text-xs text-white/60">Completed</p>
                  <p className="mt-1 text-2xl font-bold text-white">{data?.stats.completedTasks ?? 0}</p>
                </div>
                {/* <div className="rounded-xl border border-white/10 bg-[#0f1118] p-4">
                  <p className="text-xs text-white/60">In Progress</p>
                  <p className="mt-1 text-2xl font-bold text-white">{data?.stats.inProgressTasks ?? 0}</p>
                </div> */}
                <div className="rounded-xl border border-white/10 bg-[#0f1118] p-4">
                  <p className="text-xs text-white/60">Pending</p>
                  <p className="mt-1 text-2xl font-bold text-white">{data?.stats.pendingTasks ?? 0}</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-[#0f1118] p-4">
                  <p className="text-xs text-white/60">Level</p>
                  <p className="mt-1 text-xl font-bold text-white">{data?.level ?? 1}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#0f1118] p-4">
                  <p className="text-xs text-white/60">XP</p>
                  <p className="mt-1 text-xl font-bold text-white">{data?.xp ?? 0}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#0f1118] p-4">
                  <p className="text-xs text-white/60">Streak</p>
                  <p className="mt-1 text-xl font-bold text-white">{data?.streak ?? 0} days</p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
              <h2 className="text-xl font-semibold text-white">Security</h2>
              <div className="max-w-sm">
                <label className="mb-2 block text-sm text-white/70">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl border border-white/10 bg-[#0f1118] px-3 py-2.5 text-white focus:border-blue-400/40 focus:outline-none"
                />
              </div>
              <button
                onClick={() => updatePasswordMutation.mutate()}
                disabled={updatePasswordMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl border border-blue-400/30 bg-blue-500/15 px-4 py-2.5 text-sm font-semibold text-blue-200 hover:bg-blue-500/25 disabled:opacity-70"
              >
                <ShieldCheck size={16} />
                {updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
              </button>
            </section>

            <section className="rounded-2xl border border-red-400/20 bg-red-500/5 p-6 space-y-4">
              <h2 className="text-xl font-semibold text-red-200">Danger Zone</h2>
              <p className="text-sm text-red-100/80">
                Type <span className="font-semibold">DELETE</span> to confirm permanent account deletion.
              </p>
              <div className="max-w-sm">
                <input
                  value={confirmDelete}
                  onChange={(e) => setConfirmDelete(e.target.value)}
                  placeholder="Type DELETE"
                  className="w-full rounded-xl border border-red-400/30 bg-[#0f1118] px-3 py-2.5 text-white focus:border-red-300/50 focus:outline-none"
                />
              </div>
              <button
                onClick={() => deleteAccountMutation.mutate()}
                disabled={deleteAccountMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl border border-red-400/40 bg-red-500/20 px-4 py-2.5 text-sm font-semibold text-red-100 hover:bg-red-500/30 disabled:opacity-70"
              >
                <Trash2 size={16} />
                {deleteAccountMutation.isPending ? 'Deleting account...' : 'Delete Account'}
              </button>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
              >
                <LogOut size={16} />
                Logout
              </button>
            </section>
          </>
        )}
      </div>
    </AppLayout>
  );
}
