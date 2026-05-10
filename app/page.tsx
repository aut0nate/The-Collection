import type { Prisma } from "@prisma/client";
import { LiveSearchInput } from "@/components/LiveSearchInput";
import { PublicHeader } from "@/components/PublicHeader";
import { ToolCard } from "@/components/ToolCard";
import { prisma } from "@/lib/db";
import { parsePlatforms, platformLabels, platforms } from "@/lib/platforms";
import { ToolStatus } from "@/lib/status";
import Link from "next/link";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const dynamic = "force-dynamic";

function asString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function categoryHref(category: string, query: string, selectedPlatforms: string[]) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  for (const platform of selectedPlatforms) params.append("platform", platform);
  if (category) params.set("category", category);
  const search = params.toString();
  return search ? `/?${search}` : "/";
}

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = asString(params.q).trim();
  const selectedPlatforms = parsePlatforms(params.platform);
  const selectedCategory = asString(params.category);

  const where: Prisma.ToolWhereInput = {
    status: ToolStatus.PUBLISHED,
    ...(query
      ? {
          OR: [
            { name: { contains: query } },
            { description: { contains: query } },
            { category: { name: { contains: query } } },
            { tags: { some: { tag: { name: { contains: query } } } } }
          ]
        }
      : {}),
    ...(selectedCategory ? { category: { name: selectedCategory } } : {}),
    ...(selectedPlatforms.length
      ? {
          platforms: {
            some: {
              platform: { in: selectedPlatforms }
            }
          }
        }
      : {})
  };

  const [tools, categories, totalCount] = await Promise.all([
    prisma.tool.findMany({
      where,
      include: {
        category: true,
        tags: { include: { tag: true }, orderBy: { tag: { name: "asc" } } },
        platforms: true
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }]
    }),
    prisma.category.findMany({
      where: { tools: { some: { status: ToolStatus.PUBLISHED } } },
      include: { _count: { select: { tools: true } } },
      orderBy: [{ order: "asc" }, { name: "asc" }]
    }),
    prisma.tool.count({ where: { status: ToolStatus.PUBLISHED } })
  ]);

  const activeFilters = query || selectedCategory || selectedPlatforms.length > 0;

  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <section className="max-w-3xl">
          <h2 className="text-3xl font-semibold tracking-normal text-paper sm:text-4xl">
            Welcome to <span className="text-accent">The Collection</span>
          </h2>
          <p className="mt-4 text-base leading-7 text-mist sm:text-lg">
            A public repository of apps, command line tools, and resources I use, trust, and recommend.
          </p>
        </section>

        <form action="/" className="mt-9 space-y-5">
          <LiveSearchInput
            defaultValue={query}
            label="Search tools"
            placeholder="Search tools, tags, and categories..."
            className="h-12 w-full rounded-lg border border-white/10 bg-panel px-4 text-sm text-paper outline-none transition placeholder:text-slate-500 focus:border-accent/60"
          />

          <div className="flex flex-wrap gap-2">
            {selectedCategory ? <input type="hidden" name="category" value={selectedCategory} /> : null}
            {platforms.map((platform) => (
              <label
                key={platform}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-white/10 bg-panel px-3 py-2 text-sm text-mist transition has-[:checked]:border-accent/50 has-[:checked]:bg-accent/10 has-[:checked]:text-accent"
              >
                <input
                  type="checkbox"
                  name="platform"
                  value={platform}
                  defaultChecked={selectedPlatforms.includes(platform)}
                  className="sr-only"
                />
                {platformLabels[platform]}
              </label>
            ))}
            <button className="rounded-md border border-accent/35 bg-accent px-4 py-2 text-sm font-semibold text-ink transition hover:bg-[#8ff0e5]">
              Apply filters
            </button>
            {activeFilters ? (
              <Link href="/" className="rounded-md border border-white/10 px-4 py-2 text-sm font-medium text-mist hover:text-paper">
                Clear
              </Link>
            ) : null}
          </div>

          <details className="rounded-lg border border-white/10 bg-panel" open={Boolean(selectedCategory)}>
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-paper">
              Categories
            </summary>
            <div className="grid gap-2 border-t border-white/10 p-3 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href={categoryHref("", query, selectedPlatforms)}
                className={
                  !selectedCategory
                    ? "flex items-center justify-between rounded-md border border-accent/50 bg-accent/10 px-3 py-2 text-sm text-accent"
                    : "flex items-center justify-between rounded-md border border-white/10 px-3 py-2 text-sm text-mist hover:border-accent/40 hover:text-paper"
                }
              >
                <span>All categories</span>
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={categoryHref(category.name, query, selectedPlatforms)}
                  className={
                    selectedCategory === category.name
                      ? "flex items-center justify-between gap-3 rounded-md border border-accent/50 bg-accent/10 px-3 py-2 text-sm text-accent"
                      : "flex items-center justify-between gap-3 rounded-md border border-white/10 px-3 py-2 text-sm text-mist hover:border-accent/40 hover:text-paper"
                  }
                >
                  <span>{category.name}</span>
                  <span className="text-xs text-slate-500">{category._count.tools}</span>
                </Link>
              ))}
            </div>
          </details>
        </form>

        <section className="mt-12">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-mist">
              Showing {tools.length} of {totalCount} tools
            </p>
            <span className="rounded-md border border-white/10 px-3 py-2 text-sm text-mist">Newest first</span>
          </div>

          {tools.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {tools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-white/10 bg-panel p-8 text-center">
              <h2 className="text-lg font-semibold text-paper">No matching tools</h2>
              <p className="mt-2 text-sm text-mist">Try a different search, platform, or category.</p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
