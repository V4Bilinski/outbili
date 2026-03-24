import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/cn'

interface AccordionItemProps {
  title: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
  accentColor?: string
}

export function AccordionItem({ title, children, defaultOpen = false, className, accentColor }: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div
      className={cn(
        'rounded-lg bg-surface border border-stone-800/50 overflow-hidden',
        accentColor && `border-l-3`,
        className,
      )}
      style={accentColor ? { borderLeftColor: accentColor } : undefined}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-4 text-left cursor-pointer hover:bg-surface-hover transition-colors"
      >
        <div className="flex-1">{title}</div>
        <ChevronDown
          className={cn('h-4 w-4 text-text-secondary transition-transform', open && 'rotate-180')}
        />
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-300',
          open ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <div className="px-4 pb-4">{children}</div>
      </div>
    </div>
  )
}
