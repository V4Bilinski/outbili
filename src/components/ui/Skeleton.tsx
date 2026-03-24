import { cn } from '../../lib/cn'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl skeleton-shimmer', className)} />
  )
}
