import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from '../../lib/cn'
import { copyToClipboard } from '../../lib/utils'

interface CopyButtonProps {
  text: string
  className?: string
  label?: string
}

export function CopyButton({ text, className, label = 'Copiar' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const success = await copyToClipboard(text)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'relative inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer overflow-hidden',
        'transition-all duration-250 ease-[cubic-bezier(0.4,0,0.2,1)]',
        'active:scale-95',
        copied
          ? 'bg-success/20 text-success scale-[1.03]'
          : 'bg-surface-lt text-text-secondary hover:text-text-primary hover:bg-surface-hover',
        className,
      )}
    >
      {copied && (
        <span className="absolute inset-0 bg-success/10 animate-[copy-flash_0.5s_ease_forwards]" />
      )}
      <span className="relative inline-flex items-center gap-1.5">
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? 'Copiado ✓' : label}
      </span>
    </button>
  )
}
