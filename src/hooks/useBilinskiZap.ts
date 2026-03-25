import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listCampaigns, getCampaign, createCampaign, dispatchCampaign,
  pauseCampaign, resumeCampaign, cancelCampaign, getCampaignMessages,
  listTemplates, importContacts, getContactStats, checkHealth,
} from '../lib/bilinskizap'
import { toast } from 'sonner'

export function useZapCampaigns(status?: string) {
  return useQuery({
    queryKey: ['zap-campaigns', status],
    queryFn: () => listCampaigns({ limit: 50, status }),
    staleTime: 15_000,
    refetchInterval: 30_000, // Poll every 30s for active campaigns
  })
}

export function useZapCampaign(id: string | undefined) {
  return useQuery({
    queryKey: ['zap-campaign', id],
    queryFn: () => getCampaign(id!),
    enabled: !!id,
    staleTime: 10_000,
    refetchInterval: 15_000,
  })
}

export function useZapCampaignMessages(id: string | undefined) {
  return useQuery({
    queryKey: ['zap-campaign-messages', id],
    queryFn: () => getCampaignMessages(id!, { limit: 100 }),
    enabled: !!id,
    staleTime: 10_000,
    refetchInterval: 15_000,
  })
}

export function useZapTemplates() {
  return useQuery({
    queryKey: ['zap-templates'],
    queryFn: listTemplates,
    staleTime: 60_000,
  })
}

export function useZapContactStats() {
  return useQuery({
    queryKey: ['zap-contact-stats'],
    queryFn: getContactStats,
    staleTime: 30_000,
  })
}

export function useZapHealth() {
  return useQuery({
    queryKey: ['zap-health'],
    queryFn: checkHealth,
    staleTime: 60_000,
  })
}

export function useCreateZapCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createCampaign,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['zap-campaigns'] })
      toast.success('Campanha criada no BilinskiZap')
    },
    onError: (err: Error) => toast.error(`Erro ao criar campanha: ${err.message}`),
  })
}

export function useDispatchZapCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ campaignId, templateName }: { campaignId: string; templateName: string }) =>
      dispatchCampaign(campaignId, templateName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['zap-campaigns'] })
      toast.success('Campanha disparada!')
    },
    onError: (err: Error) => toast.error(`Erro ao disparar: ${err.message}`),
  })
}

export function usePauseZapCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => pauseCampaign(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['zap-campaigns'] })
      toast.success('Campanha pausada')
    },
  })
}

export function useResumeZapCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => resumeCampaign(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['zap-campaigns'] })
      toast.success('Campanha retomada')
    },
  })
}

export function useCancelZapCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => cancelCampaign(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['zap-campaigns'] })
      toast.success('Campanha cancelada')
    },
  })
}

export function useImportZapContacts() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: importContacts,
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['zap-contact-stats'] })
      toast.success(`${result.inserted} contatos importados, ${result.updated} atualizados`)
    },
    onError: (err: Error) => toast.error(`Erro ao importar: ${err.message}`),
  })
}
