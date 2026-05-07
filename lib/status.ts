export const toolStatuses = ["DRAFT", "PUBLISHED"] as const;

export type ToolStatusValue = (typeof toolStatuses)[number];

export const ToolStatus = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED"
} as const satisfies Record<string, ToolStatusValue>;
