/**
 * Minimal ASCII DXF reader for design-to-BOM. Pulls out everything an engineer
 * would read off the drawing: text labels (TEXT, MTEXT, ATTRIB/ATTDEF values)
 * and how many times each block (symbol) is inserted.
 */
export interface DxfSummary {
  texts: string[];
  blockCounts: Record<string, number>;
}

export function isBinaryDxf(bytes: Uint8Array): boolean {
  const head = new TextDecoder("latin1").decode(bytes.subarray(0, 22));
  return head.startsWith("AutoCAD Binary DXF");
}

/** Strip MTEXT inline formatting: {\fArial|b0;...}, \P (newline), \~, \S1^2; etc. */
export function cleanMText(s: string): string {
  return s
    .replace(/\\P/gi, "\n")
    .replace(/\\~/g, " ")
    .replace(/\\[ACFHQTWfLlOoKk][^;\\{}]*;?/g, "")
    .replace(/\\S([^;]*);/g, (_m, frac) => frac.replace(/[\^#]/g, "/"))
    .replace(/[{}]/g, "")
    .replace(/%%[cC]/g, "Ø")
    .replace(/%%[dD]/g, "°")
    .replace(/%%[pP]/g, "±")
    .replace(/[ \t]+/g, " ")
    .trim();
}

export function summariseDxf(content: string): DxfSummary {
  const lines = content.split(/\r?\n/);
  const texts: string[] = [];
  const blockCounts: Record<string, number> = {};

  let entity = "";
  let inEntities = false;
  let mtextParts: string[] = [];

  const flushMText = () => {
    if (entity === "MTEXT" && mtextParts.length) {
      const t = cleanMText(mtextParts.join(""));
      if (t) texts.push(t);
    }
    mtextParts = [];
  };

  for (let i = 0; i + 1 < lines.length; i += 2) {
    const code = lines[i].trim();
    const value = lines[i + 1] ?? "";

    if (code === "0") {
      flushMText();
      entity = value.trim();
      continue;
    }
    if (code === "2" && entity === "SECTION") {
      inEntities = value.trim() === "ENTITIES" || value.trim() === "BLOCKS";
      continue;
    }
    if (!inEntities) continue;

    if ((entity === "TEXT" || entity === "ATTRIB" || entity === "ATTDEF") && code === "1") {
      const t = cleanMText(value);
      if (t) texts.push(t);
    } else if (entity === "MTEXT" && (code === "3" || code === "1")) {
      mtextParts.push(value);
    } else if (entity === "INSERT" && code === "2") {
      const name = value.trim();
      if (name && !name.startsWith("*")) blockCounts[name] = (blockCounts[name] ?? 0) + 1;
    }
  }
  flushMText();
  return { texts, blockCounts };
}

/** Turn a DXF summary into text the BOM parser can read. Caps output size. */
export function dxfToBomText(s: DxfSummary, maxChars = 12000): string {
  const seen = new Map<string, number>();
  for (const t of s.texts) seen.set(t, (seen.get(t) ?? 0) + 1);
  const labelLines = [...seen].map(([t, n]) => (n > 1 ? `${t}  (appears ${n} times)` : t));
  const blockLines = Object.entries(s.blockCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([b, n]) => `${b}: ${n}`);
  const out =
    `DRAWING SYMBOL COUNTS (block name: number placed)\n${blockLines.join("\n") || "(none)"}\n\n` +
    `DRAWING TEXT LABELS\n${labelLines.join("\n")}`;
  return out.slice(0, maxChars);
}
