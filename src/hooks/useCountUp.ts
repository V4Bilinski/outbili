import { useEffect, useState } from 'react'

interface UseCountUpOptions {
  end: number
  duration?: number
  delay?: number
  enabled?: boolean
}

export function useCountUp({ end, duration = 1200, delay = 0, enabled = true }: UseCountUpOptions) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!enabled || end === 0) {
      if (enabled) setValue(end)
      return
    }

    const timeout = setTimeout(() => {
      let startTime: number | null = null
      let frameId: number

      function step(timestamp: number) {
        if (!startTime) startTime = timestamp
        const progress = Math.min((timestamp - startTime) / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
        setValue(Math.round(eased * end))
        if (progress < 1) {
          frameId = requestAnimationFrame(step)
        }
      }

      frameId = requestAnimationFrame(step)
      return () => cancelAnimationFrame(frameId)
    }, delay)

    return () => clearTimeout(timeout)
  }, [end, duration, delay, enabled])

  return value
}
