'use client';

import React, { ReactNode } from 'react';
import { ChevronRight, LucideIcon } from 'lucide-react';

interface SettingItem {
  id: string;
  label: string;
  icon: LucideIcon;
  action: () => void;
  toggle?: boolean;
  enabled?: boolean;
  isDanger?: boolean;
  rightContent?: ReactNode;
}

interface SettingsSectionProps {
  title: string;
  items: SettingItem[];
  isDanger?: boolean;
}

export function SettingsSection({
  title,
  items,
  isDanger = false,
}: SettingsSectionProps) {
  return (
    <div className="mb-6">
      <h3 className={`text-sm font-semibold mb-3 uppercase tracking-wider ${
        isDanger ? 'text-red-400' : 'text-gray-400'
      }`}>
        {title}
      </h3>
      <div className="glass rounded-2xl overflow-hidden divide-y divide-white/5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.action}
              className={`w-full flex items-center justify-between px-6 py-4 transition-colors ${
                item.isDanger
                  ? 'hover:bg-red-500/20 text-red-400'
                  : 'hover:bg-white/10 text-white'
              }`}
            >
              <div className="flex items-center gap-4">
                <Icon size={20} className="text-gray-400" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>

              {item.rightContent ? (
                item.rightContent
              ) : item.toggle ? (
                <div
                  className={`w-10 h-6 rounded-full transition-colors ${
                    item.enabled
                      ? 'bg-purple-500'
                      : 'bg-white/10'
                  } flex items-center ${item.enabled ? 'justify-end' : 'justify-start'} px-1`}
                >
                  <div className="w-4 h-4 bg-white rounded-full" />
                </div>
              ) : (
                <ChevronRight size={20} className="text-gray-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
