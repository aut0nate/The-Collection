import { z } from "zod";
import { type Platform, platforms } from "@/lib/platforms";
import { ToolStatus, toolStatuses } from "@/lib/status";

export const toolFormSchema = z.object({
  name: z.string().trim().min(1, "Add a name."),
  url: z.string().trim().url("Add a valid website or GitHub URL."),
  description: z.string().trim().min(1, "Add a short description.").max(240),
  category: z.string().trim().min(1, "Add a category."),
  tags: z.string().trim().optional().default(""),
  logoUrl: z.string().trim().optional().default(""),
  status: z.enum(toolStatuses).default(ToolStatus.DRAFT),
  platforms: z
    .array(z.enum(platforms))
    .min(1, "Choose at least one platform.")
});

export function readToolFormData(formData: FormData) {
  return toolFormSchema.parse({
    name: formData.get("name"),
    url: formData.get("url"),
    description: formData.get("description"),
    category: formData.get("category"),
    tags: formData.get("tags"),
    logoUrl: formData.get("logoUrl"),
    status: formData.get("status") === ToolStatus.PUBLISHED ? ToolStatus.PUBLISHED : ToolStatus.DRAFT,
    platforms: formData.getAll("platforms").filter((value): value is Platform =>
      platforms.includes(value as Platform)
    )
  });
}
