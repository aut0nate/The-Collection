export const platforms = ["MACOS", "LINUX", "WINDOWS", "IOS", "ANDROID", "WEB"] as const;

export type Platform = (typeof platforms)[number];

export const platformLabels: Record<Platform, string> = {
  MACOS: "macOS",
  LINUX: "Linux",
  WINDOWS: "Windows",
  IOS: "iOS",
  ANDROID: "Android",
  WEB: "Web"
};

export function parsePlatforms(value: string | string[] | undefined): Platform[] {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return values.filter((item): item is Platform => platforms.includes(item as Platform));
}

export function platformLabel(value: string) {
  return platformLabels[value as Platform] || value;
}
