import fs from "node:fs";
import path from "node:path";

export function discoverSourceUrl(captureDir, meta) {
  // Try CLAUDE.md / AGENTS.md for a URL line
  for (const f of ["CLAUDE.md", "AGENTS.md", ".cursorrules"]) {
    try {
      const txt = fs.readFileSync(path.join(captureDir, f), "utf8");
      const m = txt.match(/https?:\/\/[^\s)>\]]+/);
      if (m) return m[0].replace(/[.,;:!?]+$/, "");
    } catch {}
  }
  // Fall back to meta.id
  if (meta && meta.id) {
    const slug = String(meta.id).replace(/-video$/, "").replace(/-/g, ".");
    if (slug.includes(".")) return `https://${slug.startsWith("www.") ? "" : "www."}${slug}`;
  }
  return null;
}
