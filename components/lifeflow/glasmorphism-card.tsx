import React from 'react'

interface GlassmorphismCardProps {
  children: React.ReactNode
  className?: string
}

export function GlassmorphismCard({ children, className = '' }: GlassmorphismCardProps) {
  return (
    <div className={`glass p-8 w-full max-w-lg ${className}`}>
      {children}
    </div>
  )
}
