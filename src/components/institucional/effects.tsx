import { useEffect, useRef } from 'react'
import { useInView, animate } from 'framer-motion'
import { cn } from '../../lib/cn'

/**
 * Efeitos visuais portados do template "notio" (styleui.dev), re-implementados
 * com a stack do OUTBILI (framer-motion + tokens próprios) — sem shadcn, sem
 * next-themes, sem @base-ui. Respondem ao tema via tokens semânticos, então
 * funcionam em dark e light sem hardcode de cor.
 */

/**
 * OrbBackground — orbe radial difuso de luz vermelha (ambiente).
 * Usa tokens translúcidos da marca, legíveis sobre qualquer tema.
 */
export function OrbBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('absolute pointer-events-none rounded-full', className)}
      style={{
        background:
          'radial-gradient(circle at center, var(--color-red-glow) 0%, var(--color-red-subtle) 55%, transparent 100%)',
        filter: 'blur(70px)',
        zIndex: 0,
      }}
    />
  )
}

/**
 * Beam — feixe de luz cônico descendo do topo (assinatura visual do notio).
 * Triângulo via borders + blur forte. Vermelho translúcido da marca.
 */
export function Beam({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'absolute left-1/2 -translate-x-1/2 -z-0 pointer-events-none',
        className,
      )}
    >
      {/* Cone amplo e difuso */}
      <div
        className="h-0 w-0 blur-[110px] opacity-70"
        style={{
          borderLeft: 'clamp(180px, 32vw, 460px) solid transparent',
          borderRight: 'clamp(180px, 32vw, 460px) solid transparent',
          borderTop: 'clamp(320px, 48vw, 560px) solid var(--color-red-glow)',
        }}
      />
    </div>
  )
}

/**
 * Counter — número que anima de 0 até o valor quando entra em viewport.
 * Porta direta do Counter do notio, usando o `animate`/`useInView` do
 * framer-motion (em vez do pacote `motion`).
 */
export function Counter({
  value,
  suffix = '',
  duration = 2,
}: {
  value: number
  suffix?: string
  duration?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  useEffect(() => {
    if (!inView) return
    const node = ref.current
    if (!node) return
    const controls = animate(0, value, {
      duration,
      ease: 'easeOut',
      onUpdate(latest) {
        node.textContent = Math.floor(latest).toString() + suffix
      },
    })
    return () => controls.stop()
  }, [inView, value, suffix, duration])

  return <span ref={ref}>0{suffix}</span>
}
