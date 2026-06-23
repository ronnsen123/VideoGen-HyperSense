import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getProject, updateProject } from "@/lib/store";
import {
  generateVisualPlan,
  saveVisualPlan,
  loadVisualPlan,
} from "@/lib/pipeline/phases/visual-plan";
import type { NarratorScripts, AudioMeta } from "@/lib/pipeline/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = getProject(id);
  if (!project)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  let plan = loadVisualPlan(project.dir);
  if (!plan) {
    plan = generateVisualPlan(project.dir);
    saveVisualPlan(project.dir, plan);
  }

  let narratorScripts: NarratorScripts | null = null;
  const narratorPath = path.join(project.dir, "narrator_scripts.json");
  if (fs.existsSync(narratorPath)) {
    narratorScripts = JSON.parse(fs.readFileSync(narratorPath, "utf-8"));
  }

  let audioMeta: AudioMeta | null = null;
  const audioPath = path.join(project.dir, "audio_meta.json");
  if (fs.existsSync(audioPath)) {
    audioMeta = JSON.parse(fs.readFileSync(audioPath, "utf-8"));
  }

  let screenshots: string[] = [];
  const screenshotsDir = path.join(project.dir, "capture/screenshots");
  if (fs.existsSync(screenshotsDir)) {
    screenshots = fs
      .readdirSync(screenshotsDir)
      .filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f))
      .sort();
  }

  let brandPrimary = "#26A68A";
  const inferencePath = path.join(project.dir, "design-system/inference.json");
  if (fs.existsSync(inferencePath)) {
    const inf = JSON.parse(fs.readFileSync(inferencePath, "utf-8"));
    brandPrimary = inf?.site_dna?.brand_primary || brandPrimary;
  }

  return NextResponse.json({
    content: plan,
    narratorScripts,
    audioMeta,
    screenshots,
    brandPrimary,
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = getProject(id);
  if (!project)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  saveVisualPlan(project.dir, body.content);
  updateProject(id, { status: "design-review" });

  return NextResponse.json({ ok: true });
}
