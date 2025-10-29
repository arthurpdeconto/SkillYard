"use server";

import * as bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { userUpdateSchema } from "@/lib/validators";

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Não autenticado");
  }

  const payload = {
    name: formData.get("name")?.toString() ?? undefined,
    password: formData.get("password")?.toString() ?? undefined,
    confirmPassword: formData.get("confirmPassword")?.toString() ?? undefined,
  };

  if (payload.password && payload.password !== payload.confirmPassword) {
    return { error: "As senhas não conferem." };
  }

  const parsed = userUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const data: { name?: string; password?: string } = {};

  if (parsed.data.name) {
    data.name = parsed.data.name;
  }

  if (parsed.data.password) {
    data.password = await bcrypt.hash(parsed.data.password, 12);
  }

  const updatedUser = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: {
      name: true,
      email: true,
      role: { select: { name: true } },
    },
  });

  revalidatePath("/profile");
  return {
    success: true,
    data: {
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role?.name ?? session.user.role,
    },
  };
}

export async function deleteProfile() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Não autenticado");
  }

  await prisma.user.delete({
    where: { id: session.user.id },
  });

  redirect("/login");
}
