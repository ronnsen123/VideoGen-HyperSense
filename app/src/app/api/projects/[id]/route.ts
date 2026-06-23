import { NextResponse } from "next/server";
import { getProject, updateProject } from "@/lib/store";
import fs from "fs";
import path from "path";
import type { CaptureTokens, DesignInference } from "@/lib/pipeline/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = getProject(id);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const result: Record<string, unknown> = { ...project };

  const tokensPath = path.join(
    project.dir,
    "capture/extracted/tokens.json"
  );
  if (fs.existsSync(tokensPath)) {
    const tokens: CaptureTokens = JSON.parse(
      fs.readFileSync(tokensPath, "utf-8")
    );
    result.tokens = tokens;
  }

  const inferencePath = path.join(project.dir, "design-system/inference.json");
  if (fs.existsSync(inferencePath)) {
    const inference: DesignInference = JSON.parse(
      fs.readFileSync(inferencePath, "utf-8")
    );
    result.inference = inference;
  }

  const screenshotsDir = path.join(project.dir, "capture/screenshots");
  if (fs.existsSync(screenshotsDir)) {
    result.screenshots = fs
      .readdirSync(screenshotsDir)
      .filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f));
  }

  const audioMetaPath = path.join(project.dir, "audio_meta.json");
  if (fs.existsSync(audioMetaPath)) {
    result.audioMeta = JSON.parse(fs.readFileSync(audioMetaPath, "utf-8"));
  }

  const narratorPath = path.join(project.dir, "narrator_scripts.json");
  if (fs.existsSync(narratorPath)) {
    result.narratorScripts = JSON.parse(fs.readFileSync(narratorPath, "utf-8"));
  }

  return NextResponse.json(result);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const updated = updateProject(id, {
    config: { ...project.config, ...body.config },
    status: body.status || project.status,
  });

  return NextResponse.json({ ok: true, config: updated?.config });
}
