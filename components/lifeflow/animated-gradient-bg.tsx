import React from 'react'

interface AnimatedGradientBgProps {
  children: React.ReactNode
  className?: string
}

export function AnimatedGradientBg({
  children,
  className = '',
}: AnimatedGradientBgProps) {
  return (
    <div className={`relative min-h-screen w-full overflow-hidden bg-[#0a0a0f] ${className}`}>
      {/* Subtle dark-theme ambient blobs (no gradients) */}
      <div
        className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse"
        style={{
          backgroundColor: 'rgba(37, 99, 235, 0.35)',
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse"
        style={{
          backgroundColor: 'rgba(79, 70, 229, 0.3)',
          animationDelay: '1s',
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
