import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    const config = await prisma.config.upsert({
      where: { route },
      update: {
        duration,
        selectedFolders,
        lastUpdated: new Date(),
      },
      create: {
        route,
        duration,
        selectedFolders,
        lastUpdated: new Date(),
      },
    });

    console.log("Config saved:", config);

    return NextResponse.json({ success: true, config });
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
    console.log("Config API: Received request for route:", route);

    const config = await prisma.config.findUnique({
      where: { route },
    });

    console.log("Config API: Found config:", config);

    if (!config) {
      console.log("Config API: No config found, returning default");
      return NextResponse.json(defaultConfig);
    }

    const response = {
      duration: config.duration,
      selectedFolders: config.selectedFolders,
      lastUpdated: config.lastUpdated.toISOString(),
    };
    console.log("Config API: Returning response:", response);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Config API: Error reading config:", error);
    return NextResponse.json(
      { error: "Failed to read configuration" },
      { status: 500 }
    );
  }
}
