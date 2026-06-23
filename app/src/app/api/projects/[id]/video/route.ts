import { getProject } from "@/lib/store";
import fs from "fs";
import path from "path";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) {
    return new Response("Not found", { status: 404 });
  }

  const videoPath = path.join(project.dir, "renders/video.mp4");
  if (!fs.existsSync(videoPath)) {
    return new Response("Video not ready", { status: 404 });
  }

  const stat = fs.statSync(videoPath);
  const data = fs.readFileSync(videoPath);

  return new Response(data, {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(stat.size),
      "Content-Disposition": `inline; filename="${project.name}.mp4"`,
    },
  });
}
