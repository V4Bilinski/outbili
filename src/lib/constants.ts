export const SEGMENTS = [
  { name: 'Estética', slug: 'estetica', dayOfWeek: 'segunda', color: '#E91E63', subSegments: ['Clínicas estéticas', 'Centros de beleza', 'Spas', 'Harmonização facial'] },
  { name: 'Odontologia', slug: 'odontologia', dayOfWeek: 'terca', color: '#00BCD4', subSegments: ['Clínicas odontológicas', 'Ortodontia', 'Implantes', 'Odontopediatria'] },
  { name: 'Varejo', slug: 'varejo', dayOfWeek: 'quarta', color: '#FF9800', subSegments: ['Vestuário', 'Peças automotivas', 'Pet shops', 'Acessórios'] },
  { name: 'Farmácia', slug: 'farmacia', dayOfWeek: 'quinta', color: '#4CAF50', subSegments: ['Manipulação', 'Redes regionais', 'Drogarias independentes'] },
  { name: 'Movelaria', slug: 'movelaria', dayOfWeek: 'sexta', color: '#9C27B0', subSegments: ['Móveis planejados', 'Decoração', 'Colchões', 'Mix estratégico'] },
  { name: 'Serviços', slug: 'servicos', dayOfWeek: '', color: '#607D8B', subSegments: ['Contabilidade', 'Advocacia', 'Consultoria', 'Agências'] },
  { name: 'Alimentação', slug: 'alimentacao', dayOfWeek: '', color: '#FF5722', subSegments: ['Restaurantes', 'Padarias', 'Delivery', 'Food service'] },
  { name: 'Saúde', slug: 'saude', dayOfWeek: '', color: '#4CAF50', subSegments: ['Clínicas médicas', 'Laboratórios', 'Fisioterapia', 'Psicologia'] },
  { name: 'Educação', slug: 'educacao', dayOfWeek: '', color: '#2196F3', subSegments: ['Escolas', 'Cursos', 'Ensino técnico', 'Idiomas'] },
  { name: 'Tecnologia', slug: 'tecnologia', dayOfWeek: '', color: '#673AB7', subSegments: ['Software houses', 'TI', 'SaaS', 'Startups'] },
  { name: 'Automotivo', slug: 'automotivo', dayOfWeek: '', color: '#795548', subSegments: ['Oficinas', 'Concessionárias', 'Autopeças', 'Funilaria'] },
  { name: 'Pet Shop', slug: 'petshop', dayOfWeek: '', color: '#8BC34A', subSegments: ['Pet shops', 'Veterinárias', 'Banho e tosa', 'Pet food'] },
  { name: 'Fitness', slug: 'fitness', dayOfWeek: '', color: '#F44336', subSegments: ['Academias', 'Studios', 'CrossFit', 'Personal trainers'] },
  { name: 'Beleza', slug: 'beleza', dayOfWeek: '', color: '#E91E63', subSegments: ['Salões', 'Barbearias', 'Nail design', 'Maquiagem'] },
  { name: 'Imobiliário', slug: 'imobiliario', dayOfWeek: '', color: '#009688', subSegments: ['Imobiliárias', 'Construtoras', 'Corretores', 'Incorporadoras'] },
  { name: 'Construção', slug: 'construcao', dayOfWeek: '', color: '#FF9800', subSegments: ['Materiais', 'Empreiteiras', 'Reformas', 'Engenharia'] },
  { name: 'Moda', slug: 'moda', dayOfWeek: '', color: '#E040FB', subSegments: ['Roupas', 'Calçados', 'Acessórios', 'Moda íntima'] },
  { name: 'Decoração', slug: 'decoracao', dayOfWeek: '', color: '#FFAB40', subSegments: ['Design de interiores', 'Iluminação', 'Cortinas', 'Artigos para casa'] },
  { name: 'Agronegócio', slug: 'agronegocio', dayOfWeek: '', color: '#66BB6A', subSegments: ['Insumos', 'Máquinas agrícolas', 'Cooperativas', 'Agritech'] },
  { name: 'Logística', slug: 'logistica', dayOfWeek: '', color: '#42A5F5', subSegments: ['Transportadoras', 'Entregas', 'Armazéns', 'Last mile'] },
] as const

export const TIERS = [
  { name: 'Micro+', range: 'R$ 70k-100k', ltp: '12-15%', min: 70000, max: 100000 },
  { name: 'Small', range: 'R$ 100k-200k', ltp: '12-15%', min: 100000, max: 200000 },
  { name: 'Medium-', range: 'R$ 200k-830k', ltp: '10-12%', min: 200000, max: 830000 },
  { name: 'Medium=', range: 'R$ 830k-2M', ltp: '8-10%', min: 830000, max: 2000000 },
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
    5: 'Movelaria',
  }
  return map[day] || 'Livre'
}
