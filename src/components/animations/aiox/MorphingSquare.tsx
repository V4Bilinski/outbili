import { motion } from 'framer-motion'

/**
 * Morphing Square — Adaptado de AIOX Brandbook
 * Quadrado morpha: square → rounded → circle e volta. Loop infinito.
 * Original: 3.5s ciclo, shape shift.
 */
type MorphingSquareProps = {
  size?: number
  className?: string
}

export function MorphingSquare({ size = 80, className = '' }: MorphingSquareProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size * 2, height: size * 2 }}
    >
      <motion.div
        initial={{ borderRadius: 0, rotate: 0 }}
        animate={{
          borderRadius: ['0%', '15%', '50%', '15%', '0%'],
          rotate: [0, 45, 90, 135, 180],
          scale: [1, 1.1, 1.2, 1.1, 1],
        }}
        transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.5 }}
        style={{ width: size, height: size, background: '#E63329' }}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0, 0.15, 0],
          borderRadius: ['0%', '15%', '50%', '15%', '0%'],
          scale: [1.2, 1.4, 1.6, 1.4, 1.2],
        }}
        transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.5 }}
        style={{
          position: 'absolute',
          width: size,
          height: size,
          background: '#E63329',
          filter: 'blur(20px)',
        }}
      />
    </div>
  )
}
