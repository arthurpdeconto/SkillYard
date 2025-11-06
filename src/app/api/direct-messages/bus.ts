interface DirectMessageEvent {
  id: string;
  body: string;
  senderId: string;
  recipientId: string;
  createdAt: string;
}

const subscribers = new Map<string, Set<(event: DirectMessageEvent) => void>>();

function getChannel(userId: string) {
  let channel = subscribers.get(userId);
  if (!channel) {
    channel = new Set();
    subscribers.set(userId, channel);
  }
  return channel;
}

export function subscribeToDirectMessages(userId: string, listener: (event: DirectMessageEvent) => void) {
  const channel = getChannel(userId);
  channel.add(listener);

  return () => {
    channel.delete(listener);
    if (channel.size === 0) {
      subscribers.delete(userId);
    }
  };
}

export function broadcastDirectMessage(event: DirectMessageEvent) {
  const notify = (userId: string) => {
    const channel = subscribers.get(userId);
    if (!channel) {
      return;
    }
    for (const listener of channel) {
      try {
        listener(event);
      } catch (error) {
        console.error("[direct-messages] listener failed", error);
        channel.delete(listener);
      }
    }
    if (channel.size === 0) {
      subscribers.delete(userId);
    }
  };

  notify(event.senderId);
  if (event.recipientId !== event.senderId) {
    notify(event.recipientId);
  }
}

export type { DirectMessageEvent };
