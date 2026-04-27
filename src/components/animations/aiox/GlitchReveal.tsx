import { motion } from 'framer-motion'
import { useState } from 'react'

/**
 * Glitch Reveal — Adaptado de AIOX Brandbook
 * Scanlines + RGB channel split (cyan/red) + skew + hue-rotate com settle suave.
 * Original: 2s, dramatic, tech/hacker.
 */
type GlitchRevealProps = {
  word?: string
  replayOnClick?: boolean
  className?: string
}

const TEXT_BASE = {
  fontFamily: 'var(--font-heading), Plus Jakarta Sans, system-ui, sans-serif',
  fontSize: 'clamp(2rem, 5vw, 3.5rem)',
  fontWeight: 800,
  letterSpacing: '-0.02em',
  position: 'absolute' as const,
  whiteSpace: 'nowrap' as const,
}

export function GlitchReveal({
  word = 'OUTBILI',
  replayOnClick = false,
  className = '',
}: GlitchRevealProps) {
  const [replayKey, setReplayKey] = useState(0)

  return (
    <div
      className={`relative flex items-center justify-center w-full h-full ${
        replayOnClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={replayOnClick ? () => setReplayKey((k) => k + 1) : undefined}
      style={{ minHeight: 240 }}
      key={replayKey}
    >
      {/* Scanlines flicker */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0] }}
        transition={{ delay: 0.4, duration: 0.96, ease: 'linear' }}
        style={{
          position: 'absolute',
          inset: -20,
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(230,51,41,0.03) 2px, rgba(230,51,41,0.03) 4px)',
          pointerEvents: 'none',
        }}
      />
      {/* Scanline sweep */}
      <motion.div
        initial={{ top: '-2px', opacity: 0 }}
        animate={{
          top: ['-2px', '100%', '-2px', '100%', '-2px', '100%'],
          opacity: [0, 0.9, 0.9, 0.9, 0.9, 0],
        }}
        transition={{ delay: 0.4, duration: 1.8, ease: 'linear' }}
        style={{
          position: 'absolute',
          left: -20,
          right: -20,
          height: 2,
          background: '#E63329',
          pointerEvents: 'none',
        }}
      />
      {/* Cyan channel split */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.4, 0, 0.3, 0], x: [-6, 4, -3, 2, 0] }}
        transition={{ delay: 0.5, duration: 0.8, ease: 'linear' }}
        style={{ ...TEXT_BASE, color: 'cyan', mixBlendMode: 'screen' }}
      >
        {word}
      </motion.span>
      {/* Red channel split */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.4, 0, 0.3, 0], x: [6, -4, 3, -2, 0] }}
        transition={{ delay: 0.5, duration: 0.8, ease: 'linear' }}
        style={{ ...TEXT_BASE, color: '#FF3B30', mixBlendMode: 'screen' }}
      >
        {word}
      </motion.span>
      {/* Main text with glitch settle */}
      <motion.span
        initial={{ opacity: 0, x: -10, skewX: -8 }}
        animate={{
          opacity: [0, 1, 1, 1, 1],
          x: [-10, 0, -4, 3, -2, 0, 0],
          skewX: [-8, 0, -3, 2, 0, 0],
          filter: [
            'brightness(1)',
            'brightness(1.3) hue-rotate(20deg)',
            'brightness(0.8) hue-rotate(-15deg)',
            'brightness(1.5) hue-rotate(30deg)',
            'brightness(1.4) contrast(1.2)',
            'brightness(1) contrast(1)',
          ],
        }}
        transition={{
          delay: 0.4,
          duration: 1.4,
          ease: 'linear',
          times: [0, 0.07, 0.3, 0.5, 0.7, 1],
        }}
        style={{ ...TEXT_BASE, color: '#F4F4F5', position: 'relative', zIndex: 2 }}
      >
        {word}
      </motion.span>
    </div>
  )
}
