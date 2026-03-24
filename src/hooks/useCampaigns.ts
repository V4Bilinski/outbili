import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCampaigns, getCampaign, createCampaign, updateCampaign } from '../services/campaignService'
import type { Campaign } from '../types'
import { toast } from 'sonner'

export function useCampaigns() {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: getCampaigns,
    staleTime: 30_000,
  })
}

export function useCampaign(id: string | undefined) {
  return useQuery({
    queryKey: ['campaign', id],
    queryFn: () => getCampaign(id!),
    enabled: !!id,
    staleTime: 30_000,
  })
}

export function useCreateCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Campaign>) => createCampaign(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success('Cadência criada')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Campaign> }) => updateCampaign(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
