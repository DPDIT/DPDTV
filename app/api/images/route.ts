import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function getAllImages(
  dir: string,
  baseFolder: string,
  selectedFolders: string[]
): string[] {
  let results: string[] = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Get the relative path of the subfolder
      const relativePath = path
        .relative(
          path.join(process.cwd(), "public", "images", baseFolder),
          fullPath
        )
        .replace(/\\/g, "/");

      const subfolderPath = `${baseFolder}/${relativePath}`;

      // Only process subfolders that are selected
      if (selectedFolders.includes(subfolderPath)) {
        const subFolderImages = getAllImages(
          fullPath,
          baseFolder,
          selectedFolders
        );
        results = results.concat(subFolderImages);
      }
    } else {
      const ext = path.extname(file).toLowerCase();
      if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext)) {
        // Get the relative path from the base folder
        const relativePath = path
          .relative(
            path.join(process.cwd(), "public", "images", baseFolder),
            fullPath
          )
          .replace(/\\/g, "/");

        // Only include the path if it's valid
        if (relativePath && !relativePath.startsWith("..")) {
          results.push(relativePath);
        }
      }
    }
  }

  return results;
}

async function isFolderSelected(
  folder: string
): Promise<{ isSelected: boolean; selectedFolders: string[] }> {
  try {
    const route = folder.split("/")[0];
    const configPath = path.join(process.cwd(), "config", `${route}.json`);

    if (!fs.existsSync(configPath)) {
      console.log(`Config file not found for route: ${route}`);
      return { isSelected: false, selectedFolders: [] };
    }

    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

    // Normalize the folder path to use forward slashes
    const normalizedFolder = folder.replace(/\\/g, "/");

    // Normalize all selected folders to use forward slashes
    const normalizedSelectedFolders = config.selectedFolders.map((f: string) =>
      f.replace(/\\/g, "/")
    );

    // Check if the folder is in the selected folders
    const isSelected = normalizedSelectedFolders.includes(normalizedFolder);
    console.log(`Folder ${normalizedFolder} selection status: ${isSelected}`);
    console.log(`Selected folders: ${normalizedSelectedFolders.join(", ")}`);

    return { isSelected, selectedFolders: normalizedSelectedFolders };
  } catch (error) {
    console.error("Error checking folder selection:", error);
    return { isSelected: false, selectedFolders: [] };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const folder = searchParams.get("folder");

  if (!folder) {
    return NextResponse.json(
      { error: "Folder parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Check if folder is selected in config
    const { isSelected, selectedFolders } = await isFolderSelected(folder);
    if (!isSelected) {
      console.log(`Folder ${folder} is not selected in config`);
      return NextResponse.json({ images: [] });
    }

    const imagesPath = path.join(process.cwd(), "public", "images", folder);

    // Check if directory exists
    if (!fs.existsSync(imagesPath)) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    const images = getAllImages(imagesPath, folder, selectedFolders);

    // Log results for debugging
    console.log("Found images:", images);

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Error reading images:", error);
    return NextResponse.json(
      { error: "Failed to read images" },
      { status: 500 }
    );
  }
}
