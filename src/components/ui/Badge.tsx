import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '../../lib/cn'

type BadgeVariant = 'default' | 'hot' | 'warm' | 'cold' | 'success' | 'warning' | 'error' | 'info' | 'outline'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  pulse?: boolean
  size?: 'xs' | 'sm' | 'md'
  /** Entrada com spring (escala) ao montar. Opt-in: nao afeta badges existentes. */
  enter?: boolean
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-elevated-2 text-text-secondary border border-border-strong',
  hot: 'bg-hot/12 text-hot border border-hot/20 shadow-[0_0_12px_rgba(255,59,48,0.1)]',
  warm: 'bg-warm/12 text-warm border border-warm/20',
  cold: 'bg-cold/12 text-cold border border-cold/20',
  success: 'bg-success/12 text-success border border-success/20',
  warning: 'bg-warning/12 text-warning border border-warning/20',
  error: 'bg-error/12 text-error border border-error/20',
  info: 'bg-info/12 text-info border border-info/20',
  outline: 'border border-border-strong text-text-secondary',
}

export function Badge({ children, variant = 'default', pulse = false, size = 'md', enter = false, className }: BadgeProps) {
  const reduce = useReducedMotion()
  const classes = cn(
    'inline-flex items-center gap-1 rounded-full font-medium uppercase tracking-wide leading-none',
    size === 'xs' ? 'px-1.5 py-0.5 text-[8px]' : size === 'sm' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-[3px] text-[10px]',
    variantStyles[variant],
    pulse && 'animate-[pulse-glow_2s_ease-in-out_infinite]',
    className,
  )

  // Entrada spring apenas quando solicitado e sem reduced-motion. Default: span estatico (sem regressao).
  if (enter && !reduce) {
    return (
      <motion.span
        className={classes}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        {children}
      </motion.span>
    )
  }

  return <span className={classes}>{children}</span>
}
