// Mapeamento Segmento OUTBILI → Códigos CNAE para busca na Casa dos Dados API
// Cada segmento pode ter múltiplos CNAEs para ampliar a cobertura de resultados

export const SEGMENT_CNAE_MAP: Record<string, string[]> = {
  estetica: [
    '9602-5/01', // Cabeleireiros, manicure e pedicure
    '9602-5/02', // Atividades de estética e outros serviços de cuidados com a beleza
    '8690-9/01', // Atividades de práticas integrativas e complementares em saúde humana
  ],
  odontologia: [
    '8630-5/04', // Atividade odontológica
  ],
  varejo: [
    '4711-3/02', // Comércio varejista de mercadorias em geral, com predominância de produtos alimentícios - supermercados
    '4712-1/00', // Comércio varejista de mercadorias em geral, com predominância de produtos alimentícios - minimercados
    '4789-0/99', // Comércio varejista de outros produtos não especificados anteriormente
  ],
  farmacia: [
    '4771-7/01', // Comércio varejista de produtos farmacêuticos, sem manipulação de fórmulas
    '4771-7/02', // Comércio varejista de produtos farmacêuticos, com manipulação de fórmulas
  ],
  movelaria: [
    '3101-2/00', // Fabricação de móveis com predominância de madeira
    '4754-7/01', // Comércio varejista de móveis
  ],
  servicos: [
    '6920-6/01', // Atividades de contabilidade
    '6911-7/01', // Serviços advocatícios
    '7020-4/00', // Atividades de consultoria em gestão empresarial
    '7311-4/00', // Agências de publicidade
  ],
  alimentacao: [
    '5611-2/01', // Restaurantes e similares
    '5611-2/03', // Lanchonetes, casas de cha, de sucos e similares
    '1091-1/02', // Fabricação de produtos de padaria e confeitaria
  ],
  saude: [
    '8630-5/01', // Atividade médica ambulatorial com recursos para realização de procedimentos cirúrgicos
    '8630-5/02', // Atividade médica ambulatorial com recursos para realização de exames complementares
    '8630-5/03', // Atividade médica ambulatorial restrita a consultas
    '8650-0/04', // Atividades de fisioterapia
    '8650-0/02', // Atividades de profissionais da nutrição
  ],
  educacao: [
    '8512-1/00', // Educação infantil - pré-escola
    '8531-7/00', // Educação superior - graduação
    '8599-6/04', // Ensino de idiomas
    '8599-6/05', // Cursos preparatórios para concursos
  ],
  tecnologia: [
    '6201-5/01', // Desenvolvimento de programas de computador sob encomenda
    '6202-3/00', // Desenvolvimento e licenciamento de programas de computador customizáveis
    '6203-1/00', // Desenvolvimento e licenciamento de programas de computador não-customizáveis
    '6204-0/00', // Consultoria em tecnologia da informação
  ],
  automotivo: [
    '4520-0/01', // Serviços de manutenção e reparação mecânica de veículos automotores
    '4520-0/04', // Serviços de alinhamento e balanceamento de veículos automotores
    '4530-7/03', // Comércio a varejo de peças e acessórios novos para veículos automotores
  ],
  petshop: [
    '4789-0/04', // Comércio varejista de animais vivos e de artigos e alimentos para animais de estimação
    '7500-1/00', // Atividades veterinárias
  ],
  fitness: [
    '9313-1/00', // Atividades de condicionamento físico
    '9319-1/01', // Produção e promoção de eventos esportivos
  ],
  beleza: [
    '9602-5/01', // Cabeleireiros, manicure e pedicure
    '9602-5/02', // Atividades de estética e outros serviços de cuidados com a beleza
  ],
  imobiliario: [
    '6821-8/01', // Corretagem na compra e venda e avaliação de imóveis
    '6821-8/02', // Corretagem no aluguel de imóveis
    '4110-7/00', // Incorporação de empreendimentos imobiliários
  ],
  construcao: [
    '4120-4/00', // Construção de edifícios
    '4399-1/03', // Obras de alvenaria
    '4330-4/01', // Impermeabilização em obras de engenharia civil
  ],
  moda: [
    '4781-4/00', // Comércio varejista de artigos do vestuário e acessórios
    '4782-2/01', // Comércio varejista de calçados
  ],
  decoracao: [
    '4754-7/01', // Comércio varejista de móveis
    '4759-8/01', // Comércio varejista de artigos de tapeçaria, cortinas e persianas
  ],
  agronegocio: [
    '0111-3/01', // Cultivo de arroz
    '4683-4/00', // Comércio atacadista de defensivos agrícolas, adubos, fertilizantes e corretivos do solo
    '0161-0/01', // Serviço de pulverização e controle de pragas agrícolas
  ],
  logistica: [
    '4930-2/02', // Transporte rodoviário de carga
    '5250-8/01', // Atividades de terminais rodoviários e ferroviários
    '5320-2/02', // Serviços de entrega rápida
  ],
}

export function getSegmentCnaeCodes(segmentSlug: string): string[] {
  return SEGMENT_CNAE_MAP[segmentSlug] || []
}

export function getCnaeCodesForSegments(segmentSlugs: string[]): string[] {
  const codes = new Set<string>()
  for (const slug of segmentSlugs) {
    const segmentCodes = SEGMENT_CNAE_MAP[slug]
    if (segmentCodes) segmentCodes.forEach(c => codes.add(c))
  }
  return Array.from(codes)
}

/** Converte '9602-5/01' para 9602501 (formato numerico CNPJa) */
export function formatCnaeForCnpja(code: string): number {
  return parseInt(code.replace(/[-\/]/g, ''), 10)
}

/** Retorna CNAEs no formato numerico para a API CNPJa */
export function getCnaeCodesForCnpja(segmentSlugs: string[]): number[] {
  return getCnaeCodesForSegments(segmentSlugs).map(formatCnaeForCnpja)
}
