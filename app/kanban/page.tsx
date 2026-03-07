'use client';

import { AppLayout } from '@/components/lifeflow/app-layout';
import { KanbanBoard } from '@/components/lifeflow/kanban-board';

export default function KanbanPage() {
  return (
    <AppLayout>
      <div className="min-h-screen bg-[#0a0a0f] text-white">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="px-6 pt-8 pb-6">
            <h1 className="text-4xl font-bold text-white mb-2">Kanban Board</h1>
            <p className="text-white/60">Organize and manage your tasks across columns</p>
          </div>

          {/* Kanban Board */}
          <KanbanBoard />
        </div>
      </div>
    </AppLayout>
  );
}
