import { useQuery } from '@tanstack/react-query'
import { checkIntegrations } from '../services/integrationHealthService'

// Saude das integracoes externas. checkIntegrations nunca lanca, entao o
// resultado fica sempre disponivel apos a primeira carga.
// A sonda da Assertiva (lookup-cnpj) consome 1 consulta: por isso cache longo
// de 30 min e sem refetch automatico por intervalo. Revalida ao montar quando
// estiver stale; o painel do Admin permite checagem sob demanda.
export function useIntegrationHealth() {
  return useQuery({
    queryKey: ['integration-health'],
    queryFn: checkIntegrations,
    staleTime: 30 * 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    retry: false,
  })
}
