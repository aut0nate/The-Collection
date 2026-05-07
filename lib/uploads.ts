import "server-only";

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const allowedTypes = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
  ["image/svg+xml", "svg"],
  ["image/x-icon", "ico"],
  ["image/vnd.microsoft.icon", "ico"]
]);

export function getDataDir() {
  return process.env.DATA_DIR || path.join(process.cwd(), "data");
}

export function getUploadsDir() {
  return path.join(getDataDir(), "uploads");
}

export async function saveLogoUpload(file: File | null) {
  if (!file || file.size === 0) return null;

  const extension = allowedTypes.get(file.type);
  if (!extension) {
    throw new Error("Logo uploads must be PNG, JPG, WebP, SVG, or ICO files.");
  }

  if (file.size > 2 * 1024 * 1024) {
    throw new Error("Logo uploads must be 2 MB or smaller.");
  }

  await fs.mkdir(getUploadsDir(), { recursive: true });

  const bytes = Buffer.from(await file.arrayBuffer());
  const fileName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${extension}`;
  const filePath = path.join(getUploadsDir(), fileName);
  await fs.writeFile(filePath, bytes);

  return `/uploads/${fileName}`;
}

export function resolveUploadPath(parts: string[]) {
  const fileName = parts.join("/");
  const fullPath = path.normalize(path.join(getUploadsDir(), fileName));
  if (!fullPath.startsWith(getUploadsDir())) {
    throw new Error("Invalid upload path.");
  }
  return fullPath;
}
