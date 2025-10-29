import * as bcrypt from "bcryptjs";

import { prisma } from "../src/lib/prisma";
import { Roles } from "../src/lib/rbac";

const ADMIN_EMAIL = "admin@local.dev";
const USER_EMAIL = "user@local.dev";

async function main() {
  await prisma.user
    .update({ where: { email: "admin@local" }, data: { email: ADMIN_EMAIL } })
    .catch(() => null);

  await prisma.user
    .update({ where: { email: "user@local" }, data: { email: USER_EMAIL } })
    .catch(() => null);

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
    where: { email: ADMIN_EMAIL },
    update: {
      name: "Admin",
      password: adminPassword,
    },
    create: {
      email: ADMIN_EMAIL,
      name: "Admin",
      password: adminPassword,
      role: { connect: { id: adminRole.id } },
    },
  });

  const userPassword = await bcrypt.hash("12345678", 12);

  await prisma.user.upsert({
    where: { email: USER_EMAIL },
    update: {
      name: "Usuário",
      password: userPassword,
    },
    create: {
      email: USER_EMAIL,
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
