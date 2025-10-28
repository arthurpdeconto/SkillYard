import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { ADMIN_ONLY, assertRole } from "@/lib/rbac";
import { auth } from "@/lib/auth";
import { postUpdateSchema } from "@/lib/validators";

interface RouteContext {
  params: {
    id: string;
  };
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: RouteContext) {
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
    where: { id: context.params.id },
    data: parsed.data,
  });

  return NextResponse.json(post);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth();
  assertRole(session?.user?.role, ADMIN_ONLY);

  await prisma.post.delete({
    where: { id: context.params.id },
  });

  return NextResponse.json({ message: "Post removido" }, { status: 204 });
}
