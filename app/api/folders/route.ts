import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function getFolderStructure(dir: string, basePath: string): any[] {
  const items = fs.readdirSync(dir);
  const folders: any[] = [];

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      const relativePath = path.relative(basePath, fullPath);
      folders.push({
        name: item,
        path: relativePath,
        subfolders: getFolderStructure(fullPath, basePath),
      });
    }
  }

  return folders;
}

export async function GET() {
  try {
    const imagesPath = path.join(process.cwd(), "public", "images");

    if (!fs.existsSync(imagesPath)) {
      return NextResponse.json(
        { error: "Images directory not found" },
        { status: 404 }
      );
    }

    const folders = getFolderStructure(imagesPath, imagesPath);
    return NextResponse.json({ folders });
  } catch (error) {
    console.error("Error reading folders:", error);
    return NextResponse.json(
      { error: "Failed to read folders" },
      { status: 500 }
    );
  }
}
