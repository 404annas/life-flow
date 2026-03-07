'use client';

import React, { useState } from 'react';
import { AdminSidebar } from '@/components/lifeflow/admin-sidebar';
import { Save } from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    siteName: 'LifeFlow',
    maintenanceMode: false,
    emailNotifications: true,
    slackAlerts: true,
    maxUsersPerDay: '500',
    sessionTimeout: '24',
  });

  const handleSave = () => {
    console.log('Settings saved:', settings);
  };

  return (
    <div className="flex h-screen bg-[#0a0a0f]">
      <AdminSidebar currentPage="settings" />

      <main className="flex-1 overflow-auto">
        <div className="p-8 space-y-8 max-w-2xl">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Admin Settings</h1>
            <p className="text-white/60">Configure LifeFlow application settings and preferences.</p>
          </div>

          {/* Settings Sections */}
          <div className="space-y-6">
            {/* General Settings */}
            <div className="glass rounded-2xl p-6 border border-white/10 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-4">General Settings</h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Site Name</label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="w-full px-4 py-3 glass rounded-lg border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50 focus:bg-white/5 transition-all"
                />
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="w-12 h-6 rounded-full bg-white/10 border border-white/20 relative transition-all">
                    <div
                      className={`w-5 h-5 rounded-full bg-gradient-purple-pink absolute top-0.5 transition-all ${
                        settings.maintenanceMode ? 'right-0.5' : 'left-0.5'
                      }`}
                    ></div>
                  </div>
                  <span className="text-white font-medium">Maintenance Mode</span>
                </label>
              </div>
            </div>

            {/* Notifications */}
            <div className="glass rounded-2xl p-6 border border-white/10 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-4">Notifications</h2>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <div className="w-12 h-6 rounded-full bg-white/10 border border-white/20 relative transition-all">
                  <div
                    className={`w-5 h-5 rounded-full bg-gradient-purple-pink absolute top-0.5 transition-all ${
                      settings.emailNotifications ? 'right-0.5' : 'left-0.5'
                    }`}
                  ></div>
                </div>
                <span className="text-white font-medium">Email Notifications</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <div className="w-12 h-6 rounded-full bg-white/10 border border-white/20 relative transition-all">
                  <div
                    className={`w-5 h-5 rounded-full bg-gradient-purple-pink absolute top-0.5 transition-all ${
                      settings.slackAlerts ? 'right-0.5' : 'left-0.5'
                    }`}
                  ></div>
                </div>
                <span className="text-white font-medium">Slack Alerts</span>
              </label>
            </div>

            {/* Limits */}
            <div className="glass rounded-2xl p-6 border border-white/10 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-4">Rate Limits</h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Max Users Per Day</label>
                <input
                  type="number"
                  value={settings.maxUsersPerDay}
                  onChange={(e) => setSettings({ ...settings, maxUsersPerDay: e.target.value })}
                  className="w-full px-4 py-3 glass rounded-lg border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50 focus:bg-white/5 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Session Timeout (hours)</label>
                <input
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })}
                  className="w-full px-4 py-3 glass rounded-lg border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50 focus:bg-white/5 transition-all"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-purple-pink rounded-lg text-white font-medium hover:opacity-90 transition-all"
              >
                <Save size={18} />
                Save Settings
              </button>
              <button className="px-6 py-3 glass rounded-lg text-white font-medium hover:bg-white/10 transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
