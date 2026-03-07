import { AnimatedGradientBg } from '@/components/lifeflow/animated-gradient-bg'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AnimatedGradientBg>
      <div className="flex items-center justify-center min-h-screen px-4">
        {children}
      </div>
    </AnimatedGradientBg>
  )
}
