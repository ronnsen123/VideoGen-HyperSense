import { getProject, updateProject } from "@/lib/store";
import { runGenerate } from "@/lib/pipeline/phases/generate";
import type { PipelineEvent } from "@/lib/pipeline/types";

export const maxDuration = 600;

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

  updateProject(id, { status: "generating" });

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

      runGenerate(project.dir, emit)
        .then(() => {
          updateProject(id, { status: "completed" });
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
