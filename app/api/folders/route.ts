import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function getFolderStructure(
  dir: string,
  basePath: string,
  year: string,
  route: string
): any[] {
  const items = fs.readdirSync(dir);
  const folders: any[] = [];

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      const relativePath = path
        .relative(basePath, fullPath)
        .replace(/\\/g, "/");
      const lowerRel = relativePath.toLowerCase();
      const lowerYear = year.toLowerCase();
      const lowerRoute = route.toLowerCase();

      // Only recurse if the path contains the year or route
      if (lowerRel.includes(lowerYear) || lowerRel.includes(lowerRoute)) {
        // Recursively get subfolders (filtered)
        const subfolders = getFolderStructure(fullPath, basePath, year, route);

        // Check if current folder matches both filters
        const matchesFilter =
          lowerRel.includes(lowerYear) && lowerRel.includes(lowerRoute);

        if (matchesFilter || subfolders.length > 0) {
          folders.push({
            name: item,
            path: relativePath,
            subfolders,
          });
        }
      }
    }
  }

  return folders;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const route = searchParams.get("route");

    if (!year || !route) {
      return NextResponse.json(
        { error: "Missing 'year' or 'route' query parameters" },
        { status: 400 }
      );
    }

    const imagesPath = path.join(process.cwd(), "public", "images");

    if (!fs.existsSync(imagesPath)) {
      return NextResponse.json(
        { error: "Images directory not found" },
        { status: 404 }
      );
    }

    const folders = getFolderStructure(imagesPath, imagesPath, year, route);
    return NextResponse.json({ folders });
  } catch (error) {
    console.error("Error reading folders:", error);
    return NextResponse.json(
      { error: "Failed to read folders" },
      { status: 500 }
    );
  }
}
