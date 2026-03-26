import { useInView } from '../../hooks/useInView'
import { cn } from '../../lib/cn'

interface AnimateInProps {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale'
  duration?: number
}

const directionStyles = {
  up: 'translate-y-4',
  down: '-translate-y-4',
  left: 'translate-x-4',
  right: '-translate-x-4',
  scale: 'scale-95',
}

export function AnimateIn({ children, className, delay = 0, direction = 'up', duration = 400 }: AnimateInProps) {
  const { ref, isInView } = useInView({ threshold: 0.1 })

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all ease-out',
        isInView ? 'opacity-100 translate-y-0 translate-x-0 scale-100' : `opacity-0 ${directionStyles[direction]}`,
        className,
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

interface StaggerProps {
  children: React.ReactNode[]
  className?: string
  staggerDelay?: number
  direction?: AnimateInProps['direction']
}

export function Stagger({ children, className, staggerDelay = 80, direction = 'up' }: StaggerProps) {
  const { ref, isInView } = useInView({ threshold: 0.05 })

  return (
    <div ref={ref} className={className}>
      {children.map((child, i) => (
        <div
          key={i}
          className={cn(
            'transition-all duration-400 ease-out',
            isInView ? 'opacity-100 translate-y-0 scale-100' : `opacity-0 ${directionStyles[direction]}`,
          )}
          style={{ transitionDelay: isInView ? `${i * staggerDelay}ms` : '0ms' }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}
