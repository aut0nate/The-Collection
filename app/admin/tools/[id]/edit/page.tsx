import { notFound } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { ToolForm } from "@/components/ToolForm";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function EditToolPage({ params }: { params: Params }) {
  await requireAdmin();
  const { id } = await params;

  const [tool, categories, tags] = await Promise.all([
    prisma.tool.findUnique({
      where: { id },
      include: {
        category: true,
        tags: { include: { tag: true }, orderBy: { tag: { name: "asc" } } },
        platforms: true
      }
    }),
    prisma.category.findMany({
      include: { _count: { select: { tools: true } } },
      orderBy: [{ tools: { _count: "desc" } }, { name: "asc" }]
    }),
    prisma.tag.findMany({
      include: { _count: { select: { tools: true } } },
      orderBy: [{ tools: { _count: "desc" } }, { name: "asc" }]
    })
  ]);

  if (!tool) notFound();

  return (
    <AdminShell>
      <h2 className="mb-5 text-xl font-semibold text-paper">Edit {tool.name}</h2>
      <ToolForm tool={tool} categories={categories} tags={tags} />
    </AdminShell>
  );
}
