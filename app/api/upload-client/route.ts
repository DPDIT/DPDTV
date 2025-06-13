import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Validate file type based on extension
        const allowedExtensions = ["jpg", "jpeg", "png", "gif", "webp"];
        const fileExtension = pathname.split(".").pop()?.toLowerCase();

        if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
          throw new Error(
            `Invalid file type: ${fileExtension}. Only JPEG, PNG, GIF, and WEBP images are allowed.`
          );
        }

        // Generate a client token for the browser to upload the file
        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
          ],
          addRandomSuffix: false,
          tokenPayload: JSON.stringify({
            pathname,
            timestamp: new Date().toISOString(),
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Get notified of client upload completion
        console.log("Blob upload completed:", {
          url: blob.url,
          pathname: blob.pathname,
          tokenPayload,
        });

        try {
          // No return value needed as the function expects void
        } catch (error) {
          console.error("Error in upload completion handler:", error);
          throw new Error("Failed to process upload completion");
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
