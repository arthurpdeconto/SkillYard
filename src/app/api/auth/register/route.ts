import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { Roles } from "@/lib/rbac";
import { registerSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);

  const parsed = registerSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Dados inválidos",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { email, password, name } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    return NextResponse.json(
      {
        message: "E-mail já cadastrado",
      },
      { status: 409 },
    );
  }

  const userRole = await prisma.role.findUnique({ where: { name: Roles.USER } });

  if (!userRole) {
    return NextResponse.json(
      {
        message: "Role padrão não configurada. Execute o seed.",
      },
      { status: 500 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name,
      email,
      password: passwordHash,
      role: { connect: { id: userRole.id } },
    },
  });

  return NextResponse.json({ message: "Conta criada com sucesso" }, { status: 201 });
}
