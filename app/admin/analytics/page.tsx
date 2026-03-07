'use client';

import React from 'react';
import { AdminSidebar } from '@/components/lifeflow/admin-sidebar';
import { AdminCharts } from '@/components/lifeflow/admin-charts';
import { AdminActivityFeed } from '@/components/lifeflow/admin-activity-feed';

export default function AdminAnalyticsPage() {
  return (
    <div className="flex h-screen bg-[#0a0a0f]">
      <AdminSidebar currentPage="analytics" />

      <main className="flex-1 overflow-auto">
        <div className="p-8 space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Analytics</h1>
            <p className="text-white/60">Deep dive into LifeFlow's performance metrics and trends.</p>
          </div>

          {/* Charts and Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <AdminCharts />
            </div>
            <div className="lg:col-span-1">
              <AdminActivityFeed />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
