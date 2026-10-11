import type { DocumentStatus } from "@/lib/api";

// Plain-language labels so users don't need to know the technical status names.
const STYLES: Record<DocumentStatus, { label: string; className: string }> = {
  Uploaded: { label: "Waiting", className: "bg-subtle text-muted" },
  Processing: { label: "Processing…", className: "bg-info-soft text-info" },
  Completed: { label: "Ready", className: "bg-success-soft text-success" },
  Failed: { label: "Not finished", className: "bg-warning-soft text-warning" },
};

export function StatusBadge({ status }: { status: DocumentStatus }) {
  const style = STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${style.className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {style.label}
    </span>
  );
}
