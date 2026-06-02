import { useEffect, useState } from 'react'
import { animate, useReducedMotion } from 'framer-motion'

// Score SPICED como sinal vivo: conta de 0 ate o valor real ao montar (motion-framer).
// Respeita prefers-reduced-motion (mostra o valor final direto, sem contagem nem setState no effect).
// Compartilhado entre LeadCard (modo cards) e PipelineCard (kanban) para consistencia.
export function AnimatedScore({ score, className }: { score: number; className?: string }) {
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(0)
  useEffect(() => {
    if (reduce) return
    const controls = animate(0, score, {
      duration: 0.5,
      ease: 'easeOut',
      onUpdate: (v) => setShown(v),
    })
    return () => controls.stop()
  }, [score, reduce])
  return <span className={className}>{(reduce ? score : shown).toFixed(1)}</span>
}
