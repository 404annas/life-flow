'use client';

import React from 'react';
import { AdminSidebar } from '@/components/lifeflow/admin-sidebar';
import { AdminStatsCard } from '@/components/lifeflow/admin-stats-card';
import { AdminCharts } from '@/components/lifeflow/admin-charts';
import { AdminActivityFeed } from '@/components/lifeflow/admin-activity-feed';
import { Users, TrendingUp, Zap, CheckCircle } from 'lucide-react';

export default function AdminOverviewPage() {
  const statsData = [
    {
      title: 'Total Users',
      value: '1,248',
      trend: 12,
      trendLabel: 'vs last week',
      sparklineData: [
        { value: 400 },
        { value: 520 },
        { value: 480 },
        { value: 620 },
        { value: 750 },
        { value: 920 },
        { value: 1248 },
      ],
      icon: <Users size={24} />,
    },
    {
      title: 'Daily Active Users',
      value: '523',
      trend: 8,
      trendLabel: 'vs yesterday',
      sparklineData: [
        { value: 340 },
        { value: 380 },
        { value: 410 },
        { value: 430 },
        { value: 480 },
        { value: 510 },
        { value: 523 },
      ],
      icon: <TrendingUp size={24} />,
    },
    {
      title: 'Tasks Created Today',
      value: '1,245',
      trend: 15,
      trendLabel: 'vs today',
      sparklineData: [
        { value: 320 },
        { value: 450 },
        { value: 600 },
        { value: 750 },
        { value: 900 },
        { value: 1050 },
        { value: 1245 },
      ],
      icon: <Zap size={24} />,
    },
    {
      title: 'Tasks Completed Today',
      value: '982',
      trend: -5,
      trendLabel: 'vs yesterday',
      sparklineData: [
        { value: 850 },
        { value: 880 },
        { value: 920 },
        { value: 945 },
        { value: 960 },
        { value: 975 },
        { value: 982 },
      ],
      icon: <CheckCircle size={24} />,
    },
  ];

  return (
    <div className="flex h-screen bg-[#0a0a0f]">
      <AdminSidebar currentPage="overview" />

      <main className="flex-1 overflow-auto">
        <div className="p-8 space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Admin Dashboard</h1>
            <p className="text-white/60">Welcome back! Here's what's happening with LifeFlow today.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsData.map((stat) => (
              <AdminStatsCard
                key={stat.title}
                title={stat.title}
                value={stat.value}
                trend={stat.trend}
                trendLabel={stat.trendLabel}
                sparklineData={stat.sparklineData}
                icon={stat.icon}
              />
            ))}
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
