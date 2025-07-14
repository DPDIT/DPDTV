import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseLocalDateTime(localDateTime: string) {
  if (!localDateTime) return undefined;
  const safeString = localDateTime.replace("T", " ");
  const date = new Date(safeString);
  if (isNaN(date.getTime())) return undefined;
  return date;
}

export async function POST(req: NextRequest) {
  try {
    const { url, scheduledAt, expiresAt } = await req.json();
    if (!url || !scheduledAt) {
      return NextResponse.json(
        { error: "Missing url or scheduledAt" },
        { status: 400 }
      );
    }
    const scheduledDate = parseLocalDateTime(scheduledAt);
    if (!scheduledDate) {
      return NextResponse.json(
        { error: "Invalid scheduledAt value" },
        { status: 400 }
      );
    }
    let image = await prisma.image.findUnique({ where: { url } });
    if (image) {
      image = await prisma.image.update({
        where: { url },
        data: {
          scheduledAt: scheduledDate,
          expiresAt: expiresAt ? parseLocalDateTime(expiresAt) : null,
        },
      });
    } else {
      image = await prisma.image.create({
        data: {
          url,
          name: url.split("/").pop() || "Unnamed",
          folder: url.split("/").slice(-4, -1).join("/"),
          scheduledAt: scheduledDate,
          expiresAt: expiresAt ? parseLocalDateTime(expiresAt) : null,
        },
      });
    }
    return NextResponse.json({ success: true, image });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update image metadata" },
      { status: 500 }
    );
  }
}
