import { getProject, updateProject } from "@/lib/store";
import { runAudio } from "@/lib/pipeline/phases/audio";
import type { PipelineEvent } from "@/lib/pipeline/types";

export const maxDuration = 180;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
    });
  }

  const body = await request.json();
  const voice = body.voice || "am_michael";
  const noBgm = body.noBgm !== false;

  updateProject(id, { status: "audio-generating" });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const emit = (event: PipelineEvent) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        } catch {
          // stream closed
        }
      };

      runAudio(project.dir, voice, noBgm, emit)
        .then(() => {
          updateProject(id, { status: "audio-done" });
          controller.close();
        })
        .catch((err) => {
          const message = err instanceof Error ? err.message : String(err);
          updateProject(id, { status: "error", error: message });
          emit({ phase: "error", status: "error", error: message });
          controller.close();
        });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
