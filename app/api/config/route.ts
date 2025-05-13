import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface RouteConfig {
  duration: number;
  selectedFolders: string[];
  lastUpdated: string;
}

const defaultConfig: RouteConfig = {
  duration: 20,
  selectedFolders: [],
  lastUpdated: new Date().toISOString(),
};

export async function POST(request: Request) {
  try {
    const { duration, selectedFolders, route } = await request.json();

    const configPath = path.join(process.cwd(), "config");
    if (!fs.existsSync(configPath)) {
      fs.mkdirSync(configPath);
    }

    const routeConfigPath = path.join(configPath, `${route}.json`);
    const config: RouteConfig = {
      duration,
      selectedFolders,
      lastUpdated: new Date().toISOString(),
    };

    fs.writeFileSync(routeConfigPath, JSON.stringify(config, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving config:", error);
    return NextResponse.json(
      { error: "Failed to save configuration" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const route = searchParams.get("route") || "default";

    const configPath = path.join(process.cwd(), "config", `${route}.json`);

    if (!fs.existsSync(configPath)) {
      return NextResponse.json(defaultConfig);
    }

    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    return NextResponse.json(config);
  } catch (error) {
    console.error("Error reading config:", error);
    return NextResponse.json(
      { error: "Failed to read configuration" },
      { status: 500 }
    );
  }
}
