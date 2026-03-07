'use client'

import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

const supabase = createClient()

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'archived'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  due_date: string | null
  due_time: string | null
  priority: TaskPriority
  status: TaskStatus
  order_index: number
  created_at: string
  completed_at: string | null
}

// Fetch all tasks for the current user
export function useTasks(filters?: { status?: TaskStatus; date?: string }) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      let query = supabase
        .from('tasks')
        .select('*, subtasks(*), task_tags(tag_id, tags(*))')
        .order('order_index', { ascending: true })

      if (filters?.status) query = query.eq('status', filters.status)
      if (filters?.date) query = query.eq('due_date', filters.date)

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

// Create a task
export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (task: Partial<Task>) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...task, user_id: user!.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task created!')
    },
    onError: (error) => {
      toast.error(`Failed to create task: ${error.message}`)
    },
  })
}

// Update a task
export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async (updatedTask) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const previousTasks = queryClient.getQueryData(['tasks'])
      queryClient.setQueryData(['tasks'], (old: Task[]) =>
        old?.map(task => task.id === updatedTask.id ? { ...task, ...updatedTask } : task)
      )
      return { previousTasks }
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(['tasks'], context?.previousTasks)
      toast.error('Failed to update task')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

// Delete a task
export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task deleted')
    },
    onError: () => toast.error('Failed to delete task'),
  })
}