import { cn } from '../../lib/cn'
import { Button } from './Button'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, secondaryAction, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <Icon className="h-16 w-16 text-stone-600 mb-4" strokeWidth={1} />
      <h3 className="text-lg font-semibold text-text-primary font-heading mb-2">{title}</h3>
      <p className="text-sm text-text-secondary max-w-sm mb-6">{description}</p>
      {action && (
        <Button onClick={action.onClick} size="lg">
          {action.label}
        </Button>
      )}
      {secondaryAction && (
        <Button variant="ghost" onClick={secondaryAction.onClick} className="mt-2">
          {secondaryAction.label}
        </Button>
      )}
    </div>
  )
}
