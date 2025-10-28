import bcrypt from "bcryptjs";

import { prisma } from "../src/lib/prisma";
import { Roles } from "../src/lib/rbac";

async function main() {
  const [adminRole, userRole] = await Promise.all([
    prisma.role.upsert({
      where: { name: Roles.ADMIN },
      update: {},
      create: { name: Roles.ADMIN },
    }),
    prisma.role.upsert({
      where: { name: Roles.USER },
      update: {},
      create: { name: Roles.USER },
    }),
  ]);

  const adminPassword = await bcrypt.hash("12345678", 12);

  await prisma.user.upsert({
    where: { email: "admin@local" },
    update: {},
    create: {
      email: "admin@local",
      name: "Admin",
      password: adminPassword,
      role: { connect: { id: adminRole.id } },
    },
  });

  const userPassword = await bcrypt.hash("12345678", 12);

  await prisma.user.upsert({
    where: { email: "user@local" },
    update: {},
    create: {
      email: "user@local",
      name: "Usuário",
      password: userPassword,
      role: { connect: { id: userRole.id } },
    },
  });

  console.log("Database seeded.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
