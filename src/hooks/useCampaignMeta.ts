import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listCampaignMetas, saveCampaignMeta } from '../services/campaignMetaService'
import type { CampaignMeta } from '../types'
import { toast } from 'sonner'

export function useCampaignMetas() {
  return useQuery({
    queryKey: ['campaign-metas'],
    queryFn: listCampaignMetas,
    staleTime: 30_000,
  })
}

export function useSaveCampaignMeta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (meta: Omit<CampaignMeta, 'id'>) => saveCampaignMeta(meta),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaign-metas'] })
    },
    onError: (err: Error) => toast.error(`Erro ao salvar metadados: ${err.message}`),
  })
}
