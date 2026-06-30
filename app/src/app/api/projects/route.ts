import { NextResponse } from "next/server";
import { initProject } from "@/lib/pipeline/phases/init";
import { setProject } from "@/lib/store";
import type { ProjectState } from "@/lib/pipeline/types";

export async function POST(request: Request) {
  const body = await request.json();
  const url: string = body.url;

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  const hostname = new URL(
    url.startsWith("http") ? url : `https://${url}`
  ).hostname.replace(/^www\./, "");
  const projectName = hostname.replace(/\./g, "-") + "-promo";

  const id = `${projectName}-${Date.now()}`;

  try {
    const dir = await initProject(id);

    const state: ProjectState = {
      id,
      name: projectName,
      dir,
      url: url.startsWith("http") ? url : `https://${url}`,
      status: "created",
      config: { url: url.startsWith("http") ? url : `https://${url}` },
      createdAt: new Date().toISOString(),
    };

    setProject(state);

    return NextResponse.json({ id, name: projectName, dir });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
