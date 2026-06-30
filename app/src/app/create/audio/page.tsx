"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface AudioMeta {
  tts_provider: string;
  voice_id: string;
  bgm_enabled: boolean;
  total_duration_s: number;
  scenes: Record<
    string,
    { voicePath: string; voiceDuration: number; wordsPath?: string }
  >;
}

interface NarratorScene {
  sceneNumber: number;
  scene_id: string;
  heading: string;
  script: string;
  estimatedDuration: number;
}

interface SceneAudio {
  sceneId: string;
  sceneNumber: number;
  heading: string;
  duration: number;
  voicePath: string;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const BAR_COLORS = [
  "bg-primary",
  "bg-primary/85",
  "bg-primary/70",
  "bg-primary/55",
  "bg-primary/40",
  "bg-primary/30",
  "bg-primary/25",
];

export default function AudioPage() {
  const router = useRouter();
  const [voice, setVoice] = useState("am_michael");
  const [noBgm, setNoBgm] = useState(true);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const [audioMeta, setAudioMeta] = useState<AudioMeta | null>(null);
  const [sceneAudios, setSceneAudios] = useState<SceneAudio[]>([]);

  const projectId =
    typeof window !== "undefined"
      ? sessionStorage.getItem("projectId")
      : null;

  const fetchAudioResults = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      const data = await res.json();
      const meta: AudioMeta | undefined = data.audioMeta;
      const narrator: { scenes: NarratorScene[] } | undefined =
        data.narratorScripts;

      if (meta) {
        setAudioMeta(meta);
        if (narrator?.scenes) {
          const merged: SceneAudio[] = narrator.scenes.map((scene) => {
            const sceneMeta = meta.scenes[scene.scene_id];
            return {
              sceneId: scene.scene_id,
              sceneNumber: scene.sceneNumber,
              heading: scene.heading,
              duration: sceneMeta?.voiceDuration ?? scene.estimatedDuration,
              voicePath: sceneMeta?.voicePath ?? "",
            };
          });
          setSceneAudios(merged);
        }
      }
    } catch {
      // non-critical — players just won't show
    }
  }, [projectId]);

  useEffect(() => {
    if (!done || !projectId) return;
    const timer = window.setTimeout(() => {
      void fetchAudioResults();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [done, projectId, fetchAudioResults]);

  async function handleGenerate() {
    if (!projectId) return;
    setLoading(true);
    setError("");
    setMessages([]);
    setPhase("Starting audio generation...");

    try {
      const res = await fetch(`/api/projects/${projectId}/audio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voice, noBgm }),
      });

      if (!res.ok) throw new Error("Audio request failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let buffer = "";
        while (true) {
          const { done: readerDone, value } = await reader.read();
          if (readerDone) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const event = JSON.parse(line.slice(6));
                if (event.message) {
                  setPhase(event.message);
                  setMessages((prev) => [...prev.slice(-20), event.message]);
                }
                if (event.status === "error") {
                  setError(event.error || "Audio failed");
                }
              } catch {
                // ignore JSON parse errors
              }
            }
          }
        }
      }

      setDone(true);
      setPhase("Audio generation complete!");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Step 4: Voice & Audio</h1>
        <p className="text-muted-foreground mt-1">
          Configure the voiceover settings and generate audio from your narrator
          scripts.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 text-destructive p-4 text-sm">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label className="text-sm font-semibold">Voice</Label>
            <Input
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              placeholder="am_michael"
              className="mt-1 max-w-xs"
              disabled={loading || done}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Default: am_michael (local Kokoro). Other voices depend on your
              TTS provider.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={!noBgm}
              onCheckedChange={(checked) => setNoBgm(!checked)}
              disabled={loading || done}
            />
            <Label className="text-sm">
              Background music {noBgm ? "(off)" : "(on)"}
            </Label>
          </div>

          {!done && (
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Generating..." : "Generate Audio"}
            </Button>
          )}
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium">{phase}</span>
            </div>
            <div className="max-h-40 overflow-y-auto text-xs text-muted-foreground space-y-0.5">
              {messages.slice(-10).map((m, i) => (
                <div key={i} className="font-mono truncate">
                  {m}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {done && audioMeta && (
        <>
          {/* Summary card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold tabular-nums">
                  {formatDuration(audioMeta.total_duration_s)}
                </span>
                <span className="text-muted-foreground text-sm">
                  total · {sceneAudios.length} scene
                  {sceneAudios.length !== 1 ? "s" : ""}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {audioMeta.tts_provider} · {audioMeta.voice_id} ·{" "}
                {audioMeta.bgm_enabled ? "BGM on" : "No BGM"}
              </p>
            </CardContent>
          </Card>

          {/* Duration bar */}
          {sceneAudios.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm font-medium mb-3">Scene Pacing</p>
                <div className="flex h-8 rounded-full overflow-hidden border">
                  {sceneAudios.map((scene, i) => {
                    const pct =
                      (scene.duration / audioMeta.total_duration_s) * 100;
                    return (
                      <div
                        key={scene.sceneId}
                        className={`${BAR_COLORS[i % BAR_COLORS.length]} flex items-center justify-center text-[10px] font-medium text-primary-foreground transition-all`}
                        style={{ flexBasis: `${Math.max(pct, 2)}%` }}
                        title={`Scene ${scene.sceneNumber}: ${scene.heading} (${formatDuration(scene.duration)})`}
                      >
                        {pct > 8 ? `S${scene.sceneNumber}` : ""}
                      </div>
                    );
                  })}
                </div>
                <div className="flex mt-1.5">
                  {sceneAudios.map((scene) => {
                    const pct =
                      (scene.duration / audioMeta.total_duration_s) * 100;
                    return (
                      <div
                        key={scene.sceneId}
                        className="text-[10px] text-muted-foreground text-center truncate"
                        style={{ flexBasis: `${Math.max(pct, 2)}%` }}
                      >
                        {formatDuration(scene.duration)}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Per-scene audio players */}
          {sceneAudios.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Scene Audio</p>
              {sceneAudios.map((scene) => (
                <Card key={scene.sceneId}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium truncate pr-4">
                        Scene {scene.sceneNumber} · {scene.heading}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                        {formatDuration(scene.duration)}
                      </span>
                    </div>
                    {scene.voicePath && (
                      <audio
                        controls
                        className="w-full h-8"
                        src={`/api/projects/${projectId}/assets/${scene.voicePath}`}
                        preload="none"
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.push("/create/story")}>
          Back
        </Button>
        <div className="flex gap-2">
          {!done && !loading && (
            <Button
              variant="outline"
              onClick={() => router.push("/create/design")}
            >
              Skip Audio
            </Button>
          )}
          <Button
            onClick={() => router.push("/create/design")}
            disabled={!done}
          >
            Continue to Visual Plan
          </Button>
        </div>
      </div>
    </div>
  );
}
