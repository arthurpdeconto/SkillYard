import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { userUpdateSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = userUpdateSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Dados inválidos",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
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
      id: true,
      name: true,
      email: true,
      role: { select: { name: true } },
    },
  });

  return NextResponse.json(updatedUser);
}

export async function DELETE() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
  }

  await prisma.user.delete({
    where: { id: session.user.id },
  });

  return NextResponse.json({ message: "Conta removida" }, { status: 204 });
}
