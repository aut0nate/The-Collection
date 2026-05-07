import { ToolStatus, type ToolStatusValue } from "@/lib/status";

export function StatusBadge({ status }: { status: ToolStatusValue | string }) {
  const published = status === ToolStatus.PUBLISHED;
  return (
    <span
      className={
        published
          ? "rounded-md border border-accent/30 bg-accent/10 px-2 py-1 text-xs font-medium text-accent"
          : "rounded-md border border-amber-300/25 bg-amber-300/10 px-2 py-1 text-xs font-medium text-amber-200"
      }
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}
