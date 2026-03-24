import { cn } from '../../lib/cn'

interface CardProps {
  children: React.ReactNode
  className?: string
  accent?: 'red' | 'hot' | 'warm' | 'cold' | 'success' | 'none'
  hover?: boolean
  onClick?: () => void
}

const accentStyles: Record<string, string> = {
  red: 'border-l-3 border-l-red',
  hot: 'border-l-3 border-l-hot',
  warm: 'border-l-3 border-l-warm',
  cold: 'border-l-3 border-l-cold',
  success: 'border-l-3 border-l-success',
  none: '',
}

export function Card({ children, className, accent = 'none', hover = false, onClick }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-surface border border-stone-800/50 p-4',
        accentStyles[accent],
        hover && 'transition-transform hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20 cursor-pointer',
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
  return <div className={cn('mb-3', className)}>{children}</div>
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn('text-sm font-semibold text-text-primary font-heading', className)}>{children}</h3>
}

export function CardValue({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('text-2xl font-bold font-mono text-text-primary', className)}>{children}</p>
}

export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('text-xs text-text-secondary mt-1', className)}>{children}</p>
}
