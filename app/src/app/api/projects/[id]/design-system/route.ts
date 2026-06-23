import { NextResponse } from "next/server";
import { getProject } from "@/lib/store";
import { buildDesignSystem } from "@/lib/pipeline/phases/design-system";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const preset = body.preset || "auto";

  try {
    await buildDesignSystem(project.dir, preset);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
