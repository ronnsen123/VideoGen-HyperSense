"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface PhaseStatus {
  name: string;
  label: string;
  status: "pending" | "running" | "completed" | "error";
  message?: string;
  progress?: number;
}

const PHASES: { name: string; label: string }[] = [
  { name: "prep", label: "Prepare Scenes" },
  { name: "scenes", label: "Generate Compositions" },
  { name: "assembly", label: "Assemble Timeline" },
  { name: "render", label: "Render Video" },
];

export default function GeneratePage() {
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [phases, setPhases] = useState<PhaseStatus[]>(
    PHASES.map((p) => ({ ...p, status: "pending" }))
  );
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const projectId =
    typeof window !== "undefined"
      ? sessionStorage.getItem("projectId")
      : null;

  async function handleGenerate() {
    if (!projectId) return;
    setStarted(true);
    setError("");

    try {
      const res = await fetch(`/api/projects/${projectId}/generate`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Generate request failed");

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
                setPhases((prev) =>
                  prev.map((p) =>
                    p.name === event.phase
                      ? {
                          ...p,
                          status: event.status,
                          message: event.message || p.message,
                          progress: event.progress,
                        }
                      : p
                  )
                );
                if (
                  event.phase === "done" &&
                  event.status === "completed"
                ) {
                  setDone(true);
                }
                if (event.status === "error") {
                  setError(event.error || "Generation failed");
                }
              } catch {
                // ignore
              }
            }
          }
        }
      }

      if (!done) setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Step 6: Generate & Render</h1>
        <p className="text-muted-foreground mt-1">
          Generate scene compositions, assemble the timeline, and render the
          final video.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 text-destructive p-4 text-sm">
          {error}
        </div>
      )}

      {!started && (
        <Button onClick={handleGenerate} size="lg" className="w-full">
          Start Generation
        </Button>
      )}

      {started && (
        <div className="space-y-3">
          {phases.map((phase) => (
            <Card key={phase.name}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full shrink-0",
                      phase.status === "pending" && "bg-muted",
                      phase.status === "running" && "bg-primary animate-pulse",
                      phase.status === "completed" && "bg-green-500",
                      phase.status === "error" && "bg-destructive"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{phase.label}</div>
                    {phase.message && (
                      <div className="text-xs text-muted-foreground truncate mt-0.5">
                        {phase.message}
                      </div>
                    )}
                  </div>
                  {phase.status === "completed" && (
                    <span className="text-green-500 text-sm">Done</span>
                  )}
                </div>
                {phase.name === "render" &&
                  phase.status === "running" &&
                  phase.progress != null && (
                    <Progress value={phase.progress} className="mt-2 h-2" />
                  )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => router.push("/create/design")}
          disabled={started && !done}
        >
          Back
        </Button>
        <Button
          onClick={() => router.push("/create/result")}
          disabled={!done}
        >
          View Result
        </Button>
      </div>
    </div>
  );
}
