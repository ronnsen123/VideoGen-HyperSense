import fs from "fs";
import path from "path";
import type { NarratorScripts, NarratorScene, CaptureTokens, VideoConfig } from "../types";
import { isLLMAvailable, generateJSON } from "../llm";

const TRANSITION_INTENTS = ["dissolve", "morph", "cut", "slide", "zoom"];

// ---------------------------------------------------------------------------
// LLM-powered story generation (primary path)
// ---------------------------------------------------------------------------

interface LLMScene {
  heading: string;
  script: string;
  type: "hook" | "value-prop" | "feature-showcase" | "social-proof" | "cta";
  emotionalBeat: string;
}

interface LLMStoryResponse {
  premise: string;
  scenes: LLMScene[];
}

function buildPrompt(contextPack: string, config: Partial<VideoConfig>): string {
  const targetDuration = config.duration ?? 60;
  const sceneCount = targetDuration <= 30 ? 3 : targetDuration <= 60 ? 5 : 7;
  const sceneDuration = Math.round(targetDuration / sceneCount);

  return `You are a video script writer for product marketing videos. Given a website's content below, write narrator scripts for a ${targetDuration}-second promotional video.

## Website Content
${contextPack}

## Requirements
- Write exactly ${sceneCount} scenes
- Each scene should be ~${sceneDuration} seconds when read aloud (roughly ${Math.round(sceneDuration * 2.5)} words)
- Scene scripts should be concise, compelling narrator voiceover — 1-2 sentences max per scene
- Do NOT copy disclaimers, legal text, or footer content
- Do NOT use generic filler — every sentence should reference specific product features or benefits from the content above
- Write in a confident, professional tone suitable for a product video

## Story Arc
- Scene 1: Hook — grab attention with the product's core promise
- Middle scenes: Mix of value propositions, feature showcases, and social proof (use actual stats, testimonials, or awards from the content)
- Final scene: Call to action — drive the viewer to take action

## Scene Types (use exactly these values)
- "hook" — attention-grabbing opener
- "value-prop" — key benefit or value statement
- "feature-showcase" — specific product capability
- "social-proof" — testimonials, ratings, awards, stats
- "cta" — closing call to action

## Emotional Beats (one per scene)
- "curiosity" — for hooks
- "trust" — for features and social proof
- "excitement" — for value props
- "confidence" — for security/trust sections
- "determination" — for CTAs

Return JSON in exactly this format:
{
  "premise": "One sentence describing what this video is about",
  "scenes": [
    {
      "heading": "Short on-screen title (3-6 words)",
      "script": "The narrator voiceover text for this scene.",
      "type": "hook",
      "emotionalBeat": "curiosity"
    }
  ]
}`;
}

function llmResponseToNarratorScripts(
  response: LLMStoryResponse,
  brandName: string,
  config: Partial<VideoConfig>
): NarratorScripts {
  const targetDuration = config.duration ?? 60;
  const sceneDuration = targetDuration / response.scenes.length;
  const orientation =
    config.aspectRatio === "9:16"
      ? "portrait"
      : config.aspectRatio === "1:1"
        ? "square"
        : ("landscape" as const);

  const roleMap: Record<string, string> = {
    hook: "attention-capture",
    "value-prop": "value-framing",
    "feature-showcase": "evidence",
    "social-proof": "trust-building",
    cta: "conversion-trigger",
  };

  const persuasionMap: Record<string, string> = {
    hook: "curiosity-gap",
    "value-prop": "benefit-stacking",
    "feature-showcase": "demonstration",
    "social-proof": "social-validation",
    cta: "urgency-scarcity",
  };

  const scenes: NarratorScene[] = response.scenes.map((s, i) => ({
    sceneNumber: i + 1,
    scene_id: `scene_${i + 1}`,
    heading: s.heading.slice(0, 60),
    script: s.script,
    narrativeIntent: {
      type: s.type,
      narrativeRole: roleMap[s.type] || "evidence",
      keyMessage: s.heading.slice(0, 80),
      persuasion: persuasionMap[s.type] || "demonstration",
      emotionalBeat: s.emotionalBeat || "trust",
    },
    transition: {
      continuity: i === 0 ? "cold-open" : "thematic-bridge",
      intent: TRANSITION_INTENTS[i % TRANSITION_INTENTS.length],
    },
    estimatedDuration: Math.round(sceneDuration * 10) / 10,
  }));

  return {
    project: brandName.toLowerCase().replace(/\s+/g, "-"),
    premise: response.premise,
    narrativeArchetype: "product-reveal",
    emotionalArc: "curiosity-trust-action",
    orientation,
    estimatedDuration: targetDuration,
    scenes,
  };
}

export async function generateLLMNarratorScripts(
  projectDir: string,
  config: Partial<VideoConfig>
): Promise<NarratorScripts> {
  const contextPackPath = path.join(projectDir, "capture/context_pack.md");
  if (!fs.existsSync(contextPackPath)) {
    throw new Error("context_pack.md not found");
  }

  const contextPack = fs.readFileSync(contextPackPath, "utf-8");
  const prompt = buildPrompt(contextPack, config);
  const response = await generateJSON<LLMStoryResponse>(prompt);

  if (!response.scenes?.length) {
    throw new Error("LLM returned no scenes");
  }

  const tokensPath = path.join(projectDir, "capture/extracted/tokens.json");
  let brandName = "Product";
  if (fs.existsSync(tokensPath)) {
    const tokens = JSON.parse(fs.readFileSync(tokensPath, "utf-8"));
    brandName = cleanBrandName(tokens.title);
  }

  return llmResponseToNarratorScripts(response, brandName, config);
}

// ---------------------------------------------------------------------------
// Template-based fallback (when no LLM API key is configured)
// ---------------------------------------------------------------------------

interface SectionCandidate {
  heading: string;
  text: string;
  type: string;
  ctas: string[];
  assets: string[];
  sceneType: string;
  role: string;
  persuasion: string;
}

function cleanBrandName(title: string): string {
  return title.split(/\s*[|–—-]\s*/)[0].replace(/[®™©]/g, "").trim() || title;
}

function stripTags(text: string): string {
  return cleanMarketingText(text);
}

function cleanMarketingText(text: string): string {
  return text
    .replace(/\[(?:\/)?[a-z][^\]]*\]/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\bOpens in a new window\b/gi, " ")
    .replace(/\bLog In Required\b/gi, " ")
    .replace(/\s+[,;:.!?]/g, (m) => m.trim())
    .replace(/\s{2,}/g, " ")
    .trim();
}

function isBoilerplateText(text: string): boolean {
  const cleaned = cleanMarketingText(text).toLowerCase();
  if (cleaned.length < 8) return true;
  return /^(skip to|home$|learn$|menu$|search$|customer service|customer support|accounts? & trade|portfolio|watchlist|terms|privacy|cookie|stay connected|more to explore)/i.test(cleaned);
}

function isBoilerplateSentence(text: string): boolean {
  const cleaned = cleanMarketingText(text);
  if (isBoilerplateText(cleaned)) return true;
  return /^(open an account|log in|fidelity\.com home|accounts? & trade|customer service|customer support|portfolio|watchlist|news & research)$/i.test(cleaned);
}

function trimToWords(text: string, maxWords: number): string {
  const words = cleanMarketingText(text).split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return `${words.slice(0, maxWords).join(" ")}.`;
}

function getPrimaryHeading(tokens: CaptureTokens): string {
  const headings = tokens.headings
    .map((h) => (typeof h === "string" ? h : h.text))
    .map(cleanMarketingText)
    .filter((h) => !isBoilerplateText(h));

  return headings.find((h) => h.length > 8) || cleanBrandName(tokens.title) || "The Story";
}

function titleFromHeading(heading: string, fallback: string): string {
  const cleaned = cleanMarketingText(heading);
  if (!isBoilerplateText(cleaned)) return cleaned.slice(0, 60);
  return fallback;
}

function extractSentences(text: string, max: number): string[] {
  const cleaned = stripTags(text);
  const raw = cleaned
    .split(/(?<=[.!?])\s+|(?<=\w)\s{2,}(?=[A-Z])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15 && s.length < 200)
    .filter((s) => !isBoilerplateSentence(s))
    .filter((s) => !s.match(
      /^(https?:|See footer|Terms apply|Cookie|Skip to|Content provided|Rate as of|Pebble uses|Commission-free|\*|Crypto services|Securities|The experience|Fidelity\.com Home)/i
    ))
    .filter((s) => !s.match(/may contain errors|not intended to provide|not indicative of/i));

  const proper = raw.filter((s) => /[.!?]$/.test(s));
  const source = proper.length >= max ? proper : raw;
  return source.slice(0, max);
}

function classifySection(section: CaptureTokens["sections"][0]): string {
  const heading = (section.heading || "").toLowerCase();
  const text = (section.text || "").toLowerCase();
  const sectionType = (section.type || "").toLowerCase();
  const ctas = (section.callsToAction || []).join(" ").toLowerCase();

  if (sectionType === "hero" || heading.match(/^(introducing|discover|welcome|the missing)/i))
    return "hook";
  if (heading.match(/saying|reviews?|testimonial|what people|what (?:our )?(?:users|customers)/))
    return "social-proof";
  if (heading.match(/security|protect|safe|trust|privacy/))
    return "trust";
  if (heading.match(/get started|download|sign up|try|join|go after|ready/i) || sectionType === "cta")
    return "cta";
  if (text.length < 150 && ctas.match(/download|get started|sign up|try free/))
    return "cta";
  if (sectionType === "features" || heading.match(/feature|what you get|how it works/))
    return "feature";
  if (text.match(/\d+[,.]?\d*\s*(?:stars?|downloads|users|customers|award|winner|finalist)/))
    return "social-proof";
  return "value-prop";
}

function deduplicateSections(
  sections: CaptureTokens["sections"]
): CaptureTokens["sections"] {
  const seen = new Set<string>();
  return sections.filter((s) => {
    const fp = `${(s.heading || "").slice(0, 40)}::${(s.text || "").slice(0, 80)}`;
    if (seen.has(fp)) return false;
    seen.add(fp);
    return true;
  });
}

function buildSectionCandidates(
  tokens: CaptureTokens,
  visibleText: string
): SectionCandidate[] {
  const sections = deduplicateSections(tokens.sections || []);
  const candidates: SectionCandidate[] = [];

  for (const section of sections) {
    if ((section.type || "").toLowerCase() === "footer") continue;
    if (!section.text || section.text.length < 30) continue;
    const heading = stripTags(section.heading || "");
    if (heading.length < 3 || isBoilerplateText(heading)) continue;

    const classification = classifySection(section);
    const sceneMap: Record<string, { type: string; role: string; persuasion: string }> = {
      hook: { type: "hook", role: "attention-capture", persuasion: "curiosity-gap" },
      "value-prop": { type: "value-prop", role: "value-framing", persuasion: "benefit-stacking" },
      feature: { type: "feature-showcase", role: "evidence", persuasion: "demonstration" },
      "social-proof": { type: "social-proof", role: "trust-building", persuasion: "social-validation" },
      trust: { type: "social-proof", role: "trust-building", persuasion: "authority" },
      cta: { type: "cta", role: "conversion-trigger", persuasion: "urgency-scarcity" },
    };
    const mapped = sceneMap[classification] || sceneMap["value-prop"];

    candidates.push({
      heading,
      text: cleanMarketingText(section.text),
      type: classification,
      ctas: (section.callsToAction || [])
        .map(cleanMarketingText)
        .filter((c) => c.length < 60 && !isBoilerplateText(c)),
      assets: section.assets || [],
      sceneType: mapped.type,
      role: mapped.role,
      persuasion: mapped.persuasion,
    });
  }

  if (candidates.length === 0 && visibleText.trim()) {
    const headings = tokens.headings.map((h) =>
      typeof h === "string" ? h : h.text
    ).map(cleanMarketingText).filter((h) => !isBoilerplateText(h));
    const lines = visibleText
      .split("\n")
      .map(stripTags)
      .filter((l) => l.length > 20 && !isBoilerplateSentence(l));
    const fallbackTypes = ["hook", "value-prop", "feature-showcase", "social-proof", "cta"];

    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const ft = fallbackTypes[i % fallbackTypes.length];
      candidates.push({
        heading: headings[i] || `Scene ${i + 1}`,
        text: lines.slice(i * 3, i * 3 + 3).join(". "),
        type: ft,
        ctas: [],
        assets: [],
        sceneType: ft,
        role: "evidence",
        persuasion: "demonstration",
      });
    }
  }

  return candidates;
}

function selectScenes(
  candidates: SectionCandidate[],
  sceneCount: number
): SectionCandidate[] {
  const byType = new Map<string, SectionCandidate[]>();
  for (const c of candidates) {
    const list = byType.get(c.type) || [];
    list.push(c);
    byType.set(c.type, list);
  }

  const pick = (type: string): SectionCandidate | null => {
    const list = byType.get(type);
    if (!list?.length) return null;
    return list.shift()!;
  };

  const selected: SectionCandidate[] = [];

  const hook = pick("hook") || candidates[0];
  if (hook) {
    hook.sceneType = "hook";
    hook.role = "attention-capture";
    hook.persuasion = "curiosity-gap";
    selected.push(hook);
  }

  const cta = pick("cta");
  const middleOrder = ["feature", "value-prop", "social-proof", "trust"];
  const middleCount = sceneCount - selected.length - (cta ? 1 : 0);

  for (let i = 0; i < middleCount; i++) {
    const preferredType = middleOrder[i % middleOrder.length];
    const scene = pick(preferredType)
      || pick("feature") || pick("value-prop") || pick("social-proof") || pick("trust");

    if (scene) {
      selected.push(scene);
    } else {
      const remaining = candidates.find((c) => !selected.includes(c) && c !== cta);
      if (remaining) selected.push(remaining);
    }
  }

  if (cta) {
    cta.sceneType = "cta";
    cta.role = "conversion-trigger";
    cta.persuasion = "urgency-scarcity";
    selected.push(cta);
  }

  return selected.slice(0, sceneCount);
}

function writeScript(
  candidate: SectionCandidate,
  brandName: string,
  tokens: CaptureTokens
): string {
  const sentences = extractSentences(candidate.text, 3);
  const primaryHeading = getPrimaryHeading(tokens);
  const description = cleanMarketingText(tokens.description || "");
  const descriptionSentences = extractSentences(description, 2);

  switch (candidate.sceneType) {
    case "hook": {
      if (descriptionSentences.length >= 2) return `${descriptionSentences[0]} ${descriptionSentences[1]}`;
      if (descriptionSentences.length === 1) return descriptionSentences[0];
      if (sentences.length >= 1) {
        return trimToWords(`${sentences[0]}${sentences[1] ? " " + sentences[1] : ""}`, 34);
      }
      return `Here is what to know about ${primaryHeading.toLowerCase()} from ${brandName}.`;
    }

    case "value-prop": {
      if (sentences.length >= 2) return trimToWords(`${sentences[0]} ${sentences[1]}`, 36);
      if (sentences.length === 1) return sentences[0];
      return `${brandName} helps make ${primaryHeading.toLowerCase()} easier to understand.`;
    }

    case "feature-showcase": {
      if (sentences.length >= 2) return trimToWords(`${sentences[0]} ${sentences[1]}`, 36);
      if (sentences.length === 1) return sentences[0];
      const features = candidate.ctas.filter((c) => c.length < 30 && !c.match(/^(learn more|get started|download)/i));
      if (features.length >= 2) {
        return `${brandName} gives you ${features.slice(0, 3).join(", ")}, and more — all in one place.`;
      }
      return `Powerful features designed to work the way you do.`;
    }

    case "social-proof": {
      const text = stripTags(candidate.text);
      const testimonialMatch = text.match(
        /(?:I['']ve|I have|This app|Very good|Really amazing|If you are)[^.!?]{20,180}[.!?]/
      );
      if (testimonialMatch) {
        const quote = testimonialMatch[0].slice(0, 150);
        return `"${quote}" That's what real users are saying about ${brandName}.`;
      }
      const statMatch = text.match(
        /(\d[\d,.]*\+?\s*(?:stars?|downloads?|app downloads|users|customers|million))/i
      );
      if (statMatch && sentences.length > 0) {
        return `${sentences[0]}`;
      }
      if (sentences.length > 0) return sentences[0];
      return `Trusted by thousands who've made the switch to ${brandName}.`;
    }

    case "cta": {
      const firstCta = tokens.ctas[0];
      const ctaText = firstCta
        ? cleanMarketingText(typeof firstCta === "string" ? firstCta : firstCta.text)
        : "Get started";
      if (sentences.length > 0 && sentences[0].length > 30) {
        return trimToWords(`${sentences[0]} ${ctaText} with ${brandName} today.`, 32);
      }
      return `${ctaText}. Start your journey with ${brandName} today.`;
    }

    default:
      return sentences[0] || `Learn more about ${brandName}.`;
  }
}

function buildPremise(tokens: CaptureTokens, brandName: string): string {
  if (tokens.description && tokens.description.length > 20) {
    const cleaned = cleanMarketingText(tokens.description);
    if (cleaned.length > 20) return cleaned;
  }
  const heading = getPrimaryHeading(tokens);
  if (heading.length > 0) return `${brandName} explains ${heading.toLowerCase()}.`;
  return `Learn what ${brandName} has to offer.`;
}

export function generateDraftNarratorScripts(
  projectDir: string,
  config: Partial<VideoConfig>
): NarratorScripts {
  const tokensPath = path.join(projectDir, "capture/extracted/tokens.json");
  let tokens: CaptureTokens = {
    title: "Product",
    description: "",
    colors: [],
    fonts: [],
    headings: [],
    ctas: [],
    sections: [],
  };

  if (fs.existsSync(tokensPath)) {
    tokens = JSON.parse(fs.readFileSync(tokensPath, "utf-8"));
  }

  const visibleTextPath = path.join(projectDir, "capture/extracted/visible-text.txt");
  let visibleText = "";
  if (fs.existsSync(visibleTextPath)) {
    visibleText = fs.readFileSync(visibleTextPath, "utf-8");
  }

  const brandName = cleanBrandName(tokens.title);
  const premise = buildPremise(tokens, brandName);

  const targetDuration = config.duration ?? 60;
  const sceneCount = targetDuration <= 30 ? 3 : targetDuration <= 60 ? 5 : 7;
  const sceneDuration = targetDuration / sceneCount;

  const orientation =
    config.aspectRatio === "9:16"
      ? "portrait"
      : config.aspectRatio === "1:1"
        ? "square"
        : "landscape";

  const candidates = buildSectionCandidates(tokens, visibleText);
  const selected = selectScenes(candidates, sceneCount);

  const scenes = selected.map((candidate, i) => {
    const script = writeScript(candidate, brandName, tokens);
    const fallbackHeadings = [
      getPrimaryHeading(tokens),
      "Key Takeaways",
      "How It Works",
      "Why It Matters",
      "Next Step",
    ];

    return {
      sceneNumber: i + 1,
      scene_id: `scene_${i + 1}`,
      heading: titleFromHeading(candidate.heading, fallbackHeadings[i] || `Scene ${i + 1}`),
      script,
      narrativeIntent: {
        type: candidate.sceneType,
        narrativeRole: candidate.role,
        keyMessage: candidate.heading.slice(0, 80),
        persuasion: candidate.persuasion,
        emotionalBeat:
          i === 0 ? "curiosity" : i === selected.length - 1 ? "determination" : "trust",
      },
      transition: {
        continuity: i === 0 ? "cold-open" : "thematic-bridge",
        intent: TRANSITION_INTENTS[i % TRANSITION_INTENTS.length],
      },
      estimatedDuration: Math.round(sceneDuration * 10) / 10,
    };
  });

  return {
    project: brandName.toLowerCase().replace(/\s+/g, "-"),
    premise,
    narrativeArchetype: "product-reveal",
    emotionalArc: "curiosity-trust-action",
    orientation,
    estimatedDuration: targetDuration,
    scenes,
  };
}

// ---------------------------------------------------------------------------
// Public API: try LLM first, fall back to templates
// ---------------------------------------------------------------------------

export async function generateNarratorScripts(
  projectDir: string,
  config: Partial<VideoConfig>
): Promise<NarratorScripts> {
  if (isLLMAvailable()) {
    try {
      return await generateLLMNarratorScripts(projectDir, config);
    } catch (err) {
      console.error("[story] LLM generation failed, falling back to templates:", err);
    }
  }
  return generateDraftNarratorScripts(projectDir, config);
}

export function normalizeNarratorScripts(scripts: NarratorScripts): NarratorScripts {
  const scenes = (scripts.scenes || []).map((scene, i) => {
    const sceneNumber = Number.isFinite(scene.sceneNumber) ? scene.sceneNumber : i + 1;
    const heading = cleanMarketingText(scene.heading || `Scene ${sceneNumber}`);
    const script = cleanMarketingText(scene.script || "");

    return {
      ...scene,
      sceneNumber,
      scene_id: scene.scene_id || `scene_${sceneNumber}`,
      heading: isBoilerplateText(heading) ? `Scene ${sceneNumber}` : heading,
      script,
      estimatedDuration: Number.isFinite(scene.estimatedDuration)
        ? scene.estimatedDuration
        : Math.round((scripts.estimatedDuration || 30) / Math.max(scripts.scenes.length, 1)),
    };
  });

  return {
    ...scripts,
    premise: cleanMarketingText(scripts.premise || ""),
    scenes,
  };
}

export function shouldRegenerateNarratorScripts(scripts: NarratorScripts): boolean {
  if (!scripts.premise || scripts.premise.trim().length < 20) return true;
  if (!scripts.scenes?.length) return true;

  return scripts.scenes.some((scene, i) => {
    const text = `${scene.heading || ""} ${scene.script || ""}`;
    return (
      !Number.isFinite(scene.sceneNumber) ||
      !scene.scene_id ||
      /\[[a-z][^\]]*\]/i.test(text) ||
      /Sundefined|undefined/i.test(text) ||
      isBoilerplateText(scene.heading || "") ||
      isBoilerplateSentence(scene.script || "") ||
      (i === 0 && /skip to main content|fidelity\.com home/i.test(scene.script || ""))
    );
  });
}

export function saveNarratorScripts(
  projectDir: string,
  scripts: NarratorScripts
): void {
  const normalized = normalizeNarratorScripts(scripts);
  fs.writeFileSync(
    path.join(projectDir, "narrator_scripts.json"),
    JSON.stringify(normalized, null, 2)
  );
}

export function loadNarratorScripts(
  projectDir: string
): NarratorScripts | null {
  const p = path.join(projectDir, "narrator_scripts.json");
  if (!fs.existsSync(p)) return null;
  return normalizeNarratorScripts(JSON.parse(fs.readFileSync(p, "utf-8")));
}
