import { useState } from 'react'
import { useContacts, useCreateContact, useDeleteContact } from '../../hooks/useContacts'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import type { Lead, Contact } from '../../types'
import { Phone, Mail, Plus, Trash2, UserPlus, User, Handshake, Megaphone, AlertTriangle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { WhatsAppIcon } from '../ui/WhatsAppIcon'
import { cn } from '../../lib/cn'

function ContactCard({ contact, onDelete, index }: { contact: Contact; onDelete: () => void; index: number }) {
  const typeLabel: Record<string, string> = { decisor: 'Decisor', stakeholder: 'Stakeholder', influenciador: 'Influenciador' }
  const typeVariant: Record<string, 'error' | 'warning' | 'info'> = { decisor: 'error', stakeholder: 'warning', influenciador: 'info' }
  const typeIcon: Record<string, LucideIcon> = { decisor: User, stakeholder: Handshake, influenciador: Megaphone }
  const TypeIcon = typeIcon[contact.contactType] || User

  const whatsappLink = contact.whatsapp
    ? `https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`
    : null

  return (
    <div
      className="group rounded-xl bg-elevated-1 border border-border hover:border-border-strong transition-all duration-300 overflow-hidden animate-[fade-in_0.4s_ease-out_both]"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Contact header */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
          contact.contactType === 'decisor' ? 'bg-red/10 text-red' : contact.contactType === 'stakeholder' ? 'bg-warning/10 text-warning' : 'bg-info/10 text-info',
        )}>
          <TypeIcon className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-text-primary truncate">{contact.name}</span>
            <Badge variant={typeVariant[contact.contactType] || 'info'} size="sm">
              {typeLabel[contact.contactType] || contact.contactType}
            </Badge>
          </div>
          {contact.role && <p className="text-xs text-text-muted mt-0.5">{contact.role}</p>}
        </div>
        <button
          onClick={onDelete}
          className="p-2 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-colors cursor-pointer opacity-0 group-hover:opacity-100 md:opacity-0 max-md:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 px-4 pb-4">
        {contact.whatsapp && (
          <a
            href={whatsappLink!}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-whatsapp/10 text-whatsapp text-xs font-medium hover:bg-whatsapp/20 transition-colors min-h-[36px]"
          >
            <WhatsAppIcon className="text-sm" />
            {contact.whatsapp}
          </a>
        )}
        {contact.email && (
          <a
            href={`mailto:${contact.email}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-elevated-2 text-text-secondary text-xs font-medium hover:bg-elevated-hover transition-colors min-h-[36px]"
          >
            <Mail className="h-3.5 w-3.5" />
            {contact.email}
          </a>
        )}
        {!contact.whatsapp && !contact.email && (
          <p className="text-xs text-text-muted italic">Sem canais de contato cadastrados</p>
        )}
      </div>
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

  const inputClass = 'h-10 w-full rounded-xl bg-elevated-1 border border-border text-sm text-text-primary px-3 placeholder:text-text-muted focus:border-red/30 focus:outline-none focus:ring-1 focus:ring-red/20 transition-colors'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !whatsapp) return
    create.mutate({ leadId, name, role, contactType, whatsapp, email }, {
      onSuccess: () => onClose(),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-elevated-1 border border-red/20 space-y-3">
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

  const contactCount = contacts?.length || 0
  const hasDecisor = contacts?.some((c) => c.contactType === 'decisor')

  return (
    <div className="space-y-5">
      {/* Header with count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-whatsapp/10 flex items-center justify-center">
            <Phone className="h-4 w-4 text-whatsapp" />
          </div>
          <div>
            <h3 className="text-sm font-semibold font-heading">Contatos</h3>
            <p className="text-label text-text-muted">
              {contactCount === 0 ? 'Nenhum cadastrado' : `${contactCount} contato${contactCount > 1 ? 's' : ''}`}
              {contactCount > 0 && !hasDecisor && ' · sem decisor'}
            </p>
          </div>
        </div>
        <Button size="sm" variant="secondary" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setShowForm(true)}>
          Adicionar
        </Button>
      </div>

      {/* Alert: no decisor */}
      {contactCount > 0 && !hasDecisor && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-warning/6 border border-warning/15 text-xs text-warning">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Nenhum contato marcado como <strong>decisor</strong>. Identifique quem aprova a compra.</span>
        </div>
      )}

      {showForm && <AddContactForm leadId={lead.id} onClose={() => setShowForm(false)} />}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-24 rounded-xl skeleton-shimmer" />)}
        </div>
      ) : !contacts || contacts.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="Nenhum contato"
          description="Adicione o decisor principal com WhatsApp para iniciar a cadência."
          action={{ label: 'Adicionar contato', onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="space-y-3">
          {contacts.map((contact, i) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              index={i}
              onDelete={() => deleteContact.mutate(contact.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
