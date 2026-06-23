import { StepIndicator } from "@/components/wizard/StepIndicator";

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="border-r bg-muted/30">
        <StepIndicator />
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
