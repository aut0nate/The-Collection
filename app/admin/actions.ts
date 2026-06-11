"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearAdminSession, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { suggestToolMetadata } from "@/lib/tool-ai";
import { readToolFormData } from "@/lib/tool-form";
import { saveLogoUpload } from "@/lib/uploads";
import { normaliseName, splitList } from "@/lib/utils";
import { ToolStatus } from "@/lib/status";

async function syncToolRelations(toolId: string, tagNames: string[], selectedPlatforms: string[]) {
  await prisma.toolTag.deleteMany({ where: { toolId } });
  await prisma.toolPlatform.deleteMany({ where: { toolId } });

  for (const name of tagNames.map(normaliseName)) {
    const tag = await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name }
    });
    await prisma.toolTag.create({
      data: { toolId, tagId: tag.id }
    });
  }

  for (const platform of selectedPlatforms) {
    await prisma.toolPlatform.create({
      data: {
        toolId,
        platform: platform as never
      }
    });
  }
}

async function categoryByName(name: string) {
  const normalised = normaliseName(name);
  return prisma.category.upsert({
    where: { name: normalised },
    update: {},
    create: {
      name: normalised,
      order: await prisma.category.count()
    }
  });
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function suggestToolMetadataAction(url: string) {
  await requireAdmin();
  return suggestToolMetadata(url);
}

export async function createToolAction(_: { error?: string }, formData: FormData) {
  await requireAdmin();

  try {
    const parsed = readToolFormData(formData);
    const category = await categoryByName(parsed.category);
    const uploadPath = await saveLogoUpload(formData.get("logoFile") as File | null);
    const logoUrl = uploadPath || parsed.logoUrl || null;

    const tool = await prisma.tool.create({
      data: {
        name: normaliseName(parsed.name),
        url: parsed.url,
        description: parsed.description,
        logoUrl,
        status: parsed.status,
        publishedAt: parsed.status === ToolStatus.PUBLISHED ? new Date() : null,
        categoryId: category.id
      }
    });

    await syncToolRelations(tool.id, splitList(parsed.tags), parsed.platforms);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "The tool could not be saved."
    };
  }

  revalidatePath("/");
  revalidatePath("/admin/tools");
  redirect("/admin/tools");
}

export async function updateToolAction(id: string, _: { error?: string }, formData: FormData) {
  await requireAdmin();

  try {
    const parsed = readToolFormData(formData);
    const category = await categoryByName(parsed.category);
    const uploadPath = await saveLogoUpload(formData.get("logoFile") as File | null);
    const existing = await prisma.tool.findUniqueOrThrow({ where: { id } });
    const shouldPublish = parsed.status === ToolStatus.PUBLISHED;

    await prisma.tool.update({
      where: { id },
      data: {
        name: normaliseName(parsed.name),
        url: parsed.url,
        description: parsed.description,
        logoUrl: uploadPath || parsed.logoUrl || existing.logoUrl,
        status: parsed.status,
        publishedAt: shouldPublish ? existing.publishedAt || new Date() : null,
        categoryId: category.id
      }
    });

    await syncToolRelations(id, splitList(parsed.tags), parsed.platforms);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "The tool could not be updated."
    };
  }

  revalidatePath("/");
  revalidatePath("/admin/tools");
  redirect("/admin/tools");
}

export async function deleteToolAction(id: string) {
  await requireAdmin();
  await prisma.tool.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/admin/tools");
}

export async function publishToolAction(id: string) {
  await requireAdmin();
  await prisma.tool.update({
    where: { id },
    data: {
      status: ToolStatus.PUBLISHED,
      publishedAt: new Date()
    }
  });
  revalidatePath("/");
  revalidatePath("/admin/tools");
}

export async function unpublishToolAction(id: string) {
  await requireAdmin();
  await prisma.tool.update({
    where: { id },
    data: {
      status: ToolStatus.DRAFT,
      publishedAt: null
    }
  });
  revalidatePath("/");
  revalidatePath("/admin/tools");
}
