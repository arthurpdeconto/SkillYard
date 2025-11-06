import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { ChatClient } from "./chat-client";

interface UserPreview {
  id: string;
  name: string | null;
  email: string;
}

export const revalidate = 0;

export default async function ChatPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { user } = session;

  const friendships = await prisma.friendship.findMany({
    where: { userId: user.id },
    include: {
      friend: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      friend: {
        name: "asc",
      },
    },
  });

  const friends: UserPreview[] = friendships
    .map((connection: { friend: UserPreview | null }): UserPreview | null => connection.friend)
    .filter((friend: UserPreview | null): friend is UserPreview => Boolean(friend));

  const friendIds = new Set(friends.map((friend) => friend.id));

  const otherUsers: UserPreview[] = await prisma.user.findMany({
    where: {
      AND: [
        { id: { not: user.id } },
        { id: { notIn: Array.from(friendIds) } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <ChatClient
      currentUserId={user.id}
      currentUserLabel={user.name ?? user.email ?? "Participante"}
      friends={friends}
      otherUsers={otherUsers}
    />
  );
}
