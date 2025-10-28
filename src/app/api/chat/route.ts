import type { NextRequest } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

interface ChatEvent {
  id: string;
  body: string;
  createdAt: number;
}

const peers = new Set<WebSocket>();

function broadcast(payload: ChatEvent) {
  const message = JSON.stringify(payload);
  for (const peer of peers) {
    if (peer.readyState === peer.OPEN) {
      peer.send(message);
    }
  }
}

export function GET(request: NextRequest) {
  if (request.headers.get("upgrade")?.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket handshake", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(request);

  socket.onopen = () => {
    peers.add(socket);
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data as string) as Pick<ChatEvent, "body">;
      broadcast({
        id: crypto.randomUUID(),
        body: data.body,
        createdAt: Date.now(),
      });
    } catch (error) {
      console.error("Invalid message received", error);
    }
  };

  socket.onclose = () => {
    peers.delete(socket);
  };

  return response;
}
