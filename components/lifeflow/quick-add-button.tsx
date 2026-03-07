'use client';

import React from 'react';
import { Plus } from 'lucide-react';

interface QuickAddButtonProps {
  onClick?: () => void;
}

export function QuickAddButton({ onClick }: QuickAddButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed right-4 bottom-24 lg:bottom-4 z-30 flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-[#1e3a8a] text-white shadow-lg shadow-black/40 transition-all hover:bg-[#2563eb] hover:scale-105 active:scale-95 group"
    >
      <Plus size={24} className="group-hover:rotate-90 transition-transform" />
    </button>
  );
}
