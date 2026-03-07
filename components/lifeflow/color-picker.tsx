'use client'

import React from 'react'

interface ColorPickerProps {
  colors: Array<{ name: string; value: string }>
  selected?: string
  onSelect: (color: string) => void
  className?: string
}

export function ColorPicker({
  colors,
  selected,
  onSelect,
  className = '',
}: ColorPickerProps) {
  return (
    <div className={`flex gap-4 justify-center flex-wrap ${className}`}>
      {colors.map((color) => (
        <button
          key={color.value}
          onClick={() => onSelect(color.value)}
          className={`w-12 h-12 rounded-full transition-all duration-300 transform hover:scale-110 cursor-pointer ${
            selected === color.value
              ? 'ring-2 ring-white scale-110'
              : 'ring-1 ring-white/20 hover:ring-white/40'
          }`}
          style={{ backgroundColor: color.value }}
          title={color.name}
        />
      ))}
    </div>
  )
}
