// ============================================================
// NODE 16: Extract Lead ID
// ============================================================
// FUNÇÃO: Extrair o ID do lead criado no Airtable
//         e preparar dados para salvar contato
//
// INPUT: Resposta do Node 15 (Airtable POST response + contact data)
// ============================================================

const resp = $input.first().json;

// O leadId já vem extraído do Node 15
const leadId = resp.leadId || (resp.records || [])[0]?.id || '';

return [{json: {
  leadId: leadId,
  name: resp._ownerName || resp.companyName || '',
  whatsapp: resp._whatsapp || '',
  email: resp._email || '',
  hasContact: !!(leadId && (resp._whatsapp || resp._email))
}}];
