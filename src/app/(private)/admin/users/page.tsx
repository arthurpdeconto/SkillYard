import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Roles } from "@/lib/rbac";

import { AdminUsersClient } from "./admin-users-client";

export const revalidate = 0;

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== Roles.ADMIN) {
    redirect("/");
  }

  const { user } = session;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: { select: { name: true } },
      createdAt: true,
    },
  });

  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      createdAt: true,
      author: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return (
    <AdminUsersClient
      currentUserId={user.id}
      users={users.map((userRecord) => ({
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        role: userRecord.role?.name ?? Roles.USER,
        createdAt: userRecord.createdAt.toISOString(),
      }))}
      posts={posts.map((postRecord) => ({
        id: postRecord.id,
        title: postRecord.title,
        createdAt: postRecord.createdAt.toISOString(),
        author: postRecord.author?.name ?? postRecord.author?.email ?? "Anônimo",
      }))}
    />
  );
}
