import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { assertRole, ADMIN_ONLY } from "@/lib/rbac";
import { auth } from "@/lib/auth";
import { postCreateSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  return NextResponse.json(posts);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  assertRole(session?.user?.role, ADMIN_ONLY);

  const payload = await request.json().catch(() => null);
  const parsed = postCreateSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Dados inválidos",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { title, content, published } = parsed.data;

  const post = await prisma.post.create({
    data: {
      title,
      content,
      published,
      author: session?.user?.id
        ? { connect: { id: session.user.id } }
        : undefined,
    },
  });

  return NextResponse.json(post, { status: 201 });
}
