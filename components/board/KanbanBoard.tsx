'use client'

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useState } from 'react'
import { useTasks, useUpdateTask, Task, TaskStatus } from '@/lib/hooks/useTasks'
import { KanbanColumn } from './KanbanColumn'
import { TaskCard } from './TaskCard'

const COLUMNS: { id: TaskStatus; label: string; emoji: string; color: string }[] = [
  { id: 'pending', label: 'Pending', emoji: '⏳', color: 'border-gray-500' },
  { id: 'in_progress', label: 'In Progress', emoji: '🔄', color: 'border-violet-500' },
  { id: 'completed', label: 'Completed', emoji: '✅', color: 'border-green-500' },
]

export function KanbanBoard() {
  const { data: tasks = [] } = useTasks()
  const updateTask = useUpdateTask()
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id)
    if (task) setActiveTask(task)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const taskId = active.id as string
    const newStatus = over.id as TaskStatus

    const task = tasks.find(t => t.id === taskId)
    if (!task || task.status === newStatus) return

    updateTask.mutate({
      id: taskId,
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
    })
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
        {COLUMNS.map(column => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={tasks.filter(t => t.status === column.id)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} isDragging />}
      </DragOverlay>
    </DndContext>
  )
}