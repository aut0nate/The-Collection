import { AdminShell } from "@/components/AdminShell";
import { ToolForm } from "@/components/ToolForm";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NewToolPage() {
  await requireAdmin();
  const [categories, tags] = await Promise.all([
    prisma.category.findMany({
      include: { _count: { select: { tools: true } } },
      orderBy: [{ tools: { _count: "desc" } }, { name: "asc" }]
    }),
    prisma.tag.findMany({
      include: { _count: { select: { tools: true } } },
      orderBy: [{ tools: { _count: "desc" } }, { name: "asc" }]
    })
  ]);

  return (
    <AdminShell>
      <h2 className="mb-5 text-xl font-semibold text-paper">Add a tool</h2>
      <ToolForm categories={categories} tags={tags} />
    </AdminShell>
  );
}
