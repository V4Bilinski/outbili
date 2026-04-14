import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatCurrencyShort(value: number): string {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}k`
  return formatCurrency(value)
}

export function formatRelativeDate(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR })
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR })
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

export function calculateSpicedScore(s: number, p: number, i: number, c: number, d: number): number {
  const score = s * 0.25 + p * 0.25 + i * 0.20 + c * 0.15 + d * 0.15
  return Math.round(score * 10) / 10
}

export function getTemperatureFromScore(score: number): 'Quente' | 'Morno' | 'Frio' {
  if (score >= 3.7) return 'Quente'
  if (score >= 2.5) return 'Morno'
  return 'Frio'
}

export function temperatureLabel(temp: string): string {
  if (temp === 'Quente') return 'Quente'
  if (temp === 'Morno') return 'Morno'
  if (temp === 'Frio') return 'Frio'
  return temp
}

export function parseJsonField<T>(value: string | undefined | null, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

export function copyToClipboard(text: string): Promise<boolean> {
  return navigator.clipboard.writeText(text).then(
    () => true,
    () => false,
  )
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}
