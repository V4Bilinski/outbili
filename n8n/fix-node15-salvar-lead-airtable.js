// ============================================================
// NODE 15: Salvar Lead Airtable (v2 — linked records)
// ============================================================
// FUNCAO: Criar lead no Airtable (POST, nao PATCH)
//         + Criar Contact vinculado via linked record
//         + Criar Partners vinculados via linked record
//
// INPUT:  Lead mapeado do CNPJa (via cnpja-fallback-search.js)
//
// OUTPUT: Resposta do Airtable com records[0].id
//
// NOTA: NUNCA usar $env em Code nodes do N8N — hardcode credentials
// ============================================================

const lead = $input.first().json;

// 1. Separar campos do Lead (Airtable) dos campos de Contact/Partners (prefixo _)
const airtableFields = {};
const contactData = {};
const partnersData = lead._partners || [];

for (const [key, value] of Object.entries(lead)) {
  if (key.startsWith('_')) {
    contactData[key] = value;
  } else if (value !== undefined && value !== null && value !== '') {
    airtableFields[key] = value;
  }
}

// 2. CRIAR lead no Airtable (POST = create, não PATCH = update)
// NOTA: $env não funciona em Code nodes do N8N — usar valores diretos
const BASE_ID = 'appKh4qQ5JN94dQHv';
// IMPORTANTE: Substituir pelo PAT real no n8n (nao commitar no git)
const PAT = process.env.AIRTABLE_PAT || 'CONFIGURE_NO_N8N';

const response = await this.helpers.httpRequest({
  method: 'POST',
  url: `https://api.airtable.com/v0/${BASE_ID}/Leads`,
  headers: {
    'Authorization': `Bearer ${PAT}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    records: [{
      fields: airtableFields,
    }],
  }),
});

// 3. Extrair o ID do registro criado
const createdId = (response.records || [])[0]?.id || '';

// 4. Criar Contact vinculado via linked record (se tiver nome + telefone)
let contactId = '';
if (createdId && (contactData._ownerName || contactData._whatsapp)) {
  try {
    const contactResponse = await this.helpers.httpRequest({
      method: 'POST',
      url: `https://api.airtable.com/v0/${BASE_ID}/Contacts`,
      headers: {
        'Authorization': `Bearer ${PAT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        records: [{
          fields: {
            name: contactData._ownerName || 'Decisor',
            role: contactData._ownerRole || 'Administrador',
            contactType: 'decisor',
            whatsapp: contactData._whatsapp || '',
            email: contactData._email || '',
            source: 'cnpja',
            Lead: [createdId], // linked record
          },
        }],
      }),
    });
    contactId = (contactResponse.records || [])[0]?.id || '';
  } catch (e) { /* silencioso */ }
}

// 5. Criar Partners vinculados (se existirem)
if (createdId && partnersData.length > 0) {
  try {
    // Batch de 10
    for (let i = 0; i < partnersData.length; i += 10) {
      const batch = partnersData.slice(i, i + 10);
      await this.helpers.httpRequest({
        method: 'POST',
        url: `https://api.airtable.com/v0/${BASE_ID}/Partners`,
        headers: {
          'Authorization': `Bearer ${PAT}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          records: batch.map(p => ({
            fields: {
              name: p.name,
              qualification: p.qualification,
              personType: p.personType || 'NATURAL',
              cpf: p.cpf || '',
              Lead: [createdId], // linked record
            },
          })),
        }),
      });
    }
  } catch (e) { /* silencioso */ }
}

return [{
  json: {
    ...response,
    leadId: createdId,
    contactId,
    _whatsapp: contactData._whatsapp || '',
    _email: contactData._email || '',
    _ownerName: contactData._ownerName || '',
    companyName: lead.companyName || '',
    _fieldsCount: Object.keys(airtableFields).length,
    _partnersCreated: partnersData.length,
  }
}];
