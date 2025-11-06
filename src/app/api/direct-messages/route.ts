import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { directMessageSchema } from "@/lib/validators";

import { broadcastDirectMessage } from "./bus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await auth();
  const currentUserId = session?.user?.id;

  if (!currentUserId) {
    return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
  }

  const participantId = request.nextUrl.searchParams.get("participantId");

  if (!participantId) {
    return NextResponse.json({ message: "Informe o usuário da conversa" }, { status: 400 });
  }

  const messages = await prisma.directMessage.findMany({
    where: {
      OR: [
        { senderId: currentUserId, recipientId: participantId },
        { senderId: participantId, recipientId: currentUserId },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  return NextResponse.json(
    messages.map((message: typeof messages[number]) => ({
      id: message.id,
      body: message.body,
      senderId: message.senderId,
      recipientId: message.recipientId,
      createdAt: message.createdAt.toISOString(),
    })),
  );
}

export async function POST(request: NextRequest) {
  const session = await auth();
  const senderId = session?.user?.id;

  if (!senderId) {
    return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = directMessageSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Dados inválidos",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { recipientId, body } = parsed.data;

  if (recipientId === senderId) {
    return NextResponse.json({ message: "Não é possível enviar mensagens para si mesmo" }, { status: 400 });
  }

  const recipient = await prisma.user.findUnique({
    where: { id: recipientId },
    select: { id: true },
  });

  if (!recipient) {
    return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });
  }

  const message = await prisma.directMessage.create({
    data: {
      senderId,
      recipientId,
      body: body.trim(),
    },
  });

  const event = {
    id: message.id,
    body: message.body,
    senderId: message.senderId,
    recipientId: message.recipientId,
    createdAt: message.createdAt.toISOString(),
  };

  broadcastDirectMessage(event);

  return NextResponse.json(event, { status: 201 });
}
