import { prisma } from "./prisma";
import { hash } from "bcrypt";

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
