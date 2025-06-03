import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
// Constants
const SUPPORTED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".mp4",
  ".webm",
  ".mov",
  ".avi",
  ".mkv",
] as const;

// Utility functions
const normalizePath = (path: string): string => path.replace(/\\/g, "/");

const getImagesFromDirectory = (
  dir: string,
  baseFolder: string,
  selectedFolders: string[]
): string[] => {
  let results: string[] = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      const relativePath = normalizePath(
        path.relative(path.join(process.cwd(), "public", "images"), fullPath)
      );

      const isSelected = selectedFolders.some((folder) => {
        const normalizedFolder = normalizePath(folder);
        return normalizedFolder === relativePath;
      });

      if (isSelected) {
        const subFolderImages = getImagesFromDirectory(
          fullPath,
          baseFolder,
          selectedFolders
        );
        results = results.concat(subFolderImages);
      }
    } else {
      const ext = path.extname(file).toLowerCase();
      if (SUPPORTED_EXTENSIONS.includes(ext as any)) {
        const relativePath = normalizePath(
          path.relative(path.join(process.cwd(), "public", "images"), fullPath)
        );

        if (relativePath && !relativePath.startsWith("..")) {
          results.push(relativePath);
        }
      }
    }
  }

  return results;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const folder = searchParams.get("folder");
  const selectedYear = searchParams.get("year");

  if (!folder) {
    return NextResponse.json(
      { error: "Folder parameter is required" },
      { status: 400 }
    );
  }

  try {
    const route = folder.split("/")[0].toLowerCase();
    const config = await prisma.config.findFirst({
      where: { route },
    });

    if (!config) {
      return NextResponse.json({ images: [] });
    }

    const selectedFolders = config.selectedFolders.map(normalizePath);

    const folderIsSelected = selectedFolders.some(
      (f) =>
        f.toLowerCase() ===
        normalizePath(`${selectedYear}/${folder}`).toLowerCase()
    );
    console.log("API: Folder selection status:", {
      isSelected: folderIsSelected,
      selectedFolders,
    });

    if (!folderIsSelected) {
      return NextResponse.json({ images: [] });
    }

    const imagesPath = path.join(
      process.cwd(),
      "public",
      "images",
      selectedYear!,
      folder
    );

    if (!fs.existsSync(imagesPath)) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    const images = getImagesFromDirectory(imagesPath, folder, selectedFolders);

    return NextResponse.json({ images });
  } catch (error) {
    console.error("API: Error reading images:", error);
    return NextResponse.json(
      { error: "Failed to read images" },
      { status: 500 }
    );
  }
}
