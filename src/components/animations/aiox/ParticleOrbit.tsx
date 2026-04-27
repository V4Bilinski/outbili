import { motion } from 'framer-motion'
import { useState, type CSSProperties } from 'react'

/**
 * Particle Orbit — Adaptado de AIOX Brandbook
 * Centro com SVG + 4 partículas orbitais (rotate 45°) com float.
 * Original: loop, agents. AIOX X → ícone customizável (default = X em SVG).
 */
type ParticleOrbitProps = {
  /** Render do centro. Default: X SVG. */
  center?: React.ReactNode
  size?: number
  replayOnClick?: boolean
  className?: string
}

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 20 }

function ParticleVertical({
  popDelay,
  floatDelay,
  style,
}: {
  popDelay: number
  floatDelay: number
  style: CSSProperties
}) {
  return (
    <motion.div
      initial={{ rotate: 45, scale: 0 }}
      animate={{ rotate: 45, scale: 1, marginTop: [0, -6, 0] }}
      transition={{
        scale: { delay: popDelay, duration: 0.5, ...SPRING },
        marginTop: {
          delay: floatDelay,
          duration: 2,
          ease: 'easeInOut',
          repeat: Infinity,
          repeatType: 'reverse',
        },
      }}
      style={{
        position: 'absolute',
        width: 14,
        height: 14,
        background: '#E63329',
        borderRadius: 2,
        ...style,
      }}
    />
  )
}

function ParticleHorizontal({
  popDelay,
  floatDelay,
  style,
}: {
  popDelay: number
  floatDelay: number
  style: CSSProperties
}) {
  return (
    <motion.div
      initial={{ rotate: 45, scale: 0 }}
      animate={{ rotate: 45, scale: 1, marginLeft: [0, -6, 0] }}
      transition={{
        scale: { delay: popDelay, duration: 0.5, ...SPRING },
        marginLeft: {
          delay: floatDelay,
          duration: 2,
          ease: 'easeInOut',
          repeat: Infinity,
          repeatType: 'reverse',
        },
      }}
      style={{
        position: 'absolute',
        width: 14,
        height: 14,
        background: '#E63329',
        borderRadius: 2,
        ...style,
      }}
    />
  )
}

const DEFAULT_CENTER = (
  <svg width="70" height="70" viewBox="0 0 301 320" fill="none">
    <path
      d="M301 9.4H263.4L150.5 122.35L37.6 9.4H0V47.05L112.9 160L0 272.95V310.6H37.6L150.5 197.65L263.4 310.6H301V272.95L188.1 160L301 47.05V9.4Z"
      fill="#E63329"
    />
  </svg>
)

export function ParticleOrbit({
  center = DEFAULT_CENTER,
  size = 180,
  replayOnClick = false,
  className = '',
}: ParticleOrbitProps) {
  const [replayKey, setReplayKey] = useState(0)

  return (
    <div
      className={`relative flex items-center justify-center ${
        replayOnClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={replayOnClick ? () => setReplayKey((k) => k + 1) : undefined}
      style={{ width: size, height: size }}
      key={replayKey}
    >
      <ParticleVertical popDelay={0.7} floatDelay={1.2} style={{ top: 0, left: 'calc(50% - 7px)' }} />
      <ParticleHorizontal popDelay={0.85} floatDelay={1.4} style={{ right: 0, top: 'calc(50% - 7px)' }} />
      <ParticleVertical popDelay={1.0} floatDelay={1.6} style={{ bottom: 0, left: 'calc(50% - 7px)' }} />
      <ParticleHorizontal popDelay={1.15} floatDelay={1.8} style={{ left: 0, top: 'calc(50% - 7px)' }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.6, ...SPRING }}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {center}
      </motion.div>
    </div>
  )
}
