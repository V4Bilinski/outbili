// Mapeamento Segmento OUTBILI → Codigos CNAE para busca na Casa dos Dados API
// Cada segmento pode ter multiplos CNAEs para ampliar a cobertura de resultados

export const SEGMENT_CNAE_MAP: Record<string, string[]> = {
  estetica: [
    '9602-5/01', // Cabeleireiros, manicure e pedicure
    '9602-5/02', // Atividades de estetica e outros servicos de cuidados com a beleza
    '8690-9/01', // Atividades de praticas integrativas e complementares em saude humana
  ],
  odontologia: [
    '8630-5/04', // Atividade odontologica
  ],
  varejo: [
    '4711-3/02', // Comercio varejista de mercadorias em geral, com predominancia de produtos alimenticios - supermercados
    '4712-1/00', // Comercio varejista de mercadorias em geral, com predominancia de produtos alimenticios - minimercados
    '4789-0/99', // Comercio varejista de outros produtos nao especificados anteriormente
  ],
  farmacia: [
    '4771-7/01', // Comercio varejista de produtos farmaceuticos, sem manipulacao de formulas
    '4771-7/02', // Comercio varejista de produtos farmaceuticos, com manipulacao de formulas
  ],
  movelaria: [
    '3101-2/00', // Fabricacao de moveis com predominancia de madeira
    '4754-7/01', // Comercio varejista de moveis
  ],
  servicos: [
    '6920-6/01', // Atividades de contabilidade
    '6911-7/01', // Servicos advocaticios
    '7020-4/00', // Atividades de consultoria em gestao empresarial
    '7311-4/00', // Agencias de publicidade
  ],
  alimentacao: [
    '5611-2/01', // Restaurantes e similares
    '5611-2/03', // Lanchonetes, casas de cha, de sucos e similares
    '1091-1/02', // Fabricacao de produtos de padaria e confeitaria
  ],
  saude: [
    '8630-5/01', // Atividade medica ambulatorial com recursos para realizacao de procedimentos cirurgicos
    '8630-5/02', // Atividade medica ambulatorial com recursos para realizacao de exames complementares
    '8630-5/03', // Atividade medica ambulatorial restrita a consultas
    '8650-0/04', // Atividades de fisioterapia
    '8650-0/02', // Atividades de profissionais da nutricao
  ],
  educacao: [
    '8512-1/00', // Educacao infantil - pre-escola
    '8531-7/00', // Educacao superior - graduacao
    '8599-6/04', // Ensino de idiomas
    '8599-6/05', // Cursos preparatorios para concursos
  ],
  tecnologia: [
    '6201-5/01', // Desenvolvimento de programas de computador sob encomenda
    '6202-3/00', // Desenvolvimento e licenciamento de programas de computador customizaveis
    '6203-1/00', // Desenvolvimento e licenciamento de programas de computador nao-customizaveis
    '6204-0/00', // Consultoria em tecnologia da informação
  ],
  automotivo: [
    '4520-0/01', // Servicos de manutencao e reparacao mecanica de veiculos automotores
    '4520-0/04', // Servicos de alinhamento e balanceamento de veiculos automotores
    '4530-7/03', // Comercio a varejo de pecas e acessorios novos para veiculos automotores
  ],
  petshop: [
    '4789-0/04', // Comercio varejista de animais vivos e de artigos e alimentos para animais de estimacao
    '7500-1/00', // Atividades veterinarias
  ],
  fitness: [
    '9313-1/00', // Atividades de condicionamento fisico
    '9319-1/01', // Producao e promocao de eventos esportivos
  ],
  beleza: [
    '9602-5/01', // Cabeleireiros, manicure e pedicure
    '9602-5/02', // Atividades de estetica e outros servicos de cuidados com a beleza
  ],
  imobiliario: [
    '6821-8/01', // Corretagem na compra e venda e avaliacao de imoveis
    '6821-8/02', // Corretagem no aluguel de imoveis
    '4110-7/00', // Incorporacao de empreendimentos imobiliarios
  ],
  construcao: [
    '4120-4/00', // Construcao de edificios
    '4399-1/03', // Obras de alvenaria
    '4330-4/01', // Impermeabilizacao em obras de engenharia civil
  ],
  moda: [
    '4781-4/00', // Comercio varejista de artigos do vestuario e acessorios
    '4782-2/01', // Comercio varejista de calcados
  ],
  decoracao: [
    '4754-7/01', // Comercio varejista de moveis
    '4759-8/01', // Comercio varejista de artigos de tapecaria, cortinas e persianas
  ],
  agronegocio: [
    '0111-3/01', // Cultivo de arroz
    '4683-4/00', // Comercio atacadista de defensivos agricolas, adubos, fertilizantes e corretivos do solo
    '0161-0/01', // Servico de pulverizacao e controle de pragas agricolas
  ],
  logistica: [
    '4930-2/02', // Transporte rodoviario de carga
    '5250-8/01', // Atividades de terminais rodoviarios e ferroviarios
    '5320-2/02', // Servicos de entrega rapida
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
