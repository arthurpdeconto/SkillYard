import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { friendRequestSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await auth();
  const currentUserId = session?.user?.id;

  if (!currentUserId) {
    return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = friendRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Dados inválidos",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { friendId } = parsed.data;

  if (friendId === currentUserId) {
    return NextResponse.json({ message: "Você já é seu próprio amigo :)" }, { status: 400 });
  }

  const friend = await prisma.user.findUnique({
    where: { id: friendId },
    select: { id: true, name: true, email: true },
  });

  if (!friend) {
    return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });
  }

  const existing = await prisma.friendship.findUnique({
    where: { userId_friendId: { userId: currentUserId, friendId } },
  });

  if (existing) {
    return NextResponse.json({ message: "Usuário já está nos seus amigos" }, { status: 409 });
  }

  await prisma.friendship.createMany({
    data: [
      { userId: currentUserId, friendId },
      { userId: friendId, friendId: currentUserId },
    ],
    skipDuplicates: true,
  });

  return NextResponse.json(
    {
      friend: {
        id: friend.id,
        name: friend.name,
        email: friend.email,
      },
      message: "Amigo adicionado com sucesso",
    },
    { status: 201 },
  );
}
