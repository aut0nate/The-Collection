import type { Category, Tag, Tool, ToolPlatform, ToolTag } from "@prisma/client";
import { platformLabel } from "@/lib/platforms";
import { ToolLogo } from "@/components/ToolLogo";

type ToolWithRelations = Tool & {
  category: Category;
  platforms: ToolPlatform[];
  tags: (ToolTag & { tag: Tag })[];
};

export function ToolCard({ tool }: { tool: ToolWithRelations }) {
  return (
    <a
      href={tool.url}
      target="_blank"
      rel="noreferrer"
      className="group flex min-h-44 flex-col justify-between rounded-lg border border-white/10 bg-panel/86 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/45 hover:bg-[#131a23] hover:shadow-glow"
    >
      <div className="flex gap-4">
        <ToolLogo name={tool.name} logoUrl={tool.logoUrl} />
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-paper">{tool.name}</h2>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-mist">{tool.description}</p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="rounded-md border border-accent/25 bg-accent/10 px-2 py-1 text-xs font-medium text-accent">
          {tool.category.name}
        </span>
        {tool.tags.slice(0, 2).map(({ tag }) => (
          <span key={tag.id} className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-mist">
            {tag.name}
          </span>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5 text-[11px] font-medium text-slate-300">
        {tool.platforms.map(({ platform }) => (
          <span key={platform} className="rounded border border-white/10 px-1.5 py-1">
            {platformLabel(platform)}
          </span>
        ))}
      </div>
    </a>
  );
}
