import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const path = formData.get("path") as string | null;

    if (!file || !path) {
      return NextResponse.json(
        { error: "Missing file or path in form data" },
        { status: 400 }
      );
    }

    // Upload the file to Vercel Blob Storage at 'path' with public access
    const blob = await put(path, file, { access: "public" });

    // Get scheduling fields from form data
    const scheduledAtRaw = formData.get("scheduledAt") as string | null;
    const expiresAtRaw = formData.get("expiresAt") as string | null;
    const scheduledAt = scheduledAtRaw ? new Date(scheduledAtRaw) : new Date();
    const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : null;

    // Create DB entry for the image
    await prisma.image.create({
      data: {
        url: blob.url,
        name: file.name,
        folder: path.split("/").slice(0, -1).join("/"),
        scheduledAt,
        expiresAt,
      },
    });

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
