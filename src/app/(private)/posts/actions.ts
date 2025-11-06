"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { postCreateSchema } from "@/lib/validators";

export async function createPostAction(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Faça login para publicar um post.");
  }

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

  const post = await prisma.post.create({
    data: {
      ...parsed.data,
      author: { connect: { id: session.user.id } },
    },
    include: {
      author: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/users");

  return {
    id: post.id,
    title: post.title,
    createdAt: post.createdAt.toISOString(),
    author: post.author?.name ?? post.author?.email ?? "Anônimo",
  };
}
