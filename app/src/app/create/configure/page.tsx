"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Clock3,
  Monitor,
  RectangleVertical,
  Sparkles,
  Square,
  Target,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PRESETS } from "@/lib/pipeline/presets";

const GOALS = [
  {
    value: "product-overall",
    label: "Balanced",
    detail: "Best default",
    icon: Sparkles,
  },
  {
    value: "headline-feature",
    label: "Feature",
    detail: "Show one thing",
    icon: Target,
  },
  {
    value: "offer-cta",
    label: "Conversion",
    detail: "Drive action",
    icon: ArrowRight,
  },
];

const DURATIONS = [
  { value: "30", label: "30s", detail: "Fast social cut" },
  { value: "60", label: "60s", detail: "Standard promo" },
  { value: "90", label: "90s", detail: "More detail" },
];

const FORMATS = [
  { value: "16:9", label: "Wide", detail: "YouTube, web", icon: Monitor },
  { value: "9:16", label: "Vertical", detail: "Reels, TikTok", icon: RectangleVertical },
  { value: "1:1", label: "Square", detail: "Feed posts", icon: Square },
];

export default function ConfigurePage() {
  const router = useRouter();
  const [focus, setFocus] = useState("product-overall");
  const [duration, setDuration] = useState("30");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [preset, setPreset] = useState("auto");
  const [showAdvanced, setShowAdvanced] = useState(false);
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
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Step 2: Setup</h1>
          <p className="mt-1 text-muted-foreground">
            Start with the recommended promo settings. Adjust only what matters.
          </p>
        </div>
        <div className="hidden rounded-lg border px-3 py-2 text-right sm:block">
          <div className="text-xs text-muted-foreground">Recommended</div>
          <div className="text-sm font-semibold">30s wide promo</div>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-6 pt-6">
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Target className="size-4" />
              Goal
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {GOALS.map((option) => {
                const Icon = option.icon;
                const active = focus === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFocus(option.value)}
                    className={cn(
                      "flex min-h-20 flex-col items-start justify-between rounded-lg border p-3 text-left transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/50 hover:bg-muted"
                    )}
                  >
                    <Icon className="size-4" />
                    <span>
                      <span className="block text-sm font-semibold">
                        {option.label}
                      </span>
                      <span
                        className={cn(
                          "block text-xs",
                          active
                            ? "text-primary-foreground/75"
                            : "text-muted-foreground"
                        )}
                      >
                        {option.detail}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Clock3 className="size-4" />
              Length
            </div>
            <div className="grid grid-cols-3 gap-2">
              {DURATIONS.map((option) => {
                const active = duration === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDuration(option.value)}
                    className={cn(
                      "rounded-lg border px-3 py-3 text-left transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/50 hover:bg-muted"
                    )}
                  >
                    <span className="block text-sm font-semibold">
                      {option.label}
                    </span>
                    <span
                      className={cn(
                        "block text-xs",
                        active
                          ? "text-primary-foreground/75"
                          : "text-muted-foreground"
                      )}
                    >
                      {option.detail}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Monitor className="size-4" />
              Format
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {FORMATS.map((option) => {
                const Icon = option.icon;
                const active = aspectRatio === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setAspectRatio(option.value)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/50 hover:bg-muted"
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span>
                      <span className="block text-sm font-semibold">
                        {option.label}
                      </span>
                      <span
                        className={cn(
                          "block text-xs",
                          active
                            ? "text-primary-foreground/75"
                            : "text-muted-foreground"
                        )}
                      >
                        {option.detail}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </CardContent>
      </Card>

      <div className="rounded-lg border bg-muted/20 p-4">
        <button
          type="button"
          onClick={() => setShowAdvanced((value) => !value)}
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Wand2 className="size-4" />
            Visual style
          </span>
          <span className="text-xs text-muted-foreground">
            {preset === "auto"
              ? "Auto-detect"
              : PRESETS.find((item) => item.id === preset)?.label}
          </span>
        </button>

        {showAdvanced && (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Auto uses the captured site colors, typography, and layout cues.
            </p>
            <Select
              value={preset}
              onValueChange={(value) => value && setPreset(value)}
            >
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto-detect</SelectItem>
                {PRESETS.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.push("/create/url")}>
          Back
        </Button>
        <Button onClick={handleNext} disabled={saving}>
          {saving ? "Saving..." : "Continue"}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
