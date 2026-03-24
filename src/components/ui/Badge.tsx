import { cn } from '../../lib/cn'

type BadgeVariant = 'default' | 'hot' | 'warm' | 'cold' | 'success' | 'warning' | 'error' | 'info' | 'outline'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  pulse?: boolean
  size?: 'sm' | 'md'
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-white/5 text-text-secondary border border-white/8',
  hot: 'bg-hot/12 text-hot border border-hot/20 shadow-[0_0_12px_rgba(255,59,48,0.1)]',
  warm: 'bg-warm/12 text-warm border border-warm/20',
  cold: 'bg-cold/12 text-cold border border-cold/20',
  success: 'bg-success/12 text-success border border-success/20',
  warning: 'bg-warning/12 text-warning border border-warning/20',
  error: 'bg-error/12 text-error border border-error/20',
  info: 'bg-info/12 text-info border border-info/20',
  outline: 'border border-white/10 text-text-secondary',
}

export function Badge({ children, variant = 'default', pulse = false, size = 'md', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-semibold uppercase tracking-wider',
        size === 'sm' ? 'px-2 py-px text-[10px]' : 'px-2.5 py-0.5 text-[11px]',
        variantStyles[variant],
        pulse && 'animate-[pulse-glow_2s_ease-in-out_infinite]',
        className,
      )}
    >
      {children}
    </span>
  )
}
