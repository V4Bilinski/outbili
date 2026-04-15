/**
 * Pre-Send Validator — WhatsApp Business API Squad
 *
 * Validates message payloads before sending to the Cloud API.
 * Can be used as a pre-commit hook, CI gate, or runtime validator.
 *
 * Usage:
 *   node scripts/pre-send-validator.js --payload ./payload.json
 *   node scripts/pre-send-validator.js --template-name my_template --params '{"1":"Maria"}'
 *
 * Returns exit code 0 (pass) or 1 (fail) with detailed report.
 */

const PROHIBITED_WORDS = [
  'desconto', 'oferta', 'promoção', 'aproveite agora', 'compre já',
  'não perca', 'última chance', 'imperdível', 'exclusivo', 'preço especial',
  'ganhe', 'economize', 'só hoje', 'oferta limitada', 'bônus', 'brinde',
  'frete grátis', 'venda', 'liquidação', 'preço baixo', 'reserve já',
  'corra', 'condição exclusiva', 'condição especial', 'reservada'
];

const STATUS_WORDS = [
  'aprovada', 'confirmada', 'processada', 'enviada', 'recebida',
  'disponível', 'atualizada', 'validada', 'registrada', 'concluída',
  'liberada', 'agendada', 'aguardando confirmação', 'em andamento',
  'pendente', 'pronta para uso', 'em processamento', 'em análise',
  'em preparação', 'na fila', 'revisada', 'autorizada'
];

const COMPONENT_LIMITS = {
  header_text: 60,
  body: 1024,
  footer: 60,
  quick_reply_label: 25,
  quick_reply_count: 10,
  url_button_label: 25,
  url_button_count: 2,
  phone_button_count: 1,
  template_name: 512
};

const E164_REGEX = /^[1-9]\d{6,14}$/;
const TEMPLATE_NAME_REGEX = /^[a-z][a-z0-9_]*$/;

/**
 * Validate phone number format (E.164 without +)
 */
function validatePhone(phone) {
  const errors = [];
  if (typeof phone !== 'string') {
    errors.push(`Phone must be string, got ${typeof phone}`);
    return errors;
  }
  if (phone.startsWith('+')) {
    errors.push(`Phone must NOT start with '+'. Got: ${phone}. Use: ${phone.slice(1)}`);
  }
  if (!E164_REGEX.test(phone.replace('+', ''))) {
    errors.push(`Phone not in E.164 format: ${phone}. Expected: digits only, 7-15 chars`);
  }
  return errors;
}

/**
 * Validate template name format
 */
function validateTemplateName(name) {
  const errors = [];
  if (!name) {
    errors.push('Template name is required');
    return errors;
  }
  if (name.length > COMPONENT_LIMITS.template_name) {
    errors.push(`Template name exceeds ${COMPONENT_LIMITS.template_name} chars: ${name.length}`);
  }
  if (!TEMPLATE_NAME_REGEX.test(name)) {
    errors.push(`Template name must be lowercase + underscores only. Got: "${name}"`);
  }
  return errors;
}

/**
 * Validate template component limits
 */
function validateComponents(components) {
  const errors = [];
  if (!Array.isArray(components)) return errors;

  for (const comp of components) {
    switch (comp.type) {
      case 'HEADER':
        if (comp.format === 'TEXT' && comp.text && comp.text.length > COMPONENT_LIMITS.header_text) {
          errors.push(`Header text exceeds ${COMPONENT_LIMITS.header_text} chars: ${comp.text.length}`);
        }
        break;
      case 'BODY':
        if (comp.text && comp.text.length > COMPONENT_LIMITS.body) {
          errors.push(`Body exceeds ${COMPONENT_LIMITS.body} chars: ${comp.text.length}`);
        }
        break;
      case 'FOOTER':
        if (comp.text && comp.text.length > COMPONENT_LIMITS.footer) {
          errors.push(`Footer exceeds ${COMPONENT_LIMITS.footer} chars: ${comp.text.length}`);
        }
        if (comp.text && /\{\{\d+\}\}/.test(comp.text)) {
          errors.push('Footer MUST NOT contain variables');
        }
        break;
      case 'BUTTONS':
        if (Array.isArray(comp.buttons)) {
          const quickReplies = comp.buttons.filter(b => b.type === 'QUICK_REPLY');
          const urlButtons = comp.buttons.filter(b => b.type === 'URL');
          const phoneButtons = comp.buttons.filter(b => b.type === 'PHONE_NUMBER');

          if (quickReplies.length > COMPONENT_LIMITS.quick_reply_count) {
            errors.push(`Quick reply buttons exceed max ${COMPONENT_LIMITS.quick_reply_count}: ${quickReplies.length}`);
          }
          if (urlButtons.length > COMPONENT_LIMITS.url_button_count) {
            errors.push(`URL buttons exceed max ${COMPONENT_LIMITS.url_button_count}: ${urlButtons.length}`);
          }
          if (phoneButtons.length > COMPONENT_LIMITS.phone_button_count) {
            errors.push(`Phone buttons exceed max ${COMPONENT_LIMITS.phone_button_count}: ${phoneButtons.length}`);
          }

          for (const btn of comp.buttons) {
            if (btn.text && btn.text.length > COMPONENT_LIMITS.quick_reply_label) {
              errors.push(`Button label exceeds ${COMPONENT_LIMITS.quick_reply_label} chars: "${btn.text}" (${btn.text.length})`);
            }
          }
        }
        break;
    }
  }
  return errors;
}

/**
 * Scan text for prohibited words (utility reclassification risk)
 */
function scanProhibitedWords(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  return PROHIBITED_WORDS.filter(word => lower.includes(word.toLowerCase()));
}

/**
 * Check for status words (utility approval boosters)
 */
function findStatusWords(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  return STATUS_WORDS.filter(word => lower.includes(word.toLowerCase()));
}

/**
 * Calculate PACTO score for utility templates
 */
function calculatePactoScore(bodyText) {
  let score = 0;
  const lower = (bodyText || '').toLowerCase();

  // P — Palavra de Status (25 points)
  const statusWords = findStatusWords(bodyText);
  if (statusWords.length > 0) score += 25;

  // A — Apresentação Contextual (15 points)
  if (/\{\{1\}\}/.test(bodyText) || /olá|prezado|caro/i.test(bodyText)) score += 15;

  // C — Clareza e Tom Informativo (25 points)
  const prohibited = scanProhibitedWords(bodyText);
  if (prohibited.length === 0) score += 25;

  // T — Tomada de Ação com Serviço (20 points)
  const serviceCTAs = ['acompanhar', 'confirmar', 'receber', 'verificar', 'consultar', 'acessar'];
  const salesCTAs = ['comprar', 'garantir', 'adquirir', 'reservar'];
  const hasServiceCTA = serviceCTAs.some(w => lower.includes(w));
  const hasSalesCTA = salesCTAs.some(w => lower.includes(w));
  if (hasServiceCTA && !hasSalesCTA) score += 20;
  else if (!hasSalesCTA) score += 10;

  // O — Omissão de Apelos (15 points)
  const exclamations = (bodyText.match(/!/g) || []).length;
  const capsWords = (bodyText.match(/\b[A-Z]{3,}\b/g) || []).length;
  if (exclamations <= 1 && capsWords === 0 && prohibited.length === 0) score += 15;

  return {
    total: score,
    breakdown: {
      P_status_word: statusWords.length > 0 ? 'PASS' : 'FAIL',
      A_presentation: score >= 40 ? 'PASS' : 'FAIL',
      C_clarity: prohibited.length === 0 ? 'PASS' : 'FAIL',
      T_action: hasServiceCTA && !hasSalesCTA ? 'PASS' : hasSalesCTA ? 'FAIL' : 'PARTIAL',
      O_omission: exclamations <= 1 && capsWords === 0 ? 'PASS' : 'FAIL'
    },
    status_words: statusWords,
    prohibited_words: prohibited
  };
}

/**
 * Validate a complete message payload
 */
function validatePayload(payload) {
  const report = {
    valid: true,
    errors: [],
    warnings: [],
    pacto: null
  };

  // Check messaging_product
  if (payload.messaging_product !== 'whatsapp') {
    report.errors.push('messaging_product must be "whatsapp"');
  }

  // Check recipient phone
  if (payload.to) {
    const phoneErrors = validatePhone(payload.to);
    report.errors.push(...phoneErrors);
  } else {
    report.errors.push('Missing "to" field (recipient phone number)');
  }

  // Check message type
  if (payload.type === 'template' && payload.template) {
    const nameErrors = validateTemplateName(payload.template.name);
    report.errors.push(...nameErrors);

    if (payload.template.components) {
      const compErrors = validateComponents(payload.template.components);
      report.errors.push(...compErrors);
    }
  }

  // Check for text messages outside 24h window
  if (payload.type === 'text') {
    report.warnings.push('Text messages only work within 24h service window. Use templates for outbound.');
  }

  report.valid = report.errors.length === 0;
  return report;
}

// Export for use as module
module.exports = {
  validatePhone,
  validateTemplateName,
  validateComponents,
  scanProhibitedWords,
  findStatusWords,
  calculatePactoScore,
  validatePayload,
  PROHIBITED_WORDS,
  STATUS_WORDS,
  COMPONENT_LIMITS
};

// CLI mode
if (require.main === module) {
  const args = process.argv.slice(2);
  const payloadArg = args.find((_, i) => args[i - 1] === '--payload');
  const textArg = args.find((_, i) => args[i - 1] === '--text');

  if (payloadArg) {
    try {
      const fs = require('fs');
      const payload = JSON.parse(fs.readFileSync(payloadArg, 'utf8'));
      const result = validatePayload(payload);
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.valid ? 0 : 1);
    } catch (e) {
      console.error(`Error: ${e.message}`);
      process.exit(1);
    }
  } else if (textArg) {
    const pacto = calculatePactoScore(textArg);
    console.log(JSON.stringify(pacto, null, 2));
    process.exit(pacto.total >= 70 ? 0 : 1);
  } else {
    console.log('Usage:');
    console.log('  node pre-send-validator.js --payload ./payload.json');
    console.log('  node pre-send-validator.js --text "Confirmada: sua consulta..."');
    process.exit(0);
  }
}
