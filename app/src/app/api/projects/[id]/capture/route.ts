import { getProject, updateProject } from "@/lib/store";
import { runCapture } from "@/lib/pipeline/phases/capture";
import type { PipelineEvent } from "@/lib/pipeline/types";

export const maxDuration = 120;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = getProject(id);

  if (!project) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
    });
  }

  updateProject(id, { status: "capturing" });

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

      runCapture(project.dir, project.url, emit)
        .then(() => {
          updateProject(id, { status: "captured" });
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
