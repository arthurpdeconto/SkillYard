import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { ADMIN_ONLY, assertRole } from "@/lib/rbac";
import { auth } from "@/lib/auth";
import { postUpdateSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type HandlerContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: HandlerContext) {
  const { id } = await params;

  const session = await auth();
  assertRole(session?.user?.role, ADMIN_ONLY);

  const payload = await request.json().catch(() => null);
  const parsed = postUpdateSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Dados inválidos",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const post = await prisma.post.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(post);
}

export async function DELETE(_request: NextRequest, { params }: HandlerContext) {
  const { id } = await params;

  const session = await auth();
  assertRole(session?.user?.role, ADMIN_ONLY);

  await prisma.post.delete({
    where: { id },
  });

  return NextResponse.json({ message: "Post removido" }, { status: 204 });
}
