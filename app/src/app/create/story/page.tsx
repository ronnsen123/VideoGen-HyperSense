"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { NarratorScripts } from "@/lib/pipeline/types";

const SCENE_TYPE_META: Record<string, { label: string; icon: string; description: string }> = {
  hook: { label: "Hook", icon: "⚡", description: "Grab attention" },
  "value-prop": { label: "Value", icon: "💎", description: "Show the benefit" },
  "feature-showcase": { label: "Feature", icon: "🔍", description: "Demonstrate a capability" },
  "social-proof": { label: "Proof", icon: "📊", description: "Build trust" },
  cta: { label: "CTA", icon: "🎯", description: "Drive action" },
};

const SCENE_TYPES = ["hook", "value-prop", "feature-showcase", "social-proof", "cta"];

const DURATION_OPTIONS = [8, 10, 12, 15, 20];

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(0)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function StoryPage() {
  const router = useRouter();
  const [scripts, setScripts] = useState<NarratorScripts | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const projectId =
    typeof window !== "undefined"
      ? sessionStorage.getItem("projectId")
      : null;

  const loadScripts = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/story`);
      if (!res.ok) throw new Error("Failed to load scripts");
      const data = await res.json();
      if (!data.premise) data.premise = "";
      setScripts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadScripts();
  }, [loadScripts]);

  function updatePremise(value: string) {
    if (!scripts) return;
    setScripts({ ...scripts, premise: value });
  }

  function updateScene(index: number, field: string, value: string | number) {
    if (!scripts) return;
    const updated = { ...scripts };
    updated.scenes = [...updated.scenes];
    if (field === "type") {
      updated.scenes[index] = {
        ...updated.scenes[index],
        narrativeIntent: {
          ...updated.scenes[index].narrativeIntent,
          type: value as string,
        },
      };
    } else {
      updated.scenes[index] = {
        ...updated.scenes[index],
        [field]: value,
      };
    }
    setScripts(updated);
  }

  function removeScene(index: number) {
    if (!scripts || scripts.scenes.length <= 2) return;
    const updated = { ...scripts };
    updated.scenes = updated.scenes.filter((_, i) => i !== index);
    updated.scenes = updated.scenes.map((s, i) => ({
      ...s,
      sceneNumber: i + 1,
      scene_id: `scene_${i + 1}`,
    }));
    setScripts(updated);
  }

  function addScene() {
    if (!scripts) return;
    const n = scripts.scenes.length + 1;
    const updated = { ...scripts };
    updated.scenes = [
      ...updated.scenes,
      {
        sceneNumber: n,
        scene_id: `scene_${n}`,
        heading: `Scene ${n}`,
        script: "",
        narrativeIntent: {
          type: "feature-showcase",
          narrativeRole: "evidence",
          keyMessage: "",
          persuasion: "demonstration",
          emotionalBeat: "trust",
        },
        transition: {
          continuity: "thematic-bridge",
          intent: "dissolve",
        },
        estimatedDuration: 12,
      },
    ];
    setScripts(updated);
  }

  function moveScene(from: number, to: number) {
    if (!scripts || to < 0 || to >= scripts.scenes.length) return;
    const updated = { ...scripts };
    const scenes = [...updated.scenes];
    const [moved] = scenes.splice(from, 1);
    scenes.splice(to, 0, moved);
    updated.scenes = scenes.map((s, i) => ({
      ...s,
      sceneNumber: i + 1,
      scene_id: `scene_${i + 1}`,
    }));
    setScripts(updated);
  }

  async function handleSave() {
    if (!projectId || !scripts) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/story`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scripts),
      });
      if (!res.ok) throw new Error("Failed to save");
      router.push("/create/audio");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  const totalDuration = scripts?.scenes.reduce((sum, s) => sum + s.estimatedDuration, 0) ?? 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading narrator scripts...</div>
      </div>
    );
  }

  if (!scripts) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-lg bg-destructive/10 text-destructive p-4">
          {error || "No project found. Please start from Step 1."}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Step 3: Shape Your Story</h1>
        <p className="text-muted-foreground mt-1">
          Edit the narrative for your video. Each scene becomes a segment with
          its own voiceover and visuals.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 text-destructive p-4 text-sm">
          {error}
        </div>
      )}

      {/* Premise */}
      <Card>
        <CardContent className="pt-6">
          <Label className="text-sm font-semibold">Video Premise</Label>
          <p className="text-xs text-muted-foreground mt-0.5 mb-2">
            The one-liner that anchors the entire video. What is this about?
          </p>
          <Textarea
            value={scripts.premise || ""}
            onChange={(e) => updatePremise(e.target.value)}
            rows={2}
            className="resize-none"
            placeholder="e.g. Plynk is the investing app that makes it easy for beginners to start investing."
          />
        </CardContent>
      </Card>

      {/* Duration bar */}
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Pacing</span>
            <span className="text-sm tabular-nums font-semibold">
              {formatDuration(totalDuration)} total
            </span>
          </div>
          <div className="flex h-6 rounded-full overflow-hidden border">
            {scripts.scenes.map((scene, i) => {
              const pct = totalDuration > 0
                ? (scene.estimatedDuration / totalDuration) * 100
                : 100 / scripts.scenes.length;
              const meta = SCENE_TYPE_META[scene.narrativeIntent.type];
              return (
                <div
                  key={scene.scene_id}
                  className="flex items-center justify-center text-[10px] font-medium text-primary-foreground bg-primary transition-all"
                  style={{
                    flexBasis: `${Math.max(pct, 3)}%`,
                    opacity: 1 - i * 0.12,
                  }}
                  title={`Scene ${scene.sceneNumber}: ${meta?.label || scene.narrativeIntent.type} (${scene.estimatedDuration}s)`}
                >
                  {pct > 10 ? `S${scene.sceneNumber}` : ""}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Scenes */}
      <div className="space-y-4">
        {scripts.scenes.map((scene, i) => {
          const meta = SCENE_TYPE_META[scene.narrativeIntent.type] || {
            label: scene.narrativeIntent.type,
            icon: "📄",
            description: "",
          };
          return (
            <Card key={scene.scene_id} className="relative">
              <CardContent className="pt-5 pb-5">
                {/* Scene header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                    {scene.sceneNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {SCENE_TYPES.map((t) => {
                        const tm = SCENE_TYPE_META[t];
                        const active = scene.narrativeIntent.type === t;
                        return (
                          <button
                            key={t}
                            onClick={() => updateScene(i, "type", t)}
                            className={cn(
                              "text-xs px-2.5 py-1 rounded-full border transition-colors",
                              active
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-transparent text-muted-foreground border-muted hover:border-primary/50"
                            )}
                          >
                            {tm?.icon} {tm?.label || t}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {meta.description}
                    </p>
                  </div>
                </div>

                {/* Script */}
                <div className="mb-3">
                  <Label className="text-xs text-muted-foreground">
                    Narrator says
                  </Label>
                  <Textarea
                    value={scene.script}
                    onChange={(e) => updateScene(i, "script", e.target.value)}
                    rows={2}
                    className="mt-1 resize-none"
                    placeholder="What should the narrator say in this scene?"
                  />
                </div>

                {/* Heading + Duration + Actions */}
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">
                      On-screen title
                    </Label>
                    <input
                      type="text"
                      value={scene.heading}
                      onChange={(e) => updateScene(i, "heading", e.target.value)}
                      className="mt-1 w-full text-sm border rounded-md px-3 py-1.5 bg-background"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Duration
                    </Label>
                    <div className="flex gap-1 mt-1">
                      {DURATION_OPTIONS.map((d) => (
                        <button
                          key={d}
                          onClick={() => updateScene(i, "estimatedDuration", d)}
                          className={cn(
                            "text-xs px-2 py-1.5 rounded border transition-colors tabular-nums",
                            scene.estimatedDuration === d
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-transparent text-muted-foreground border-muted hover:border-primary/50"
                          )}
                        >
                          {d}s
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Scene actions */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                  <button
                    onClick={() => moveScene(i, i - 1)}
                    disabled={i === 0}
                    className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ↑ Move up
                  </button>
                  <button
                    onClick={() => moveScene(i, i + 1)}
                    disabled={i === scripts.scenes.length - 1}
                    className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ↓ Move down
                  </button>
                  <div className="flex-1" />
                  <button
                    onClick={() => removeScene(i)}
                    disabled={scripts.scenes.length <= 2}
                    className="text-xs text-destructive hover:text-destructive/80 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Remove
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        <button
          onClick={addScene}
          className="w-full py-3 rounded-lg border-2 border-dashed text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
        >
          + Add Scene
        </button>
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => router.push("/create/configure")}
        >
          Back
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Approve & Continue"}
        </Button>
      </div>
    </div>
  );
}
