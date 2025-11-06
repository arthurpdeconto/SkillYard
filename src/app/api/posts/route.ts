import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
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

  if (!session?.user?.id) {
    return NextResponse.json({ message: "É necessário estar autenticado para criar um post." }, { status: 401 });
  }

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
      author: { connect: { id: session.user.id } },
    },
  });

  return NextResponse.json(post, { status: 201 });
}
