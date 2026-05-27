import { cn } from '../../lib/cn'
import { Button } from './Button'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: { label: string; onClick: () => void }
  secondaryAction?: { label: string; onClick: () => void }
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, secondaryAction, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-20 px-4 text-center', className)}>
      <div className="p-5 rounded-2xl bg-elevated-1 border border-border mb-6">
        <Icon className="h-10 w-10 text-text-muted" strokeWidth={1.2} />
      </div>
      <h3 className="text-lg font-semibold text-text-primary font-heading mb-2">{title}</h3>
      <p className="text-sm text-text-muted max-w-sm mb-8 leading-relaxed">{description}</p>
      {action && <Button onClick={action.onClick} size="lg">{action.label}</Button>}
      {secondaryAction && (
        <Button variant="ghost" onClick={secondaryAction.onClick} className="mt-3">
          {secondaryAction.label}
        </Button>
      )}
    </div>
  )
}
