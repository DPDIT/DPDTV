import { NextResponse } from "next/server";
import { list } from "@vercel/blob";

interface Folder {
  name: string;
  path: string;
  subfolders?: Record<string, Folder>;
}

function buildTree(paths: string[]): Folder[] {
  const root: Record<string, Folder> = {};
  const monthOrder = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  for (const path of paths) {
    const parts = path.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const segment = parts[i];
      const fullPath = parts.slice(0, i + 1).join("/");

      if (!current[segment]) {
        current[segment] = {
          name: segment,
          path: fullPath,
          subfolders: {},
        };
      }

      if (i === parts.length - 1) break;

      current = current[segment].subfolders!;
    }
  }

  function toArray(obj: Record<string, Folder>): Folder[] {
    const folders = Object.values(obj).map((folder) => ({
      name: folder.name,
      path: folder.path,
      subfolders: folder.subfolders ? toArray(folder.subfolders) : {},
    }));

    // Sort folders by month if they are month names
    return folders.sort((a, b) => {
      const aMonth = a.name;
      const bMonth = b.name;
      const aIndex = monthOrder.indexOf(aMonth);
      const bIndex = monthOrder.indexOf(bMonth);

      // If both are months, sort by month order
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      // If only one is a month, put months first
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      // If neither is a month, sort alphabetically
      return a.name.localeCompare(b.name);
    });
  }

  return toArray(root);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const route = searchParams.get("route");
  const year = searchParams.get("year");

  if (!route || !year) {
    return NextResponse.json(
      { error: "Missing route or year" },
      { status: 400 }
    );
  }

  try {
    const prefix = `${year}/${route}/`;
    const blobs = await list({ prefix });

    const folderPaths = new Set<string>();

    for (const blob of blobs.blobs) {
      const parts = blob.pathname.split("/");
      for (let i = 1; i < parts.length - 1; i++) {
        const subpath = parts.slice(0, i + 1).join("/");
        folderPaths.add(subpath);
      }
    }

    const folders = buildTree([...folderPaths]);

    return NextResponse.json({ folders });
  } catch (err) {
    console.error("Error listing blobs:", err);
    return NextResponse.json(
      { error: "Failed to load folders" },
      { status: 500 }
    );
  }
}
