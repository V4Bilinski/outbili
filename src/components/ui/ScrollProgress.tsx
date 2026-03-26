import { useScrollProgress } from '../../hooks/useScrollProgress'

export function ScrollProgress() {
  const progress = useScrollProgress()

  return (
    <div
      className="fixed top-0 left-0 h-[3px] z-[200] pointer-events-none transition-[width] duration-100 linear"
      style={{
        width: `${progress}%`,
        background: 'linear-gradient(90deg, var(--color-red), var(--color-red-vivid))',
      }}
    />
  )
}
