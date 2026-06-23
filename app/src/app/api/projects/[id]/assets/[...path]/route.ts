import { getProject } from "@/lib/store";
import fs from "fs";
import path from "path";

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; path: string[] }> }
) {
  const { id, path: segments } = await params;
  const project = getProject(id);
  if (!project) return new Response("Not found", { status: 404 });

  const filePath = path.join(project.dir, ...segments);

  if (!filePath.startsWith(project.dir)) {
    return new Response("Forbidden", { status: 403 });
  }

  if (!fs.existsSync(filePath)) {
    return new Response("Not found", { status: 404 });
  }

  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME_TYPES[ext] || "application/octet-stream";
  const data = fs.readFileSync(filePath);

  return new Response(data, {
    headers: { "Content-Type": mime },
  });
}
