import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen">
      <main className="flex flex-col items-center gap-8 text-center max-w-2xl px-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-5xl font-bold tracking-tight">
            HyperSense Video Creator
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Turn any website into a polished product launch video. Paste a URL,
            customize the style and story, and render an MP4 — all from your
            browser.
          </p>
        </div>

        <div className="flex flex-col gap-3 items-center">
          <Link href="/create/url">
            <Button size="lg" className="text-lg px-8 py-6 rounded-full">
              Create a Video
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground">
            Capture &rarr; Design &rarr; Story &rarr; Audio &rarr; Render
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6 mt-8 text-left">
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold">1. Capture</h3>
            <p className="text-sm text-muted-foreground">
              Extract brand colors, fonts, assets, and copy from any website
              automatically.
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold">2. Customize</h3>
            <p className="text-sm text-muted-foreground">
              Choose a visual style preset, edit the narration script, and
              configure voice & audio.
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold">3. Render</h3>
            <p className="text-sm text-muted-foreground">
              Generate scene compositions and render to a 1080p MP4 video in
              under a minute.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
