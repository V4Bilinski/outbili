// ============================================================
// NODE 14: Parse Enrichment
// ============================================================
// FUNÇÃO: Extrair JSON da resposta do Claude Sonnet Enrich
//         e mergear com dados do lead (do Node 12. Parse SPICED)
//
// INPUT:  Resposta RAW da API Claude (de Node 13)
//         → { model, id, content: [{ type: "text", text: "```json{...}```" }] }
//
// OUTPUT: Lead completo com dados base + SPICED + enriquecimento
// ============================================================

// 1. Extrair JSON da resposta do Claude Sonnet
const claudeResp = $input.first().json;
const rawText = (claudeResp.content || [])[0]?.text || '';

let enrichmentData = {};
// Tentar extrair JSON de code blocks ou raw JSON
const codeBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
const rawJsonMatch = rawText.match(/\{[\s\S]*\}/);
const jsonStr = codeBlockMatch ? codeBlockMatch[1] : (rawJsonMatch ? rawJsonMatch[0] : '');

if (jsonStr) {
  try {
    enrichmentData = JSON.parse(jsonStr.trim());
  } catch (e) {
    // Fallback: tentar limpar caracteres problemáticos
    try {
      const cleaned = jsonStr.replace(/[\x00-\x1f]/g, ' ').trim();
      enrichmentData = JSON.parse(cleaned);
    } catch {}
  }
}

// 2. Buscar dados do lead dos nodes anteriores
const leadFromSpiced = $('12. Parse SPICED').first().json;
const leadFromLoop = $('10. Loop por Lead').first().json;

// 3. Merge: loop original + SPICED + enriquecimento Claude
const lead = { ...leadFromLoop, ...leadFromSpiced, ...enrichmentData };

// 4. Mapeamento temperatura (HOT/WARM/COLD → Quente/Morno/Frio)
const tempMap = {
  'HOT': 'Quente', 'WARM': 'Morno', 'COLD': 'Frio',
  'Quente': 'Quente', 'Morno': 'Morno', 'Frio': 'Frio'
};

// 5. Construir objeto final com campos válidos do Airtable
const cleanLead = {
  // --- Dados base ---
  companyName: lead.companyName || '',
  segment: lead.segment || '',
  tier: lead.tier || 'Small',
  monthlyRevenue: lead.revenue || lead.monthlyRevenue || 0,
  employees: lead.employees || 5,
  yearsInMarket: lead.yearsInMarket || 5,
  status: 'Novo',
  score: lead.score || 0,
  temperatura: tempMap[lead.temperature] || tempMap[lead.temperatura] || 'Morno',
  // --- SPICED ---
  spicedS: lead.spicedS || 0,
  spicedP: lead.spicedP || 0,
  spicedI: lead.spicedI || 0,
  spicedC: lead.spicedC || 0,
  spicedD: lead.spicedD || 0,
  spicedNotes: typeof lead.spicedNotes === 'object'
    ? JSON.stringify(lead.spicedNotes) : (lead.spicedNotes || ''),
  hypotheticalTrap: lead.hypotheticalTrap || '',
  // --- Presença digital ---
  website: lead.website || '',
  instagram: lead.instagram || '',
  linkedin: lead.linkedin || '',
  facebook: lead.facebook || '',
  googleRating: lead.rating || lead.googleRating || 0,
  googleReviewsCount: lead.reviews || lead.googleReviewsCount || 0,
  // --- Localização ---
  address: lead.address || '',
  city: lead.city || '',
  state: lead.state || '',
  // --- Enriquecimento (JSON strings) ---
  businessSummary: typeof lead.businessSummary === 'object'
    ? JSON.stringify(lead.businessSummary) : (lead.businessSummary || ''),
  discoveryQuestions: typeof lead.discoveryQuestions === 'object'
    ? JSON.stringify(lead.discoveryQuestions) : (lead.discoveryQuestions || '[]'),
  eligibilityChecklist: typeof lead.eligibilityChecklist === 'object'
    ? JSON.stringify(lead.eligibilityChecklist) : (lead.eligibilityChecklist || '[]'),
  meetingPrep: typeof lead.meetingPrep === 'object'
    ? JSON.stringify(lead.meetingPrep) : (lead.meetingPrep || '{}'),
  salesArguments: typeof lead.salesArguments === 'object'
    ? JSON.stringify(lead.salesArguments) : (lead.salesArguments || ''),
  vulnerabilities: typeof lead.vulnerabilities === 'object'
    ? JSON.stringify(lead.vulnerabilities) : (lead.vulnerabilities || ''),
  competitiveAnalysis: typeof lead.competitiveAnalysis === 'object'
    ? JSON.stringify(lead.competitiveAnalysis) : (lead.competitiveAnalysis || ''),
  projectionData: typeof lead.projectionData === 'object'
    ? JSON.stringify(lead.projectionData) : (lead.projectionData || ''),
  productPortfolio: typeof lead.productPortfolio === 'object'
    ? JSON.stringify(lead.productPortfolio) : (lead.productPortfolio || ''),
  enrichmentStatus: 'complete',
  // --- Dados para Contact (prefixo _ = não salvar no Lead) ---
  _whatsapp: lead.whatsapp || '',
  _email: (lead.emails || [])[0] || '',
  _ownerName: lead.companyName || '',
};

// 6. Remover vazios
const finalLead = {};
for (const [key, value] of Object.entries(cleanLead)) {
  if (value !== undefined && value !== null && value !== '') {
    finalLead[key] = value;
  }
}

return [{ json: finalLead }];
