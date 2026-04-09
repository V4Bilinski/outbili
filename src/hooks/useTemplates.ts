import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listTemplates, syncTemplates, createTemplate, deleteTemplate, listDrafts, saveDraft, submitDraft } from '../services/templateService'
import type { CreateTemplatePayload } from '../services/templateService'
import { toast } from 'sonner'

export function useTemplatesList() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: listTemplates,
    staleTime: 60_000,
  })
}

export function useSyncTemplates() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: syncTemplates,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates'] })
      toast.success('Templates sincronizados com a Meta')
    },
    onError: (err: Error) => toast.error(`Erro ao sincronizar: ${err.message}`),
  })
}

export function useCreateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTemplatePayload) => createTemplate(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates'] })
      toast.success('Template enviado para aprovacao da Meta')
    },
    onError: (err: Error) => toast.error(`Erro ao criar template: ${err.message}`),
  })
}

export function useDeleteTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => deleteTemplate(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates'] })
      toast.success('Template excluido')
    },
    onError: (err: Error) => toast.error(`Erro ao excluir: ${err.message}`),
  })
}

export function useTemplateDrafts() {
  return useQuery({
    queryKey: ['template-drafts'],
    queryFn: listDrafts,
    staleTime: 30_000,
  })
}

export function useSaveDraft() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: saveDraft,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['template-drafts'] })
      toast.success('Rascunho salvo')
    },
  })
}

export function useSubmitDraft() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (draftId: string) => submitDraft(draftId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['template-drafts'] })
      qc.invalidateQueries({ queryKey: ['templates'] })
      toast.success('Rascunho enviado para aprovacao da Meta')
    },
    onError: (err: Error) => toast.error(`Erro ao submeter: ${err.message}`),
  })
}
