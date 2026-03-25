import { useState } from 'react'
import { useContacts, useCreateContact, useDeleteContact } from '../../hooks/useContacts'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import type { Lead, Contact } from '../../types'
import { Phone, Mail, Plus, Trash2, UserPlus, MessageCircle } from 'lucide-react'
import { cn } from '../../lib/cn'

function ContactCard({ contact, onDelete }: { contact: Contact; onDelete: () => void }) {
  const typeLabel: Record<string, string> = { decisor: 'Decisor', stakeholder: 'Stakeholder', influenciador: 'Influenciador' }
  const typeVariant: Record<string, 'error' | 'warning' | 'info'> = { decisor: 'error', stakeholder: 'warning', influenciador: 'info' }

  const whatsappLink = contact.whatsapp
    ? `https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`
    : null

  return (
    <div className="p-4 rounded-xl bg-white/[0.02] border border-border flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-text-primary">{contact.name}</span>
          <Badge variant={typeVariant[contact.contactType] || 'info'} size="sm">
            {typeLabel[contact.contactType] || contact.contactType}
          </Badge>
        </div>
        {contact.role && <p className="text-xs text-text-muted mb-2">{contact.role}</p>}
        <div className="flex flex-wrap gap-2">
          {contact.whatsapp && (
            <a
              href={whatsappLink!}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-whatsapp/15 text-whatsapp text-xs font-medium hover:bg-whatsapp/25 transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              {contact.whatsapp}
            </a>
          )}
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] text-text-secondary text-xs font-medium hover:bg-white/[0.08] transition-colors"
            >
              <Mail className="h-3.5 w-3.5" />
              {contact.email}
            </a>
          )}
        </div>
      </div>
      <button
        onClick={onDelete}
        className="p-2 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-colors cursor-pointer"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function AddContactForm({ leadId, onClose }: { leadId: string; onClose: () => void }) {
  const create = useCreateContact()
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [contactType, setContactType] = useState<'decisor' | 'stakeholder' | 'influenciador'>('decisor')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')

  const inputClass = 'h-10 w-full rounded-xl bg-white/[0.03] border border-border text-sm text-text-primary px-3 placeholder:text-text-muted focus:border-red/30 focus:outline-none focus:ring-1 focus:ring-red/20 transition-colors'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !whatsapp) return
    create.mutate({ leadId, name, role, contactType, whatsapp, email }, {
      onSuccess: () => onClose(),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-white/[0.02] border border-red/20 space-y-3">
      <p className="text-xs font-semibold text-red uppercase tracking-wider">Novo contato</p>
      <div className="grid md:grid-cols-2 gap-3">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo *" className={inputClass} required />
        <input type="text" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Cargo (CEO, CMO...)" className={inputClass} />
        <select value={contactType} onChange={(e) => setContactType(e.target.value as any)} className={cn(inputClass, 'cursor-pointer')}>
          <option value="decisor">Decisor</option>
          <option value="stakeholder">Stakeholder</option>
          <option value="influenciador">Influenciador</option>
        </select>
        <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp * (ex: 11999998888)" className={inputClass} required />
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail (opcional)" className={inputClass} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={create.isPending} icon={<UserPlus className="h-3.5 w-3.5" />}>
          Adicionar
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
      </div>
    </form>
  )
}

export function TabContatos({ lead }: { lead: Lead }) {
  const { data: contacts, isLoading } = useContacts(lead.id)
  const deleteContact = useDeleteContact()
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-whatsapp" />
          <h3 className="text-sm font-semibold font-heading">Contatos & Histórico</h3>
        </div>
        <Button size="sm" variant="secondary" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setShowForm(true)}>
          Adicionar
        </Button>
      </div>

      {showForm && <AddContactForm leadId={lead.id} onClose={() => setShowForm(false)} />}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-20 rounded-xl skeleton-shimmer" />)}
        </div>
      ) : !contacts || contacts.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="Nenhum contato"
          description="Adicione o decisor principal com WhatsApp para iniciar a cadência."
          action={{ label: 'Adicionar contato', onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="space-y-2">
          {contacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onDelete={() => deleteContact.mutate(contact.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
