import { cn } from '../../lib/cn'

interface CardProps {
  children: React.ReactNode
  className?: string
  accent?: 'red' | 'hot' | 'warm' | 'cold' | 'success' | 'none'
  hover?: boolean
  glass?: boolean
  onClick?: () => void
}

const accentStyles: Record<string, string> = {
  red: 'border-l-[3px] border-l-red',
  hot: 'border-l-[3px] border-l-hot',
  warm: 'border-l-[3px] border-l-warm',
  cold: 'border-l-[3px] border-l-cold',
  success: 'border-l-[3px] border-l-success',
  none: '',
}

export function Card({ children, className, accent = 'none', hover = false, glass = true, onClick }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl p-5',
        glass
          ? 'bg-gradient-to-br from-surface/80 to-surface-md/60 backdrop-blur-xl border border-border'
          : 'bg-surface border border-border',
        accentStyles[accent],
        hover && 'transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-xl hover:shadow-black/20 cursor-pointer',
        onClick && 'cursor-pointer',
        className,
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mb-4', className)}>{children}</div>
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn('text-sm font-semibold text-text-secondary uppercase tracking-[0.1em] font-heading', className)}>{children}</h3>
}

export function CardValue({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('text-3xl font-bold font-mono text-text-primary tracking-tight', className)}>{children}</p>
}

export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('text-xs text-text-muted mt-1', className)}>{children}</p>
}
