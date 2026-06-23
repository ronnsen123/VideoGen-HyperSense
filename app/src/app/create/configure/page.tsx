"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PRESETS } from "@/lib/pipeline/presets";

export default function ConfigurePage() {
  const router = useRouter();
  const [focus, setFocus] = useState("product-overall");
  const [duration, setDuration] = useState("60");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [preset, setPreset] = useState("auto");

  const [saving, setSaving] = useState(false);

  async function handleNext() {
    const config = {
      focus,
      duration: parseInt(duration),
      aspectRatio,
      preset,
    };
    sessionStorage.setItem("videoConfig", JSON.stringify(config));

    const projectId = sessionStorage.getItem("projectId");
    if (projectId) {
      setSaving(true);
      try {
        await fetch(`/api/projects/${projectId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ config, status: "configuring" }),
        });
        if (preset !== "auto") {
          await fetch(`/api/projects/${projectId}/design-system`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ preset }),
          });
        }
      } catch {
        // non-fatal
      } finally {
        setSaving(false);
      }
    }
    router.push("/create/story");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Step 2: Configure Video</h1>
        <p className="text-muted-foreground mt-1">
          Choose the video focus, duration, aspect ratio, and visual style.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6 space-y-3">
            <Label className="text-sm font-semibold">Video Focus</Label>
            <RadioGroup value={focus} onValueChange={setFocus}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="product-overall" id="f1" />
                <Label htmlFor="f1">Product Overall</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="headline-feature" id="f2" />
                <Label htmlFor="f2">Headline Feature</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="offer-cta" id="f3" />
                <Label htmlFor="f3">Offer & CTA</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Label className="text-sm font-semibold">Duration</Label>
            <RadioGroup value={duration} onValueChange={setDuration}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="30" id="d1" />
                <Label htmlFor="d1">~30 seconds</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="60" id="d2" />
                <Label htmlFor="d2">~60 seconds</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="90" id="d3" />
                <Label htmlFor="d3">~90 seconds</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Label className="text-sm font-semibold">Aspect Ratio</Label>
            <RadioGroup value={aspectRatio} onValueChange={setAspectRatio}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="16:9" id="a1" />
                <Label htmlFor="a1">16:9 Landscape</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="9:16" id="a2" />
                <Label htmlFor="a2">9:16 Portrait</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1:1" id="a3" />
                <Label htmlFor="a3">1:1 Square</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      </div>

      <div>
        <Label className="text-sm font-semibold">Visual Style Preset</Label>
        <p className="text-sm text-muted-foreground mb-3">
          Choose &quot;Auto&quot; to let the system infer the best style from
          the captured website, or pick one manually.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <button
            onClick={() => setPreset("auto")}
            className={cn(
              "p-4 rounded-lg border-2 text-left transition-colors",
              preset === "auto"
                ? "border-primary bg-primary/5"
                : "border-muted hover:border-primary/50"
            )}
          >
            <div className="font-semibold text-sm">Auto-Detect</div>
            <div className="text-xs text-muted-foreground mt-1">
              Inferred from website
            </div>
          </button>

          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPreset(p.id)}
              className={cn(
                "p-4 rounded-lg border-2 text-left transition-colors",
                preset === p.id
                  ? "border-primary bg-primary/5"
                  : "border-muted hover:border-primary/50"
              )}
            >
              <div className="font-semibold text-sm">{p.label}</div>
              <div className="flex gap-1 mt-2 flex-wrap">
                {p.bestFor.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                    {tag}
                  </Badge>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.push("/create/url")}>
          Back
        </Button>
        <Button onClick={handleNext} disabled={saving}>
          {saving ? "Saving..." : "Continue to Story"}
        </Button>
      </div>
    </div>
  );
}
