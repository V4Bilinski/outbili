import { motion } from 'framer-motion'
import { useState } from 'react'

/**
 * Stagger Letters — Adaptado de AIOX Brandbook
 * Cada letra sobe com spring + rotateX 3D. Underline neon fecha após.
 * Original: 1.5s, navbar/footer. Aqui generalizado para qualquer string curta.
 */
type StaggerLettersProps = {
  text?: string
  /** Delay incremental por letra */
  letterDelayStep?: number
  /** Delay base */
  baseDelay?: number
  /** Tamanho da fonte (clamp recomendado) */
  fontSize?: string
  underline?: boolean
  replayOnClick?: boolean
  className?: string
}

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 20 }

export function StaggerLetters({
  text = 'OUTBILI',
  letterDelayStep = 0.15,
  baseDelay = 0.3,
  fontSize = 'clamp(2rem, 5vw, 3.5rem)',
  underline = true,
  replayOnClick = false,
  className = '',
}: StaggerLettersProps) {
  const [replayKey, setReplayKey] = useState(0)
  const letters = text.split('')
  const lastDelay = baseDelay + (letters.length - 1) * letterDelayStep

  return (
    <div
      className={`relative inline-flex flex-col items-center ${
        replayOnClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={replayOnClick ? () => setReplayKey((k) => k + 1) : undefined}
      style={{ perspective: 600, paddingBottom: 16 }}
      key={replayKey}
    >
      <div className="flex items-end justify-center gap-2">
        {letters.map((char, i) => (
          <motion.span
            key={`${i}-${char}`}
            initial={{ opacity: 0, y: 30, rotateX: 90 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{
              delay: baseDelay + i * letterDelayStep,
              duration: 0.6,
              ...SPRING,
            }}
            className="font-heading text-text-primary"
            style={{
              transformOrigin: 'bottom center',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              fontSize,
              display: 'inline-block',
            }}
          >
            {char === ' ' ? ' ' : char}
          </motion.span>
        ))}
      </div>

      {underline && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{
            delay: lastDelay + 0.35,
            duration: 0.5,
            ease: [0, 0, 0.2, 1],
          }}
          style={{
            marginTop: 8,
            width: 200,
            maxWidth: '80%',
            height: 2,
            background: '#E63329',
            transformOrigin: 'left center',
          }}
        />
      )}
    </div>
  )
}
