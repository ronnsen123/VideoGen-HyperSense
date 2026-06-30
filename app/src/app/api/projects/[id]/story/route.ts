import { NextResponse } from "next/server";
import { getProject, updateProject } from "@/lib/store";
import {
  generateNarratorScripts,
  saveNarratorScripts,
  loadNarratorScripts,
  shouldRegenerateNarratorScripts,
} from "@/lib/pipeline/phases/story";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = getProject(id);
  if (!project)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  let scripts = loadNarratorScripts(project.dir);
  if (!scripts || shouldRegenerateNarratorScripts(scripts)) {
    scripts = await generateNarratorScripts(project.dir, project.config);
    saveNarratorScripts(project.dir, scripts);
  }

  return NextResponse.json(scripts);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = getProject(id);
  if (!project)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const scripts = await request.json();
  saveNarratorScripts(project.dir, scripts);
  updateProject(id, { status: "story-review" });

  return NextResponse.json({ ok: true });
}
