#!/usr/bin/env node
/**
 * PreToolUse hook — Playwright screenshot filename guard.
 *
 * Enforces the rule defined in .claude/rules/playwright-artifacts.md:
 * every Playwright screenshot MUST be saved under playwright/{categoria}/.
 *
 * Behavior:
 *   - Reads PreToolUse event JSON from stdin.
 *   - Only inspects tool_name === "mcp__playwright__browser_take_screenshot".
 *   - Validates tool_input.filename against the required prefix.
 *   - Exit 0  -> allow
 *   - Exit 2  -> block (stderr is shown to the model so it can self-correct)
 *
 * Categories whitelist is intentionally lax: any non-empty subfolder under
 * playwright/ is accepted. The rule file documents the canonical list.
 */

const REQUIRED_PREFIX = "playwright/";
const ALLOWED_EXT = /\.(png|jpe?g)$/i;

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
  });
}

function block(reason, suggestedFilename) {
  const lines = [
    "[playwright-filename-guard] BLOCKED — " + reason,
    "",
    "Regra: .claude/rules/playwright-artifacts.md",
    "Formato obrigatorio: playwright/{categoria}/{nome-descritivo}.{png|jpeg}",
    "",
    "Categorias padrao: audit, deploy, e2e-pesca, ux, admin, spiced-recalc,",
    "  kpi, debug, screenshots, campaigns, pipeline, final, fix, test, orphans.",
  ];
  if (suggestedFilename) {
    lines.push("", "Sugestao: filename=\"" + suggestedFilename + "\"");
  }
  process.stderr.write(lines.join("\n") + "\n");
  process.exit(2);
}

(async () => {
  let raw;
  try {
    raw = await readStdin();
  } catch {
    process.exit(0); // fail-open on stdin errors — never block unrelated work
  }

  let event;
  try {
    event = JSON.parse(raw || "{}");
  } catch {
    process.exit(0);
  }

  if (event.tool_name !== "mcp__playwright__browser_take_screenshot") {
    process.exit(0);
  }

  const input = event.tool_input || {};
  const filename = typeof input.filename === "string" ? input.filename.trim() : "";

  if (!filename) {
    return block(
      "Parametro 'filename' ausente. Playwright salvaria em .playwright-mcp/ (orfao).",
      "playwright/screenshots/captura.png"
    );
  }

  // Reject absolute paths and parent traversal — keep artifacts inside the project tree.
  if (filename.startsWith("/") || filename.includes("..")) {
    return block(
      "Filename absoluto ou com '..' nao e permitido (path traversal).",
      "playwright/screenshots/" + filename.split("/").pop()
    );
  }

  if (!filename.startsWith(REQUIRED_PREFIX)) {
    const base = filename.replace(/^\.?\/?/, "").split("/").pop();
    return block(
      "Filename '" + filename + "' nao comeca com 'playwright/{categoria}/'.",
      "playwright/screenshots/" + base
    );
  }

  // Must have at least one subfolder after playwright/ (the category).
  const rest = filename.slice(REQUIRED_PREFIX.length);
  const parts = rest.split("/").filter(Boolean);
  if (parts.length < 2) {
    return block(
      "Faltou subpasta de categoria. Use 'playwright/{categoria}/{arquivo}.png'.",
      "playwright/screenshots/" + (parts[0] || "captura.png")
    );
  }

  if (!ALLOWED_EXT.test(filename)) {
    return block(
      "Extensao invalida em '" + filename + "'. Use .png, .jpg ou .jpeg.",
      filename.replace(/\.[^.]+$/, "") + ".png"
    );
  }

  process.exit(0);
})();
