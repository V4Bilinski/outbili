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
        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer',
        copied
          ? 'bg-success/20 text-success'
          : 'bg-surface-lt text-text-secondary hover:text-text-primary hover:bg-surface-hover',
        className,
      )}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copiado ✓' : label}
    </button>
  )
}
