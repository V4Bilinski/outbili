import { motion } from 'framer-motion'
import { useState } from 'react'

/**
 * Brand Reveal — Adaptado de AIOX Brandbook (https://brand.aioxsquad.ai/brandbook/motion)
 *
 * Black blinds slide open from center, revealing word + scale + glow + decorative lines.
 * Original: 3s, premium, landing page hero. AIOX → bb-lime substituído por --color-red.
 *
 * @example
 * <BrandReveal word="OUTBILI" />
 */
type BrandRevealProps = {
  word?: string
  /** Texto pequeno em mono abaixo do word */
  subtitle?: string
  /** Click para replay (incrementa key) */
  replayOnClick?: boolean
  className?: string
}

export function BrandReveal({
  word = 'OUTBILI',
  subtitle = 'do CNPJ ao contrato.',
  replayOnClick = false,
  className = '',
}: BrandRevealProps) {
  const [replayKey, setReplayKey] = useState(0)

  return (
    <div
      className={`relative flex items-center justify-center w-full h-full overflow-hidden ${
        replayOnClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={replayOnClick ? () => setReplayKey((k) => k + 1) : undefined}
      style={{ minHeight: 320 }}
    >
      {/* Glow halo behind word */}
      <motion.div
        key={`glow-${replayKey}`}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 0.2, scale: 1 }}
        transition={{ delay: 1.2, duration: 1, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          width: 300,
          height: 100,
          borderRadius: '50%',
          background: '#E63329',
          filter: 'blur(50px)',
        }}
      />

      {/* The word */}
      <motion.span
        key={`word-${replayKey}`}
        initial={{ opacity: 0, scale: 1.3 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
        className="font-heading text-text-primary"
        style={{
          fontSize: 'clamp(2.5rem, 8vw, 5rem)',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          zIndex: 1,
        }}
      >
        {word}
      </motion.span>

      {/* Left blind */}
      <motion.div
        key={`blind-l-${replayKey}`}
        initial={{ x: 0 }}
        animate={{ x: '-100%' }}
        transition={{ delay: 0.4, duration: 0.8, ease: [0, 0, 0.2, 1] }}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: '50%',
          background: '#09090B',
          zIndex: 2,
        }}
      />

      {/* Right blind */}
      <motion.div
        key={`blind-r-${replayKey}`}
        initial={{ x: 0 }}
        animate={{ x: '100%' }}
        transition={{ delay: 0.4, duration: 0.8, ease: [0, 0, 0.2, 1] }}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: '50%',
          background: '#09090B',
          zIndex: 2,
        }}
      />

      {/* Decorative lines (left + right) */}
      <motion.div
        key={`line-l-${replayKey}`}
        initial={{ width: 0 }}
        animate={{ width: 80 }}
        transition={{ delay: 1.6, duration: 0.8, ease: [0, 0, 0.2, 1] }}
        style={{
          position: 'absolute',
          top: '50%',
          right: 'calc(50% + 120px)',
          height: 1,
          background:
            'linear-gradient(90deg, transparent, #E63329, transparent)',
          zIndex: 1,
        }}
      />
      <motion.div
        key={`line-r-${replayKey}`}
        initial={{ width: 0 }}
        animate={{ width: 80 }}
        transition={{ delay: 1.6, duration: 0.8, ease: [0, 0, 0.2, 1] }}
        style={{
          position: 'absolute',
          top: '50%',
          left: 'calc(50% + 120px)',
          height: 1,
          background:
            'linear-gradient(90deg, transparent, #E63329, transparent)',
          zIndex: 1,
        }}
      />

      {/* Subtitle (mono) */}
      {subtitle && (
        <motion.span
          key={`sub-${replayKey}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.8, ease: [0, 0, 0.2, 1] }}
          className="font-mono text-text-muted"
          style={{
            position: 'absolute',
            bottom: 35,
            fontSize: '0.6rem',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            zIndex: 1,
          }}
        >
          {subtitle}
        </motion.span>
      )}
    </div>
  )
}
