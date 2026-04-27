import { motion } from 'framer-motion'
import { useState } from 'react'

/**
 * Logo Dissolve — Adaptado de AIOX Brandbook
 * Letras flickeram individualmente (delays diferentes) até dissolverem.
 * Original: 3s, exit/fade. Recomendado para transições de saída.
 */
type LogoDissolveProps = {
  word?: string
  replayOnClick?: boolean
  className?: string
}

/**
 * Cada letra tem flickerDelay próprio para que dissolvam em ondas.
 * Para palavras com mais de 4 letras, gera delays uniformes.
 */
function buildLetterConfigs(word: string) {
  const base = [
    { flickerDelay: 1.2 },
    { flickerDelay: 1.0 },
    { flickerDelay: 1.4 },
    { flickerDelay: 0.8 },
    { flickerDelay: 1.6 },
    { flickerDelay: 1.1 },
    { flickerDelay: 1.5 },
  ]
  return word.split('').map((char, i) => ({
    char,
    flickerDelay: base[i % base.length].flickerDelay,
  }))
}

export function LogoDissolve({
  word = 'OUTBILI',
  replayOnClick = false,
  className = '',
}: LogoDissolveProps) {
  const [replayKey, setReplayKey] = useState(0)
  const letters = buildLetterConfigs(word)

  return (
    <div
      className={`relative flex items-center justify-center gap-1 ${
        replayOnClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={replayOnClick ? () => setReplayKey((k) => k + 1) : undefined}
      key={replayKey}
    >
      {letters.map((l, i) => (
        <motion.span
          key={`${i}-${l.char}`}
          initial={{ opacity: 1 }}
          animate={{
            opacity: [1, 1, 0.3, 0.8, 0.1, 0.6, 0.05, 0.4, 0.02, 0],
          }}
          transition={{
            delay: l.flickerDelay,
            duration: 2.5,
            ease: 'linear',
            times: [0, 0.3, 0.35, 0.45, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
          }}
          className="font-heading text-text-primary"
          style={{
            fontSize: 'clamp(2.5rem, 6vw, 3.5rem)',
            fontWeight: 800,
            display: 'inline-block',
            letterSpacing: '-0.02em',
          }}
        >
          {l.char}
        </motion.span>
      ))}
    </div>
  )
}
