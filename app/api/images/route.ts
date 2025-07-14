import { NextResponse } from "next/server";
import { list, del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const folder = searchParams.get("folder");
  const showAll = searchParams.get("all") === "true";

  if (!folder) {
    return NextResponse.json(
      { error: "Missing folder parameter" },
      { status: 400 }
    );
  }

  try {
    const now = new Date();
    let images;
    if (showAll) {
      images = await prisma.image.findMany({
        where: { folder },
        orderBy: { scheduledAt: "asc" },
      });
    } else {
      images = await prisma.image.findMany({
        where: {
          folder,
          scheduledAt: { lte: now },
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        orderBy: { scheduledAt: "asc" },
      });
    }
    return NextResponse.json({
      images: images.map((img: any) => ({
        id: img.id,
        url: img.url,
        name: img.name,
        scheduledAt: img.scheduledAt,
        expiresAt: img.expiresAt,
      })),
    });
  } catch (err) {
    console.error("Failed to fetch images from DB:", err);
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

    // Also delete the image metadata from the database
    await prisma.image.deleteMany({ where: { url: imageUrl } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete image:", err);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
