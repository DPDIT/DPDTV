import { prisma } from "./prisma";
import { list } from "@vercel/blob";
import { hash } from "bcrypt";

// async function syncBlobsToDb() {
//   // List all blobs (images) in storage
//   const blobs = await list({ prefix: "" }); // Empty prefix = all blobs
//   const allowedExtensions = ["jpg", "jpeg", "png", "gif", "webp"];
//   const now = new Date();
//   const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

//   for (const blob of blobs.blobs) {
//     const ext = blob.pathname.split(".").pop()?.toLowerCase();
//     if (!allowedExtensions.includes(ext || "")) continue;

//     // Check if already in DB
//     const exists = await prisma.image.findUnique({ where: { url: blob.url } });
//     if (exists) continue;

//     // Extract folder (first 3 segments) and name (last segment)
//     const parts = blob.pathname.split("/");
//     const folder = parts.slice(0, 3).join("/");
//     const name = parts[parts.length - 1];

//     // Add to DB
//     await prisma.image.create({
//       data: {
//         url: blob.url,
//         name,
//         folder,
//         scheduledAt: now,
//         expiresAt: twoWeeksFromNow,
//       },
//     });
//     console.log(`Added image to DB: ${blob.url}`);
//   }
//   console.log("Sync complete.");
//   process.exit(0);
// }

// if (require.main === module) {
//   syncBlobsToDb().catch((e) => {
//     console.error(e);
//     process.exit(1);
//   });
// }

const createAdmin = async () => {
  const admin = await prisma.admin.findFirst();
  if (!admin) {
    await prisma.admin.create({
      data: {
        password: await hash(process.env.ADMIN_PASSWORD!, 10),
      },
    });
  }
  return admin;
};

export default createAdmin;
