import React from 'react'

interface StepNavigationProps {
  onBack?: () => void | Promise<void>
  onNext?: () => void | Promise<void>
  nextLabel?: string
  backLabel?: string
  isLastStep?: boolean
  isLoading?: boolean
  className?: string
}

export function StepNavigation({
  onBack,
  onNext,
  nextLabel = 'Next',
  backLabel = 'Back',
  isLastStep = false,
  isLoading = false,
  className = '',
}: StepNavigationProps) {
  return (
    <div className={`flex gap-4 justify-between w-full ${className}`}>
      <button
        onClick={onBack}
        disabled={isLoading}
        className="px-6 py-2 rounded-lg border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-all duration-300 cursor-pointer"
      >
        {backLabel}
      </button>
      <button
        onClick={onNext}
        disabled={isLoading}
        className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold transition-all duration-300 cursor-pointer"
      >
        {isLoading ? 'Saving...' : isLastStep ? 'Complete' : nextLabel}
      </button>
    </div>
  )
}
