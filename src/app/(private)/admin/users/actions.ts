"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Roles } from "@/lib/rbac";
import { postCreateSchema } from "@/lib/validators";

function assertAdmin(role: string | undefined) {
  if (role !== Roles.ADMIN) {
    throw new Error("Ação permitida apenas para administradores.");
  }
}

export async function deleteUserAction(userId: string) {
  const session = await auth();
  assertAdmin(session?.user?.role);

  if (session?.user?.id === userId) {
    throw new Error("Não é possível excluir a própria conta do administrador logado.");
  }

  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin/users");
}

export async function createPostAction(formData: FormData) {
  const session = await auth();
  assertAdmin(session?.user?.role);

  const payload = {
    title: formData.get("title"),
    content: formData.get("content"),
    published: true,
  };

  const parsed = postCreateSchema.safeParse(payload);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Dados inválidos";
    throw new Error(message);
  }

  await prisma.post.create({
    data: {
      ...parsed.data,
      author: session?.user?.id ? { connect: { id: session.user.id } } : undefined,
    },
  });

  revalidatePath("/admin/users");
}

export async function deletePostAction(postId: string) {
  const session = await auth();
  assertAdmin(session?.user?.role);

  await prisma.post.delete({
    where: { id: postId },
  });

  revalidatePath("/admin/users");
}
