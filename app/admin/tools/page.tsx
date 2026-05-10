import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { LiveSearchInput } from "@/components/LiveSearchInput";
import { StatusBadge } from "@/components/StatusBadge";
import { ToolLogo } from "@/components/ToolLogo";
import { deleteToolAction, publishToolAction, unpublishToolAction } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { platformLabel } from "@/lib/platforms";
import { ToolStatus } from "@/lib/status";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function asString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export default async function ToolsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();

  const params = await searchParams;
  const query = asString(params.q).trim();

  const where: Prisma.ToolWhereInput = query
    ? {
        OR: [
          { name: { contains: query } },
          { url: { contains: query } },
          { description: { contains: query } },
          { status: { contains: query.toUpperCase() } },
          { category: { name: { contains: query } } },
          { tags: { some: { tag: { name: { contains: query } } } } },
          { platforms: { some: { platform: { contains: query } } } }
        ]
      }
    : {};

  const [tools, totalCount] = await Promise.all([
    prisma.tool.findMany({
      where,
      include: {
        category: true,
        tags: { include: { tag: true }, orderBy: { tag: { name: "asc" } } },
        platforms: true
      },
      orderBy: [{ updatedAt: "desc" }]
    }),
    prisma.tool.count()
  ]);

  return (
    <AdminShell>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-mist">
          {query ? `Showing ${tools.length} of ${totalCount} tools` : `${totalCount} tools in the database`}
        </p>
        <Link href="/admin/tools/new" className="rounded-md bg-accent px-4 py-2 text-sm font-bold text-ink hover:bg-[#8ff0e5]">
          Add tool
        </Link>
      </div>

      <form action="/admin/tools" className="mb-5 flex flex-col gap-3 sm:flex-row">
        <LiveSearchInput
          defaultValue={query}
          label="Search management tools"
          placeholder="Search by name, tag, platform, status, or URL..."
          className="h-12 w-full rounded-lg border border-white/10 bg-panel px-4 text-sm text-paper outline-none transition placeholder:text-slate-500 focus:border-accent/60"
        />
        <div className="flex gap-2">
          <button className="rounded-md border border-accent/35 bg-accent px-4 py-2 text-sm font-semibold text-ink transition hover:bg-[#8ff0e5]">
            Search
          </button>
          {query ? (
            <Link href="/admin/tools" className="rounded-md border border-white/10 px-4 py-2 text-sm font-medium text-mist hover:text-paper">
              Clear
            </Link>
          ) : null}
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border border-white/10 bg-panel">
        {tools.length ? (
          <div className="divide-y divide-white/10">
            {tools.map((tool) => (
              <article key={tool.id} className="grid gap-4 p-4 lg:grid-cols-[1fr_auto]">
                <div className="flex min-w-0 gap-4">
                  <ToolLogo name={tool.name} logoUrl={tool.logoUrl} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-paper">{tool.name}</h2>
                      <StatusBadge status={tool.status} />
                    </div>
                    <p className="mt-1 max-w-3xl text-sm leading-6 text-mist">{tool.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
                      <span className="rounded border border-accent/25 bg-accent/10 px-2 py-1 text-accent">{tool.category.name}</span>
                      {tool.tags.map(({ tag }) => (
                        <span key={tag.id} className="rounded border border-white/10 px-2 py-1">{tag.name}</span>
                      ))}
                      {tool.platforms.map(({ platform }) => (
                        <span key={platform} className="rounded border border-white/10 px-2 py-1">{platformLabel(platform)}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-start gap-2 lg:justify-end">
                  <a href={tool.url} target="_blank" rel="noreferrer" className="rounded-md border border-white/10 px-3 py-2 text-sm text-mist hover:text-paper">
                    Open
                  </a>
                  <Link href={`/admin/tools/${tool.id}/edit`} className="rounded-md border border-white/10 px-3 py-2 text-sm text-mist hover:text-paper">
                    Edit
                  </Link>
                  {tool.status === ToolStatus.PUBLISHED ? (
                    <form action={unpublishToolAction.bind(null, tool.id)}>
                      <button className="rounded-md border border-white/10 px-3 py-2 text-sm text-mist hover:text-paper">Unpublish</button>
                    </form>
                  ) : (
                    <form action={publishToolAction.bind(null, tool.id)}>
                      <button className="rounded-md border border-accent/35 px-3 py-2 text-sm font-medium text-accent hover:bg-accent/10">Publish</button>
                    </form>
                  )}
                  <form action={deleteToolAction.bind(null, tool.id)}>
                    <button className="rounded-md border border-red-300/20 px-3 py-2 text-sm text-red-200 hover:bg-red-500/10">
                      Delete
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <h2 className="text-lg font-semibold text-paper">{query ? "No matching tools" : "No tools yet"}</h2>
            <p className="mt-2 text-sm text-mist">
              {query ? "Try a different search term." : "Add your first recommendation and publish it when it is ready."}
            </p>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
