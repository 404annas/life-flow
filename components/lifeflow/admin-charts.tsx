'use client';

import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const signupData = [
  { date: 'Jan 1', signups: 45 },
  { date: 'Jan 5', signups: 62 },
  { date: 'Jan 10', signups: 58 },
  { date: 'Jan 15', signups: 81 },
  { date: 'Jan 20', signups: 95 },
  { date: 'Jan 25', signups: 112 },
  { date: 'Jan 30', signups: 128 },
];

const tasksData = [
  { day: 'Mon', created: 125, completed: 98 },
  { day: 'Tue', created: 142, completed: 115 },
  { day: 'Wed', created: 156, completed: 134 },
  { day: 'Thu', created: 168, completed: 142 },
  { day: 'Fri', created: 198, completed: 175 },
  { day: 'Sat', created: 142, completed: 128 },
  { day: 'Sun', created: 98, completed: 85 },
];

const statusData = [
  { name: 'Pending', value: 245, color: '#6b7280' },
  { name: 'In Progress', value: 382, color: '#a855f7' },
  { name: 'Completed', value: 521, color: '#34c759' },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/80 border border-white/20 rounded-lg p-3 backdrop-blur-sm">
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm font-medium">
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function AdminCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* User Signups */}
      <div className="glass rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-bold text-white mb-6">User Signups (30 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={signupData}>
            <defs>
              <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
            <YAxis stroke="rgba(255,255,255,0.5)" />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="signups"
              stroke="#a855f7"
              fill="url(#colorSignups)"
              strokeWidth={2}
              dot={{ fill: '#a855f7', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Tasks Created vs Completed */}
      <div className="glass rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-bold text-white mb-6">Tasks: Created vs Completed (7 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={tasksData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" />
            <YAxis stroke="rgba(255,255,255,0.5)" />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar dataKey="created" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            <Bar dataKey="completed" fill="#34c759" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Task Status Distribution */}
      <div className="glass rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-bold text-white mb-6">Task Status Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              paddingAngle={2}
              dataKey="value"
            >
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-6 mt-6">
          {statusData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
              <span className="text-sm text-white/70">
                {item.name}: {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Placeholder for future analytics */}
      <div className="glass rounded-2xl p-6 border border-white/10 flex items-center justify-center min-h-[400px]">
        <p className="text-white/40 text-center">Additional analytics coming soon</p>
      </div>
    </div>
  );
}
