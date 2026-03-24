import { cn } from '../../lib/cn'

type BadgeVariant = 'default' | 'hot' | 'warm' | 'cold' | 'success' | 'warning' | 'error' | 'info' | 'outline'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  pulse?: boolean
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-surface-lt text-text-secondary',
  hot: 'bg-hot/20 text-hot border border-hot/30',
  warm: 'bg-warm/20 text-warm border border-warm/30',
  cold: 'bg-cold/20 text-cold border border-cold/30',
  success: 'bg-success/20 text-success border border-success/30',
  warning: 'bg-warning/20 text-warning border border-warning/30',
  error: 'bg-error/20 text-error border border-error/30',
  info: 'bg-info/20 text-info border border-info/30',
  outline: 'border border-stone-600 text-text-secondary',
}

export function Badge({ children, variant = 'default', pulse = false, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide',
        variantStyles[variant],
        pulse && 'animate-[pulse-glow_2s_ease-in-out_infinite]',
        className,
      )}
    >
      {children}
    </span>
  )
}
