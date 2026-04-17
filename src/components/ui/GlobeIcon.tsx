import { Globe } from 'lucide-react'
import { cn } from '../../lib/cn'

export function GlobeIcon({ className }: { className?: string }) {
  return <Globe className={cn('shrink-0', className)} aria-hidden="true" />
}
