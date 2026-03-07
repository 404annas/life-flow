'use client';

import React from 'react';
import { AdminSidebar } from '@/components/lifeflow/admin-sidebar';
import { AdminUsersTable } from '@/components/lifeflow/admin-users-table';

export default function AdminUsersPage() {
  return (
    <div className="flex h-screen bg-[#0a0a0f]">
      <AdminSidebar currentPage="users" />

      <main className="flex-1 overflow-auto">
        <div className="p-8 space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">User Management</h1>
            <p className="text-white/60">Manage and monitor all LifeFlow users.</p>
          </div>

          {/* Users Table */}
          <AdminUsersTable onSearch={(query) => console.log('Search:', query)} />
        </div>
      </main>
    </div>
  );
}
