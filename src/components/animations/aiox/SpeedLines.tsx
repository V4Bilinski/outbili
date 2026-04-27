import { motion } from 'framer-motion'
import { useState } from 'react'

/**
 * Speed Lines — Adaptado de AIOX Brandbook
 * Texto desliza enquanto 7 linhas neon se desenham (stagger 0.5s, easeOut).
 * Original: 2s, emphasis. AIOX → cor neon substituída por --color-red.
 */
type SpeedLinesProps = {
  word?: string
  replayOnClick?: boolean
  className?: string
}

const LINES = [
  { y: '18%', width: 100, delay: 0.8 },
  { y: '30%', width: 70, delay: 0.9 },
  { y: '45%', width: 110, delay: 1.0 },
  { y: '58%', width: 60, delay: 1.1 },
  { y: '72%', width: 95, delay: 1.2 },
  { y: '38%', width: 50, delay: 1.3 },
  { y: '62%', width: 80, delay: 1.4 },
]

export function SpeedLines({
  word = 'OUTBILI',
  replayOnClick = false,
  className = '',
}: SpeedLinesProps) {
  const [replayKey, setReplayKey] = useState(0)

  return (
    <div
      className={`relative flex items-center justify-center w-full h-full ${
        replayOnClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={replayOnClick ? () => setReplayKey((k) => k + 1) : undefined}
      style={{ minHeight: 240 }}
    >
      {LINES.map((line, i) => (
        <motion.div
          key={`line-${i}-${replayKey}`}
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 0.6, scaleX: 1 }}
          transition={{ delay: line.delay, duration: 0.5, ease: [0, 0, 0.2, 1] }}
          style={{
            position: 'absolute',
            left: 10,
            top: line.y,
            width: line.width,
            height: i % 2 === 0 ? 2 : 1.5,
            background: '#E63329',
            transformOrigin: 'left center',
          }}
        />
      ))}
      <motion.span
        key={`word-${replayKey}`}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.8, ease: [0, 0, 0.2, 1] }}
        className="font-heading text-text-primary"
        style={{
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          zIndex: 1,
        }}
      >
        {word}
      </motion.span>
    </div>
  )
}
