export const SEGMENTS = [
  { name: 'Estética', slug: 'estetica', dayOfWeek: 'segunda', color: '#E91E63', subSegments: ['Clínicas estéticas', 'Centros de beleza', 'Spas', 'Harmonização facial'] },
  { name: 'Odontologia', slug: 'odontologia', dayOfWeek: 'terca', color: '#00BCD4', subSegments: ['Clínicas odontológicas', 'Ortodontia', 'Implantes', 'Odontopediatria'] },
  { name: 'Varejo', slug: 'varejo', dayOfWeek: 'quarta', color: '#FF9800', subSegments: ['Vestuário', 'Peças automotivas', 'Pet shops', 'Acessórios'] },
  { name: 'Farmácia', slug: 'farmacia', dayOfWeek: 'quinta', color: '#4CAF50', subSegments: ['Manipulação', 'Redes regionais', 'Drogarias independentes'] },
  { name: 'Movelaria + Mix', slug: 'movelaria-mix', dayOfWeek: 'sexta', color: '#9C27B0', subSegments: ['Móveis planejados', 'Decoração', 'Colchões', 'Mix estratégico'] },
] as const

export const TIERS = [
  { name: 'Micro+', range: 'R$ 70k-100k', wtp: '12-15%', min: 70000, max: 100000 },
  { name: 'Small', range: 'R$ 100k-200k', wtp: '12-15%', min: 100000, max: 200000 },
  { name: 'Medium-', range: 'R$ 200k-830k', wtp: '10-12%', min: 200000, max: 830000 },
  { name: 'Medium=', range: 'R$ 830k-2M', wtp: '8-10%', min: 830000, max: 2000000 },
] as const

export const LEAD_STATUSES = [
  { value: 'Novo', label: 'Novo', color: '#8E8E93' },
  { value: 'Qualificado', label: 'Qualificado', color: '#FF6B1A' },
  { value: 'Contactado', label: 'Contactado', color: '#F59E0B' },
  { value: 'Respondeu', label: 'Respondeu', color: '#22C55E' },
  { value: 'Reunião', label: 'Reunião', color: '#CC0000' },
  { value: 'Proposta', label: 'Proposta', color: '#FF2020' },
  { value: 'Fechado', label: 'Fechado', color: '#22C55E' },
  { value: 'Perdido', label: 'Perdido', color: '#FF453A' },
] as const

export const TEMPERATURES = [
  { value: 'Quente', label: 'Quente', color: '#FF2020', emoji: '🔴' },
  { value: 'Morno', label: 'Morno', color: '#F59E0B', emoji: '🟡' },
  { value: 'Frio', label: 'Frio', color: '#8E8E93', emoji: '⚪' },
] as const

export const SPICED_WEIGHTS = {
  S: { name: 'Situação', weight: 0.25 },
  P: { name: 'Dor (Pain)', weight: 0.25 },
  I: { name: 'Impacto', weight: 0.20 },
  C: { name: 'Evento Crítico', weight: 0.15 },
  D: { name: 'Decisão', weight: 0.15 },
} as const

export const TRAPS = [
  'T1 - Aquisição de clientes',
  'T2 - Conversão de vendas',
  'T3 - Ticket médio',
  'T4 - Recorrência',
  'T5 - Margem operacional',
  'T6 - Posicionamento de marca',
  'T7 - Escalabilidade',
  'T8 - Dependência de canal',
] as const

export const CADENCE_DEFAULT_DAYS = [0, 3, 7, 10, 14] as const

export function getDaySegment(): string {
  const day = new Date().getDay()
  const map: Record<number, string> = {
    1: 'Estética',
    2: 'Odontologia',
    3: 'Varejo',
    4: 'Farmácia',
    5: 'Movelaria + Mix',
  }
  return map[day] || 'Livre'
}
