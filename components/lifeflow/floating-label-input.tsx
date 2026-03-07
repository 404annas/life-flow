'use client'

import React, { useState } from 'react'

interface FloatingLabelInputProps {
  label: string
  type?: string
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  className?: string
}

export function FloatingLabelInput({
  label,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  className = '',
}: FloatingLabelInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const hasValue = value && value.length > 0

  return (
    <div className="relative w-full">
      <input
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={`w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-transparent focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all duration-300 ${className}`}
      />
      <label
        className={`absolute left-4 transition-all duration-300 pointer-events-none ${
          isFocused || hasValue
            ? 'top-1 text-xs text-white/70'
            : 'top-3.5 text-base text-white/50'
        }`}
      >
        {label}
      </label>
    </div>
  )
}
