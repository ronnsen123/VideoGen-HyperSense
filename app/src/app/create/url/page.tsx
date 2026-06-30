"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";

export default function UrlPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [projectId, setProjectId] = useState("");
  const [captureComplete, setCaptureComplete] = useState(false);
  const [tokens, setTokens] = useState<{
    title?: string;
    description?: string;
    colors?: string[];
    fonts?: (string | { family: string; weights?: number[]; variable?: boolean })[];
    headings?: (string | { level?: number; text: string; fontSize?: string; fontWeight?: string; color?: string })[];
    sections?: {
      heading?: string;
      text?: string;
      type?: string;
      layout?: string;
      backgroundColor?: string;
      callsToAction?: string[];
      assets?: string[];
    }[];
    ctas?: (string | { text: string; href?: string })[];
  } | null>(null);
  const [contentExpanded, setContentExpanded] = useState(false);
  const [screenshots, setScreenshots] = useState<string[]>([]);

  async function handleCapture() {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    setMessages([]);
    setPhase("Initializing...");

    try {
      const initRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!initRes.ok) {
        const data = await initRes.json();
        throw new Error(data.error || "Failed to init project");
      }

      const { id } = await initRes.json();
      setProjectId(id);
      sessionStorage.setItem("projectId", id);

      setPhase("Capturing website...");

      const captureRes = await fetch(`/api/projects/${id}/capture`, {
        method: "POST",
      });

      if (!captureRes.ok) throw new Error("Capture request failed");

      const reader = captureRes.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
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
                  throw new Error(event.error || "Capture failed");
                }
              } catch (e) {
                if (e instanceof Error && e.message !== "Capture failed") {
                  // ignore parse errors
                }
              }
            }
          }
        }
      }

      const projRes = await fetch(`/api/projects/${id}`);
      const projData = await projRes.json();
      setTokens(projData.tokens || null);
      setScreenshots(projData.screenshots || []);
      setCaptureComplete(true);
      setPhase("Capture complete!");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Step 1: Enter Website URL</h1>
        <p className="text-muted-foreground mt-1">
          Paste the URL of the product website you want to create a video for.
          We&apos;ll capture brand assets, colors, and content automatically.
        </p>
      </div>

      <div className="flex gap-3">
        <Input
          placeholder="https://www.example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
          className="flex-1"
          onKeyDown={(e) => e.key === "Enter" && handleCapture()}
        />
        <Button onClick={handleCapture} disabled={loading || !url.trim()}>
          {loading ? "Capturing..." : "Analyze Website"}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 text-destructive p-4 text-sm">
          {error}
        </div>
      )}

      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
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
            </div>
          </CardContent>
        </Card>
      )}

      {captureComplete && tokens && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Captured: {tokens.title || url}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {screenshots.length > 0 && (
              <div>
                <img
                  src={`/api/projects/${projectId}/assets/capture/screenshots/${screenshots[0]}`}
                  className="w-full rounded-lg border max-h-[300px] object-cover object-top"
                  alt="Captured site"
                />
                {screenshots.length > 1 && (
                  <div className="flex gap-2 mt-2 overflow-x-auto">
                    {screenshots.slice(1, 6).map((s, i) => (
                      <img
                        key={i}
                        src={`/api/projects/${projectId}/assets/capture/screenshots/${s}`}
                        className="h-16 rounded border object-cover object-top shrink-0"
                        alt={`Scroll position ${i + 2}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {tokens.colors && tokens.colors.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Brand Colors</p>
                <div className="flex gap-2 flex-wrap">
                  {tokens.colors.slice(0, 10).map((color, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 border rounded-full px-2 py-1"
                    >
                      <div
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs font-mono">{color}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tokens.fonts && tokens.fonts.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Fonts</p>
                <div className="flex gap-2 flex-wrap">
                  {tokens.fonts.slice(0, 5).map((font, i) => (
                    <Badge key={i} variant="secondary">
                      {typeof font === "string" ? font : font.family}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Extracted Content toggle */}
            <div className="border-t pt-4">
              <button
                type="button"
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
                onClick={() => setContentExpanded(!contentExpanded)}
              >
                {contentExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                Extracted Content
              </button>

              {contentExpanded && (
                <div className="mt-3 space-y-4">
                  {/* Description */}
                  {tokens.description && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        Description
                      </p>
                      <p className="text-sm leading-relaxed">
                        {tokens.description}
                      </p>
                    </div>
                  )}

                  {/* Headings */}
                  {tokens.headings && tokens.headings.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        Headings
                      </p>
                      <ul className="space-y-1">
                        {tokens.headings.map((h, i) => {
                          const text =
                            typeof h === "string" ? h : h.text;
                          const level =
                            typeof h === "string" ? undefined : h.level;
                          return (
                            <li
                              key={i}
                              className="text-sm flex items-start gap-2"
                            >
                              {level && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 shrink-0 mt-0.5"
                                >
                                  H{level}
                                </Badge>
                              )}
                              <span>{text}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {/* Page Sections */}
                  {tokens.sections && tokens.sections.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        Page Sections
                      </p>
                      <div className="space-y-2">
                        {tokens.sections.map((section, i) => (
                          <div
                            key={i}
                            className="rounded-md border p-3 text-sm space-y-1"
                          >
                            <div className="flex items-center gap-2">
                              {section.heading && (
                                <span className="font-medium">
                                  {section.heading}
                                </span>
                              )}
                              {section.type && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0"
                                >
                                  {section.type}
                                </Badge>
                              )}
                            </div>
                            {section.text && (
                              <p className="text-muted-foreground line-clamp-3">
                                {section.text}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CTAs */}
                  {tokens.ctas && tokens.ctas.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        Calls to Action
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {tokens.ctas.map((cta, i) => (
                          <Badge key={i} variant="secondary">
                            {typeof cta === "string" ? cta : cta.text}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Button
              className="w-full mt-4"
              onClick={() => router.push("/create/configure")}
            >
              Continue to Configure
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
