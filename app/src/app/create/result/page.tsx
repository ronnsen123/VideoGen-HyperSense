"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ResultPage() {
  const router = useRouter();
  const projectId =
    typeof window !== "undefined"
      ? sessionStorage.getItem("projectId")
      : null;

  if (!projectId) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-lg bg-destructive/10 text-destructive p-4">
          No project found. Please start from Step 1.
        </div>
      </div>
    );
  }

  const videoUrl = `/api/projects/${projectId}/video`;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Step 7: Your Video</h1>
        <p className="text-muted-foreground mt-1">
          Your product launch video is ready. Preview it below and download the
          MP4.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Video Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <video
            controls
            className="w-full rounded-lg bg-black"
            src={videoUrl}
          >
            Your browser does not support the video tag.
          </video>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <a href={videoUrl} download>
          <Button size="lg">Download MP4</Button>
        </a>
        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            sessionStorage.removeItem("projectId");
            sessionStorage.removeItem("videoConfig");
            router.push("/create/url");
          }}
        >
          Create Another
        </Button>
      </div>
    </div>
  );
}
