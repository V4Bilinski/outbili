import { useState, useEffect } from 'react'

// Numero de colunas do grid de cards conforme breakpoint Tailwind.
// Espelha `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` para a virtualizacao agrupar leads por linha.
function readColumns(): number {
  if (typeof window === 'undefined') return 1
  if (window.matchMedia('(min-width: 1024px)').matches) return 3
  if (window.matchMedia('(min-width: 640px)').matches) return 2
  return 1
}

export function useColumns(): number {
  const [cols, setCols] = useState(readColumns)
  useEffect(() => {
    const queries = [
      window.matchMedia('(min-width: 1024px)'),
      window.matchMedia('(min-width: 640px)'),
    ]
    const update = () => setCols(readColumns())
    queries.forEach((q) => q.addEventListener('change', update))
    return () => queries.forEach((q) => q.removeEventListener('change', update))
  }, [])
  return cols
}
