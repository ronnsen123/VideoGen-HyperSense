"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type {
  NarratorScripts,
  NarratorScene,
  AudioMeta,
  AudioSceneMeta,
} from "@/lib/pipeline/types";

const SCENE_LAYOUTS: Record<string, { layout: string; components: string; effects: string }> = {
  hook: {
    layout: "Centered hero composition",
    components: "Logo, display headline, chip, floating pills, radial glows",
    effects: "Center-outward expansion",
  },
  "value-prop": {
    layout: "Three pillar-cards in row",
    components: "Pillar cards with icons, section chip, radial glow",
    effects: "Staggered card reveal",
  },
  "feature-showcase": {
    layout: "Asymmetric two-column",
    components: "Headline + body left, visual frames right, chip",
    effects: "Split-tilt card entry",
  },
  "social-proof": {
    layout: "2x2 stat-counter grid",
    components: "Stat counter tiles with numerals and accent bars",
    effects: "Counting scale animation",
  },
  cta: {
    layout: "Full-width centered closing",
    components: "Display headline, logo, CTA chip, floating pills",
    effects: "Center-outward lockup reveal",
  },
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface StoryboardScene {
  scene: NarratorScene;
  audio: AudioSceneMeta | null;
  duration: number;
  startTime: number;
  screenshot: string | null;
  visual: { layout: string; components: string; effects: string };
}

export default function DesignPage() {
  const router = useRouter();
  const [rawPlan, setRawPlan] = useState("");
  const [storyboard, setStoryboard] = useState<StoryboardScene[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showRaw, setShowRaw] = useState(false);
  const [brandColor, setBrandColor] = useState("#26A68A");
  const [totalDuration, setTotalDuration] = useState(0);

  const projectId =
    typeof window !== "undefined"
      ? sessionStorage.getItem("projectId")
      : null;

  const loadPlan = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/design`);
      if (!res.ok) throw new Error("Failed to load visual plan");
      const data = await res.json();

      setRawPlan(data.content || "");
      setBrandColor(data.brandPrimary || "#26A68A");

      const narrator: NarratorScripts | null = data.narratorScripts;
      const audio: AudioMeta | null = data.audioMeta;
      const screenshots: string[] = data.screenshots || [];

      if (narrator) {
        let cumTime = 0;
        const scenes: StoryboardScene[] = narrator.scenes.map((scene, i) => {
          const scenAudio = audio?.scenes?.[scene.scene_id] || null;
          const duration = scenAudio?.voiceDuration ?? scene.estimatedDuration;
          const startTime = cumTime;
          cumTime += duration;

          const screenshotIdx = Math.min(
            Math.floor((i / narrator.scenes.length) * screenshots.length),
            screenshots.length - 1
          );
          const screenshot =
            screenshots.length > 0 ? screenshots[screenshotIdx] : null;

          const visual =
            SCENE_LAYOUTS[scene.narrativeIntent.type] || SCENE_LAYOUTS["hook"];

          return { scene, audio: scenAudio, duration, startTime, screenshot, visual };
        });

        setStoryboard(scenes);
        setTotalDuration(cumTime);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPlan();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadPlan]);

  async function handleSave() {
    if (!projectId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/design`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: rawPlan }),
      });
      if (!res.ok) throw new Error("Failed to save");
      router.push("/create/generate");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading visual plan...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Step 5: Visual Storyboard</h1>
          <p className="text-muted-foreground mt-1">
            Review the visual direction for each scene before generating.
          </p>
        </div>
        {totalDuration > 0 && (
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold tabular-nums">
              {formatTime(totalDuration)}
            </div>
            <div className="text-xs text-muted-foreground">
              {storyboard.length} scenes
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 text-destructive p-4 text-sm">
          {error}
        </div>
      )}

      {/* Timeline bar */}
      {storyboard.length > 0 && (
        <div className="flex h-2 rounded-full overflow-hidden border">
          {storyboard.map((sb, i) => {
            const pct =
              totalDuration > 0
                ? (sb.duration / totalDuration) * 100
                : 100 / storyboard.length;
            return (
              <div
                key={sb.scene.scene_id}
                className="transition-all"
                style={{
                  flexBasis: `${Math.max(pct, 3)}%`,
                  backgroundColor: brandColor,
                  opacity: 1 - i * 0.12,
                }}
                title={`S${sb.scene.sceneNumber} (${sb.duration.toFixed(1)}s)`}
              />
            );
          })}
        </div>
      )}

      {/* Storyboard frames */}
      <div className="space-y-4">
        {storyboard.map((sb) => (
          <Card key={sb.scene.scene_id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex">
                {/* Left: screenshot frame + timestamp */}
                <div className="shrink-0 w-52 bg-muted/30 relative">
                  {sb.screenshot && projectId ? (
                    <img
                      src={`/api/projects/${projectId}/assets/capture/screenshots/${sb.screenshot}`}
                      alt={`Scene ${sb.scene.sceneNumber}`}
                      className="w-full aspect-video object-cover object-top"
                    />
                  ) : (
                    <div
                      className="w-full aspect-video flex items-center justify-center"
                      style={{ backgroundColor: `${brandColor}15` }}
                    >
                      <span className="text-3xl font-bold text-muted-foreground/30">
                        S{sb.scene.sceneNumber}
                      </span>
                    </div>
                  )}
                  {/* Timestamp overlay */}
                  <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-2 py-1 bg-black/60 text-white text-[10px] font-mono tabular-nums">
                    <span>{formatTime(sb.startTime)}</span>
                    <span>{sb.duration.toFixed(1)}s</span>
                    <span>{formatTime(sb.startTime + sb.duration)}</span>
                  </div>
                </div>

                {/* Right: scene info */}
                <div className="flex-1 min-w-0 p-4">
                  {/* Scene header row */}
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: brandColor }}
                    >
                      {sb.scene.sceneNumber}
                    </div>
                    <span className="text-sm font-semibold truncate">
                      {sb.scene.heading}
                    </span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 text-white"
                      style={{ backgroundColor: brandColor, opacity: 0.8 }}
                    >
                      {sb.scene.narrativeIntent.type}
                    </span>
                  </div>

                  {/* Voiceover */}
                  <div className="mb-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">
                      Voiceover
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      &ldquo;{sb.scene.script}&rdquo;
                    </p>
                  </div>

                  {/* Audio player */}
                  {sb.audio?.voicePath && projectId && (
                    <div className="mb-3">
                      <audio
                        controls
                        className="h-7 w-full max-w-xs"
                        src={`/api/projects/${projectId}/assets/${sb.audio.voicePath}`}
                      />
                    </div>
                  )}

                  {/* Visual direction */}
                  <div className="grid grid-cols-3 gap-3 text-[11px]">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">
                        Layout
                      </div>
                      <div className="text-foreground/70">{sb.visual.layout}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">
                        Components
                      </div>
                      <div className="text-foreground/70">{sb.visual.components}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">
                        Motion
                      </div>
                      <div className="text-foreground/70">{sb.visual.effects}</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Raw plan toggle */}
      <div>
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showRaw ? "Hide" : "Show"} raw plan (markdown)
        </button>
        {showRaw && (
          <Card className="mt-2">
            <CardContent className="pt-4">
              <Textarea
                value={rawPlan}
                onChange={(e) => setRawPlan(e.target.value)}
                className="font-mono text-sm min-h-[300px]"
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer nav */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.push("/create/audio")}>
          Back
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Approve & Generate"}
        </Button>
      </div>
    </div>
  );
}
