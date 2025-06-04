import { NextResponse } from "next/server";
import { list } from "@vercel/blob";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const folder = searchParams.get("folder");

  if (!folder) {
    return NextResponse.json(
      { error: "Missing folder parameter" },
      { status: 400 }
    );
  }

  try {
    const blobs = await list({ prefix: `${folder}/` });

    const images = blobs.blobs
      .filter((blob) => {
        const ext = blob.pathname.split(".").pop()?.toLowerCase();
        return ["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "");
      })
      .map((blob) => ({
        id: blob.url, // Use full URL as a unique ID
        url: blob.url,
        name: blob.pathname.split("/").pop() || "Unnamed",
      }));

    return NextResponse.json({ images });
  } catch (err) {
    console.error("Failed to list blobs:", err);
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 }
    );
  }
}
