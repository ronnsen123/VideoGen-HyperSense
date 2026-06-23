"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const STEPS = [
  { path: "/create/url", label: "URL & Capture", number: 1 },
  { path: "/create/configure", label: "Configure", number: 2 },
  { path: "/create/story", label: "Story", number: 3 },
  { path: "/create/audio", label: "Audio", number: 4 },
  { path: "/create/design", label: "Visual Plan", number: 5 },
  { path: "/create/generate", label: "Generate", number: 6 },
  { path: "/create/result", label: "Result", number: 7 },
];

export function StepIndicator() {
  const pathname = usePathname();
  const currentIndex = STEPS.findIndex((s) => pathname.startsWith(s.path));

  return (
    <nav className="flex flex-col gap-1 py-4 pr-6 pl-4 w-56 shrink-0">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-2">
        Steps
      </h2>
      {STEPS.map((step, i) => {
        const isCurrent = i === currentIndex;
        const isPast = i < currentIndex;
        const isFuture = i > currentIndex;

        return (
          <div key={step.path} className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors",
                  isCurrent && "border-primary bg-primary text-primary-foreground",
                  isPast && "border-primary bg-primary/10 text-primary",
                  isFuture && "border-muted text-muted-foreground"
                )}
              >
                {isPast ? "✓" : step.number}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "w-0.5 h-5 mt-1",
                    isPast ? "bg-primary/30" : "bg-muted"
                  )}
                />
              )}
            </div>
            {isPast ? (
              <Link
                href={step.path}
                className={cn(
                  "text-sm transition-colors -mt-3",
                  "text-primary hover:underline"
                )}
              >
                {step.label}
              </Link>
            ) : (
              <span
                className={cn(
                  "text-sm -mt-3",
                  isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
