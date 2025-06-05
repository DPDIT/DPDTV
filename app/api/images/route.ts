import { NextResponse } from "next/server";
import { list, del } from "@vercel/blob";

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

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return NextResponse.json(
      { error: "Missing image URL parameter" },
      { status: 400 }
    );
  }

  try {
    // Use the full URL as the path
    console.log("Attempting to delete URL:", imageUrl);

    // Delete the blob using the full URL
    await del([imageUrl]);
    console.log("Successfully deleted URL:", imageUrl);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete image:", err);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
