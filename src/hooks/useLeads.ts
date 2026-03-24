import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getLeads, getLead, createLead, updateLead, deleteLead, getHotLeads } from '../services/leadService'
import type { Lead } from '../types'
import { toast } from 'sonner'

export function useLeads(filter?: string) {
  return useQuery({
    queryKey: ['leads', filter],
    queryFn: () => getLeads(filter),
    staleTime: 30_000,
  })
}

export function useLead(id: string | undefined) {
  return useQuery({
    queryKey: ['lead', id],
    queryFn: () => getLead(id!),
    enabled: !!id,
    staleTime: 30_000,
  })
}

export function useHotLeads() {
  return useQuery({
    queryKey: ['leads', 'hot'],
    queryFn: getHotLeads,
    staleTime: 30_000,
  })
}

export function useCreateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Lead>) => createLead(data),
    onSuccess: (lead) => {
      qc.invalidateQueries({ queryKey: ['leads'] })
      toast.success(`${lead.companyName} importada com sucesso`)
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Lead> }) => updateLead(id, data),
    onSuccess: (lead) => {
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: ['lead', lead.id] })
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteLead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] })
      toast.success('Lead removida')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
