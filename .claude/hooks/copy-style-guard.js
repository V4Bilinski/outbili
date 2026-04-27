#!/usr/bin/env node
/**
 * PreToolUse hook. OUTBILI Copy Style Guard.
 *
 * Enforces docs/copy/COPY-GUIDE-DEFINITIVO.md and .claude/rules/copy-tom-voz.md
 * across every Edit/Write touching UI source or copy specs.
 *
 * Rules enforced:
 *   1. ZERO em-dash or en-dash ("—" U+2014, "–" U+2013) in user-visible strings.
 *      Detected only inside string literals (single, double, or template), and
 *      JSX text. Comments, regex, console.* calls, animations/* JSDoc and
 *      lib/file-parser.ts ignored.
 *   2. WARN on caricature jargon ("pescar lead", "matar a objecao", "subir o lead",
 *      "zumbi no pipe", "bora pra mesa", "linha ta rodando", "vai pra rua",
 *      "caneta na mao", etc.). Warning only, does NOT block.
 *
 * Behavior:
 *   - Exit 0 -> allow.
 *   - Exit 2 -> block (stderr shown to the model for self-correction).
 *   - Fail-open on parse errors.
 */

import { existsSync, readFileSync } from "node:fs";

const SCOPED_PREFIXES = [
  "src/",
  "docs/copy/",
];

const SKIP_FILES = new Set([
  "src/lib/file-parser.ts",
  "src/services/firecrawlService.ts",
]);

const SKIP_DIRS = [
  "src/components/animations/",
];

const HARD_DASH_REGEX = /[—–]/;

const CARICATURE_JARGON = [
  /\bpesca(?:r|ria|ndo)?\s+(?:lead|o\s+lead|leads)\b/i,
  /\bsubir?\s+o\s+lead\b/i,
  /\bmatar?\s+(?:a\s+)?objec(?:a|ã)o\b/i,
  /\bzumbi\s+(?:no\s+)?pipe\b/i,
  /\bbora\s+pra\s+mesa\b/i,
  /\blinha\s+t(?:a|á)\s+rodando\b/i,
  /\bvai\s+pra\s+rua\b/i,
  /\bcaneta\s+(?:perto|na\s+m(?:a|ã)o)\b/i,
  /\bfecha\s+(?:logo\s+)?essa\s+porra\b/i,
];

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
  });
}

function inScope(filePath) {
  if (!filePath) return false;
  const norm = filePath.replace(/\\/g, "/");
  const projectRoot = process.cwd().replace(/\\/g, "/");
  let rel = norm;
  if (norm.startsWith(projectRoot + "/")) rel = norm.slice(projectRoot.length + 1);
  if (SKIP_FILES.has(rel)) return false;
  if (SKIP_DIRS.some((d) => rel.startsWith(d))) return false;
  if (!/\.(tsx?|md)$/.test(rel)) return false;
  return SCOPED_PREFIXES.some((p) => rel.startsWith(p));
}

/**
 * Strip JS/TS comments AND trailing tail of a line (best-effort, line-by-line).
 * Removes: // line comments, block comments on a single line, JSX comments {  ... }.
 * Keeps strings intact for the dash check.
 */
function stripComments(text) {
  // Remove block comments /* ... */ across lines.
  let out = text.replace(/\/\*[\s\S]*?\*\//g, (m) => " ".repeat(m.length));
  // Remove JSX comments { ... } across lines.
  out = out.replace(/\{\/\*[\s\S]*?\*\/\}/g, (m) => " ".repeat(m.length));
  // Remove line comments. Keep newline.
  out = out.replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + "");
  return out;
}

/**
 * Find dash inside actual string literals or JSX text content.
 * Returns array of { line, snippet } or empty when clean.
 */
function findDashesInUiStrings(content) {
  const stripped = stripComments(content);
  const lines = stripped.split("\n");
  const found = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!HARD_DASH_REGEX.test(line)) continue;

    // Skip console.* calls.
    if (/\bconsole\.(log|warn|error|info|debug)\b/.test(line)) continue;

    // Skip when dash is inside a regex char-class like [-–] or [\\-–].
    const charClassMatch = line.match(/\[[^\]]*[–—][^\]]*\]/g);
    if (charClassMatch && charClassMatch.length) {
      let cleaned = line;
      for (const cc of charClassMatch) cleaned = cleaned.replace(cc, " ".repeat(cc.length));
      if (!HARD_DASH_REGEX.test(cleaned)) continue;
    }

    // Detect dash inside string literal or JSX text.
    const inString = /["'`][^"'`\n]*[–—][^"'`\n]*["'`]/.test(line);
    const inJsxText = />[^<]*[–—][^<]*</.test(line);
    const inMarkdownText = line.trim().length > 0 && /\.md$/.test("");
    if (inString || inJsxText) {
      found.push({ line: i + 1, snippet: line.trim().slice(0, 200) });
    }
  }
  return found;
}

function findCaricatureJargon(content) {
  const stripped = stripComments(content);
  const lines = stripped.split("\n");
  const found = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const re of CARICATURE_JARGON) {
      if (re.test(line)) {
        found.push({ line: i + 1, match: line.match(re)[0], snippet: line.trim().slice(0, 200) });
        break;
      }
    }
  }
  return found;
}

function block(filePath, dashHits, jargonHits) {
  const lines = [
    "[copy-style-guard] BLOCKED. " + filePath,
    "",
    "Regra: .claude/rules/copy-tom-voz.md",
    "Guia: docs/copy/COPY-GUIDE-DEFINITIVO.md",
    "",
  ];
  if (dashHits.length) {
    lines.push("Travessoes detectados em strings visiveis (PROIBIDOS):");
    for (const h of dashHits.slice(0, 8)) {
      lines.push("  L" + h.line + ": " + h.snippet);
    }
    if (dashHits.length > 8) lines.push("  ... +" + (dashHits.length - 8) + " ocorrencias.");
    lines.push("");
    lines.push("Substituicoes validas:");
    lines.push("  '—' / '–'  ->  '.'  (separa frases)");
    lines.push("                ':'  (introduz lista/explicacao)");
    lines.push("                ','  (pausa dentro da frase)");
    lines.push("                '·'  (separador decorativo)");
    lines.push("                ' a '  (em ranges numericos)");
    lines.push("");
  }
  if (jargonHits.length) {
    lines.push("Giria caricatura detectada (PROIBIDA):");
    for (const h of jargonHits.slice(0, 8)) {
      lines.push("  L" + h.line + " '" + h.match + "': " + h.snippet);
    }
    lines.push("");
    lines.push("Substitua por vocabulario comercial profissional:");
    lines.push("  pescar lead    -> prospectar / iniciar prospeccao");
    lines.push("  subir o lead   -> avancar oportunidade / mover para proxima etapa");
    lines.push("  matar objecao  -> tratar objecao / responder objecao");
    lines.push("  zumbi no pipe  -> deal travado / oportunidade estagnada");
    lines.push("  bora pra mesa  -> (eliminar)");
    lines.push("  linha rodando  -> pipeline ativo");
    lines.push("  caneta perto   -> proximo do fechamento");
    lines.push("");
  }
  process.stderr.write(lines.join("\n") + "\n");
  process.exit(2);
}

(async () => {
  let raw;
  try {
    raw = await readStdin();
  } catch {
    process.exit(0);
  }

  let event;
  try {
    event = JSON.parse(raw || "{}");
  } catch {
    process.exit(0);
  }

  const tool = event.tool_name;
  if (!["Edit", "Write", "MultiEdit"].includes(tool)) process.exit(0);

  const input = event.tool_input || {};
  const filePath = input.file_path;
  if (!inScope(filePath)) process.exit(0);

  // Build the candidate text after the proposed change.
  let candidate;
  try {
    if (tool === "Write") {
      candidate = String(input.content || "");
    } else if (tool === "Edit") {
      // For Edit, we cannot easily compute the post-image without disk access.
      // Read current file, apply the simple replace; if file missing, fall back to new_string only.
      let current = "";
      if (filePath && existsSync(filePath)) {
        current = readFileSync(filePath, "utf8");
      }
      const oldStr = String(input.old_string || "");
      const newStr = String(input.new_string || "");
      if (input.replace_all) {
        candidate = current.split(oldStr).join(newStr);
      } else if (oldStr && current.includes(oldStr)) {
        candidate = current.replace(oldStr, newStr);
      } else {
        candidate = newStr;
      }
    } else if (tool === "MultiEdit") {
      let current = "";
      if (filePath && existsSync(filePath)) {
        current = readFileSync(filePath, "utf8");
      }
      const edits = Array.isArray(input.edits) ? input.edits : [];
      candidate = current;
      for (const ed of edits) {
        const oldStr = String(ed.old_string || "");
        const newStr = String(ed.new_string || "");
        if (ed.replace_all) candidate = candidate.split(oldStr).join(newStr);
        else if (oldStr && candidate.includes(oldStr)) candidate = candidate.replace(oldStr, newStr);
      }
    }
  } catch {
    process.exit(0);
  }

  if (typeof candidate !== "string" || candidate.length === 0) process.exit(0);

  const dashHits = findDashesInUiStrings(candidate);
  const jargonHits = findCaricatureJargon(candidate);

  if (dashHits.length === 0 && jargonHits.length === 0) process.exit(0);

  block(filePath, dashHits, jargonHits);
})();
