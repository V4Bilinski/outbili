// ============================================================
// NODE: CNPJa Fallback Search (n8n)
// ============================================================
// FUNCAO: Buscar dados de empresa via CNPJa API (server-side)
//         Usado como FALLBACK quando a chamada frontend falha
//         (rate limit, CORS, timeout)
//
// INPUT:  { cnpj: "12345678000199" } ou
//         { cnaeCodes: [1234500], states: ["SP"], targetCount: 50 }
//
// OUTPUT: Array de leads com dados CNPJa mapeados para Airtable
//
// CREDENCIAL: CNPJA_API_KEY (hardcoded — NUNCA usar $env em Code nodes)
// ============================================================

const input = $input.first().json;
// IMPORTANTE: Substituir pela API key real no n8n (nao commitar no git)
const CNPJA_API_KEY = process.env.CNPJA_API_KEY || 'CONFIGURE_NO_N8N';
const CNPJA_BASE = 'https://api.cnpja.com';

// --- Helper: fetch com retry ---
async function cnpjaFetch(path, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    const response = await this.helpers.httpRequest({
      method: 'GET',
      url: `${CNPJA_BASE}${path}`,
      headers: { 'Authorization': CNPJA_API_KEY },
    });
    return response;
  }
}

// --- Mapear resposta CNPJa para campos Airtable ---
function mapOfficeToLead(office) {
  const phone = (office.phones || [])[0];
  const email = (office.emails || [])[0];
  const members = (office.company?.members || []);

  // Derivar taxRegime
  let taxRegime = undefined;
  if (office.company?.simei?.optant) taxRegime = 'mei';
  else if (office.company?.simples?.optant) taxRegime = 'simples';

  // Mapear porte para tier
  let tier = 'Micro+';
  const acronym = office.company?.size?.acronym;
  if (acronym === 'EPP') tier = 'Small';
  else if (acronym === 'DEMAIS') tier = 'Medium=';

  return {
    // Campos Airtable (Lead)
    companyName: office.company?.name,
    tradeName: office.alias || undefined,
    cnpj: office.taxId,
    segment: office.mainActivity?.text,
    tier,
    status: 'Novo',
    score: 0,
    temperatura: 'Frio',
    address: office.address ? `${office.address.street}, ${office.address.number}` : undefined,
    city: office.address?.city,
    state: office.address?.state,
    zipCode: office.address?.zip,
    district: office.address?.district,
    municipalityCode: office.address?.municipality,
    capitalSocial: office.company?.equity,
    legalNature: office.company?.nature?.text,
    registrationStatus: office.status?.text,
    statusDate: office.statusDate,
    foundingDate: office.founded,
    cnaePrimary: office.mainActivity ? `${office.mainActivity.id} - ${office.mainActivity.text}` : undefined,
    cnaeSecondary: (office.sideActivities || []).map(a => `${a.id} - ${a.text}`).join('\n'),
    rfPhone: phone ? `${phone.area}${phone.number}` : undefined,
    phoneType: phone?.type,
    rfEmail: email?.address,
    emailDomain: email?.domain,
    taxRegime,
    simplesOptant: office.company?.simples?.optant || false,
    isHeadquarters: office.head || false,
    cnpjaLastUpdate: office.updated,
    enrichmentStatus: 'cnpja_n8n',
    // Campos prefixados (para criar Contact depois)
    _ownerName: members[0]?.person?.name || undefined,
    _ownerRole: members[0]?.role?.text || undefined,
    _whatsapp: phone?.type === 'MOBILE' ? `55${phone.area}${phone.number}` : undefined,
    _email: email?.address || undefined,
    // Socios (para criar na tabela Partners)
    _partners: members.map(m => ({
      name: m.person.name,
      qualification: m.role.text,
      since: m.since,
      personType: m.person.type,
      cpf: m.person.taxId,
    })),
  };
}

// --- Execucao ---

try {
  if (input.cnpj) {
    // Modo: busca por CNPJ unico
    const office = await cnpjaFetch.call(this, `/office/${input.cnpj.replace(/\D/g, '')}`);
    const lead = mapOfficeToLead(office);
    return [{ json: lead }];
  }

  if (input.cnaeCodes || input.states) {
    // Modo: busca em massa
    const params = new URLSearchParams();
    if (input.cnaeCodes?.[0]) params.set('mainActivity.id', input.cnaeCodes[0]);
    if (input.states?.[0]) params.set('address.state', input.states[0]);
    params.set('status.id', '2'); // Ativa
    params.set('limit', String(Math.min(input.targetCount || 50, 100)));

    const result = await cnpjaFetch.call(this, `/office?${params.toString()}`);
    const offices = result.offices || result || [];

    const leads = offices.map(mapOfficeToLead);
    return leads.map(lead => ({ json: lead }));
  }

  throw new Error('Input invalido: fornecer cnpj ou cnaeCodes+states');
} catch (error) {
  return [{ json: { error: error.message, success: false } }];
}
