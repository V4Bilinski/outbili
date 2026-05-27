import { cn } from '../../lib/cn'
import { Loader2 } from 'lucide-react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'whatsapp'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: React.ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-red text-white hover:bg-red-vivid active:bg-red-dark shadow-lg shadow-red/20 hover:shadow-red/30',
  secondary: 'bg-elevated-2 text-text-primary hover:bg-elevated-hover border border-border hover:border-border-strong',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-elevated-2',
  danger: 'bg-error/10 text-error hover:bg-error/20 border border-error/20',
  whatsapp: 'bg-whatsapp text-white hover:bg-whatsapp/90 active:bg-whatsapp/80 shadow-lg shadow-whatsapp/20',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 min-h-[44px] md:min-h-0 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-sm gap-2.5 rounded-xl font-semibold',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red/30 focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        'disabled:pointer-events-none disabled:opacity-40',
        'cursor-pointer active:scale-[0.97]',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  )
}
