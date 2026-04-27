import { motion } from 'framer-motion'
import { useState } from 'react'

/**
 * Orchestration Pulse — Adaptado de AIOX Brandbook
 * Seed dot → stagger letters → speed lines → glow ring pulsante.
 * Original: 3.5s, full reveal, hero/splash.
 */
type OrchestrationPulseProps = {
  word?: string
  replayOnClick?: boolean
  className?: string
}

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 20 }

const LETTERS_CONFIG = [
  { delay: 0.6, x: -90 },
  { delay: 0.75, x: -30 },
  { delay: 0.9, x: 30 },
  { delay: 1.05, x: 90 },
]

function buildLetterPlacements(word: string) {
  // Distribuir as letras em torno do centro
  const len = word.length
  const half = (len - 1) / 2
  const step = 60
  return word.split('').map((char, i) => ({
    char,
    delay: 0.6 + i * 0.15,
    x: (i - half) * step,
  }))
}

export function OrchestrationPulse({
  word = 'AIOX',
  replayOnClick = false,
  className = '',
}: OrchestrationPulseProps) {
  const [replayKey, setReplayKey] = useState(0)
  const letters = word === 'AIOX'
    ? word.split('').map((char, i) => ({ char, ...LETTERS_CONFIG[i] }))
    : buildLetterPlacements(word)

  return (
    <div
      className={`relative flex items-center justify-center w-full h-full ${
        replayOnClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={replayOnClick ? () => setReplayKey((k) => k + 1) : undefined}
      style={{ minHeight: 280 }}
      key={replayKey}
    >
      {/* Glow ring (loop) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: [0, 0.25, 0], scale: [0.8, 1.15, 0.8] }}
        transition={{ duration: 2.5, delay: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          width: 280,
          height: 120,
          borderRadius: '50%',
          background: '#E63329',
          filter: 'blur(60px)',
        }}
      />

      {/* Seed dot */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4, ...SPRING }}
        style={{
          position: 'absolute',
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: '#E63329',
        }}
      />

      {/* Stagger letters */}
      {letters.map((l, i) => (
        <motion.span
          key={`${i}-${l.char}`}
          initial={{ opacity: 0, y: 25, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: l.delay, duration: 0.6, ...SPRING }}
          className="font-heading text-red"
          style={{
            position: 'absolute',
            fontSize: 'clamp(2rem, 5vw, 2.5rem)',
            fontWeight: 800,
            transform: `translateX(${l.x}px)`,
            left: `calc(50% + ${l.x}px)`,
            marginLeft: '-0.7rem',
            color: '#E63329',
          }}
        >
          {l.char}
        </motion.span>
      ))}

      {/* Speed lines (left side) */}
      {[1.4, 1.5, 1.6].map((delay, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 0.5, scaleX: 1 }}
          transition={{ delay, duration: 0.5, ease: [0, 0, 0.2, 1] }}
          style={{
            position: 'absolute',
            left: 20,
            top: `${35 + 15 * i}%`,
            width: 80,
            height: 1.5,
            background: '#E63329',
            transformOrigin: 'left',
          }}
        />
      ))}
    </div>
  )
}
