#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { parseArgs } from "util";

const { values } = parseArgs({
  options: { capture: { type: "string" } },
  strict: false,
});

const captureDir = values.capture || "./capture";
const extractedDir = path.join(captureDir, "extracted");
const outPath = path.join(captureDir, "context_pack.md");

const tokensPath = path.join(extractedDir, "tokens.json");
if (!fs.existsSync(tokensPath)) {
  console.error(`tokens.json not found at ${tokensPath}`);
  process.exit(1);
}

const tokens = JSON.parse(fs.readFileSync(tokensPath, "utf-8"));

const visibleTextPath = path.join(extractedDir, "visible-text.txt");
const visibleText = fs.existsSync(visibleTextPath)
  ? fs.readFileSync(visibleTextPath, "utf-8")
  : "";

const lines = [];

lines.push(`# Context Pack: ${tokens.title || "Untitled"}`);
lines.push("");

if (tokens.description) {
  lines.push(`> ${tokens.description}`);
  lines.push("");
}

// Brand identity
lines.push("## Brand Identity");
lines.push("");
if (tokens.title) lines.push(`- **Name**: ${tokens.title}`);
if (tokens.ogImage) lines.push(`- **OG Image**: ${tokens.ogImage}`);
lines.push("");

// Colors
if (tokens.colors?.length) {
  lines.push("## Colors");
  lines.push("");
  lines.push(
    tokens.colors
      .map((c) => {
        const varName = Object.entries(tokens.cssVariables || {}).find(
          ([, v]) => v.toLowerCase() === c.toLowerCase()
        );
        return varName ? `- \`${c}\` (${varName[0]})` : `- \`${c}\``;
      })
      .join("\n")
  );
  lines.push("");
}

// Fonts
if (tokens.fonts?.length) {
  lines.push("## Typography");
  lines.push("");
  for (const font of tokens.fonts) {
    if (typeof font === "string") {
      lines.push(`- ${font}`);
    } else {
      const weights = font.weights?.join(", ") || "";
      const variable = font.variable ? " (variable)" : "";
      lines.push(`- **${font.family}** — weights: ${weights}${variable}`);
    }
  }
  lines.push("");
}

// Headings
if (tokens.headings?.length) {
  lines.push("## Headings");
  lines.push("");
  for (const h of tokens.headings) {
    if (typeof h === "string") {
      lines.push(`- ${h}`);
    } else {
      lines.push(
        `- **H${h.level}**: "${h.text}" — ${h.fontSize} / ${h.fontWeight}`
      );
    }
  }
  lines.push("");
}

// CTAs
if (tokens.ctas?.length) {
  lines.push("## Calls to Action");
  lines.push("");
  const seen = new Set();
  for (const cta of tokens.ctas) {
    if (typeof cta === "string") {
      if (!seen.has(cta)) {
        lines.push(`- ${cta}`);
        seen.add(cta);
      }
    } else {
      const key = cta.text;
      if (!seen.has(key)) {
        lines.push(`- **${cta.text}**${cta.href ? ` → ${cta.href}` : ""}`);
        seen.add(key);
      }
    }
  }
  lines.push("");
}

// Sections — the richest part
if (tokens.sections?.length) {
  lines.push("## Page Sections");
  lines.push("");

  const seen = new Set();
  for (let i = 0; i < tokens.sections.length; i++) {
    const section = tokens.sections[i];
    const heading = section.heading || `Section ${i + 1}`;

    // Deduplicate sections with identical headings + text
    const fingerprint = `${heading}::${(section.text || "").slice(0, 100)}`;
    if (seen.has(fingerprint)) continue;
    seen.add(fingerprint);

    lines.push(`### ${i + 1}. ${heading}`);
    lines.push("");

    if (section.type) lines.push(`- **Type**: ${section.type}`);
    if (section.layout) lines.push(`- **Layout**: ${section.layout}`);
    if (section.backgroundColor)
      lines.push(`- **Background**: \`${section.backgroundColor}\``);

    // Full section text (not truncated)
    if (section.text) {
      lines.push("");
      lines.push(section.text);
    }

    // Section-level CTAs
    if (section.callsToAction?.length) {
      lines.push("");
      lines.push(
        `**CTAs**: ${section.callsToAction
          .filter((c) => c.length < 80)
          .join(" · ")}`
      );
    }

    // Assets referenced by this section
    if (section.assets?.length) {
      lines.push("");
      lines.push(
        `**Assets**: ${section.assets.map((a) => `\`${a}\``).join(", ")}`
      );
    }

    lines.push("");
  }
}

// Full visible text
if (visibleText.trim()) {
  lines.push("## Full Visible Text");
  lines.push("");
  lines.push(visibleText.trim());
  lines.push("");
}

// SVG count
if (tokens.svgs?.length) {
  lines.push(`## SVGs: ${tokens.svgs.length} found`);
  lines.push("");
}

// CSS Variables
if (tokens.cssVariables && Object.keys(tokens.cssVariables).length) {
  lines.push("## CSS Variables");
  lines.push("");
  for (const [k, v] of Object.entries(tokens.cssVariables)) {
    lines.push(`- \`${k}\`: \`${v}\``);
  }
  lines.push("");
}

const output = lines.join("\n");
fs.writeFileSync(outPath, output, "utf-8");
console.log(`context_pack.md written (${output.length} chars, ${tokens.sections?.length || 0} sections)`);
