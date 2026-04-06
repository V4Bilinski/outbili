// ============================================================
// NODE 15: Salvar Lead Airtable
// ============================================================
// FUNÇÃO: Criar lead no Airtable (POST, não PATCH)
//         usando dados já parseados do Node 14
//
// INPUT:  Lead limpo e mapeado (do Node 14. Parse Enrichment)
//
// OUTPUT: Resposta do Airtable com records[0].id
//
// REQUISITO: Variáveis de ambiente no N8N:
//   - AIRTABLE_BASE_ID (ex: appKh4qQ5JN94dQHv)
//   - AIRTABLE_PAT (ex: pat...)
// ============================================================

const lead = $input.first().json;

// 1. Separar campos do Lead (Airtable) dos campos de Contact (prefixo _)
const airtableFields = {};
const contactData = {};

for (const [key, value] of Object.entries(lead)) {
  if (key.startsWith('_')) {
    contactData[key] = value;
  } else {
    airtableFields[key] = value;
  }
}

// 2. CRIAR lead no Airtable (POST = create, não PATCH = update)
const BASE_ID = $env.AIRTABLE_BASE_ID;
const PAT = $env.AIRTABLE_PAT;

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

return [{
  json: {
    ...response,
    leadId: createdId,
    _whatsapp: contactData._whatsapp || '',
    _email: contactData._email || '',
    _ownerName: contactData._ownerName || '',
    companyName: lead.companyName || '',
    _fieldsCount: Object.keys(airtableFields).length,
  }
}];
