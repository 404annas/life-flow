import React from 'react'

interface ProgressDotsProps {
  totalSteps: number
  currentStep: number
  className?: string
}

export function ProgressDots({
  totalSteps,
  currentStep,
  className = '',
}: ProgressDotsProps) {
  return (
    <div className={`flex gap-2 justify-center ${className}`}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            index < currentStep
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 scale-110'
              : index === currentStep
                ? 'bg-white/60 scale-100'
                : 'bg-white/20'
          }`}
        />
      ))}
    </div>
  )
}
