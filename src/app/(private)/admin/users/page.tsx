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
      users={users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role?.name ?? Roles.USER,
        createdAt: user.createdAt.toISOString(),
      }))}
      posts={posts.map((post) => ({
        id: post.id,
        title: post.title,
        createdAt: post.createdAt.toISOString(),
        author: post.author?.name ?? post.author?.email ?? "Anônimo",
      }))}
    />
  );
}
