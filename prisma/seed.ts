import { PrismaClient } from "@prisma/client";
import { ToolStatus } from "../lib/status";

const prisma = new PrismaClient();

const tools = [
  {
    name: "Raycast",
    url: "https://www.raycast.com/",
    description: "A fast launcher and automation tool for macOS.",
    category: "Apps & Services",
    tags: ["Productivity", "Automation"],
    platforms: ["MACOS"],
    logoUrl: "https://www.raycast.com/favicon-production.png"
  },
  {
    name: "Homebrew",
    url: "https://brew.sh/",
    description: "The missing package manager for macOS and Linux.",
    category: "Dev & CLI Tools",
    tags: ["CLI", "Package Manager"],
    platforms: ["MACOS", "LINUX"],
    logoUrl: "https://brew.sh/assets/img/homebrew.svg"
  },
  {
    name: "Obsidian",
    url: "https://obsidian.md/",
    description: "A flexible notes app for local markdown knowledge bases.",
    category: "Apps & Services",
    tags: ["Notes", "Knowledge"],
    platforms: ["MACOS", "WINDOWS", "LINUX", "IOS", "ANDROID"],
    logoUrl: "https://obsidian.md/favicon.ico"
  },
  {
    name: "FFmpeg",
    url: "https://ffmpeg.org/",
    description: "A command line toolkit for converting and processing media.",
    category: "Dev & CLI Tools",
    tags: ["CLI", "Video"],
    platforms: ["MACOS", "WINDOWS", "LINUX"],
    logoUrl: "https://ffmpeg.org/favicon.ico"
  },
  {
    name: "GitHub CLI",
    url: "https://cli.github.com/",
    description: "Work with GitHub issues, pull requests, and repositories from the terminal.",
    category: "Dev & CLI Tools",
    tags: ["CLI", "GitHub"],
    platforms: ["MACOS", "WINDOWS", "LINUX"],
    logoUrl: "https://cli.github.com/assets/images/favicon.ico"
  },
  {
    name: "DaVinci Resolve",
    url: "https://www.blackmagicdesign.com/products/davinciresolve",
    description: "Professional video editing, colour grading, visual effects, and audio post-production.",
    category: "Video Editing",
    tags: ["Video", "Creative"],
    platforms: ["MACOS", "WINDOWS", "LINUX"],
    logoUrl: "https://www.blackmagicdesign.com/favicon.ico"
  },
  {
    name: "Tailscale",
    url: "https://tailscale.com/",
    description: "A simple mesh VPN for private access to devices and services.",
    category: "Homelab Apps & Services",
    tags: ["Networking", "Security"],
    platforms: ["MACOS", "WINDOWS", "LINUX", "IOS", "ANDROID"],
    logoUrl: "https://tailscale.com/favicon.ico"
  },
  {
    name: "Syncthing",
    url: "https://syncthing.net/",
    description: "Private continuous file synchronisation between your own devices.",
    category: "Homelab Apps & Services",
    tags: ["Files", "Open Source"],
    platforms: ["MACOS", "WINDOWS", "LINUX", "ANDROID"],
    logoUrl: "https://syncthing.net/img/favicon.png"
  }
];

async function main() {
  const categoryNames = Array.from(new Set(tools.map((tool) => tool.category)));

  for (const [index, name] of categoryNames.entries()) {
    await prisma.category.upsert({
      where: { name },
      update: { order: index },
      create: { name, order: index }
    });
  }

  for (const item of tools) {
    const category = await prisma.category.findUniqueOrThrow({
      where: { name: item.category }
    });

    const tool = await prisma.tool.upsert({
      where: { url: item.url },
      update: {
        name: item.name,
        description: item.description,
        logoUrl: item.logoUrl,
        status: ToolStatus.PUBLISHED,
        publishedAt: new Date(),
        categoryId: category.id
      },
      create: {
        name: item.name,
        url: item.url,
        description: item.description,
        logoUrl: item.logoUrl,
        status: ToolStatus.PUBLISHED,
        publishedAt: new Date(),
        categoryId: category.id
      }
    });

    await prisma.toolTag.deleteMany({ where: { toolId: tool.id } });
    await prisma.toolPlatform.deleteMany({ where: { toolId: tool.id } });

    for (const tagName of item.tags) {
      const tag = await prisma.tag.upsert({
        where: { name: tagName },
        update: {},
        create: { name: tagName }
      });
      await prisma.toolTag.create({
        data: { toolId: tool.id, tagId: tag.id }
      });
    }

    for (const platform of item.platforms) {
      await prisma.toolPlatform.create({
        data: { toolId: tool.id, platform }
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
