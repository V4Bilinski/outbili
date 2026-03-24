import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getContacts, createContact, updateContact, deleteContact } from '../services/contactService'
import type { Contact } from '../types'
import { toast } from 'sonner'

export function useContacts(leadId?: string) {
  return useQuery({
    queryKey: ['contacts', leadId],
    queryFn: () => getContacts(leadId),
    enabled: !!leadId,
    staleTime: 30_000,
  })
}

export function useCreateContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Contact>) => createContact(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] })
      toast.success('Contato adicionado')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Contact> }) => updateContact(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteContact(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] })
      toast.success('Contato removido')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
