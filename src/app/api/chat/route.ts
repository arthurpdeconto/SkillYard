import { NextRequest, NextResponse } from "next/server";

interface ChatPayload {
  id: string;
  author: string;
  body: string;
  createdAt: number;
}

const subscribers = new Set<(payload: ChatPayload) => void>();
const history: ChatPayload[] = [];
const HISTORY_LIMIT = 100;

function broadcast(payload: ChatPayload) {
  history.push(payload);
  if (history.length > HISTORY_LIMIT) {
    history.shift();
  }

  for (const subscriber of subscribers) {
    try {
      subscriber(payload);
    } catch (error) {
      console.error("Failed to notify subscriber", error);
      subscribers.delete(subscriber);
    }
  }
}

export async function GET(request: NextRequest) {
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const send = (payload: ChatPayload) => {
    writer.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  subscribers.add(send);
  history.forEach(send);

  const heartbeat = setInterval(() => {
    writer.write(`: heartbeat\n\n`);
  }, 30_000);

  request.signal.addEventListener("abort", () => {
    clearInterval(heartbeat);
    subscribers.delete(send);
    writer.close();
  });

  return new NextResponse(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body.body !== "string" || body.body.trim().length === 0) {
    return NextResponse.json({ message: "Mensagem inválida" }, { status: 400 });
  }

  const payload: ChatPayload = {
    id: crypto.randomUUID(),
    author: body.author ?? "Participante",
    body: body.body.trim(),
    createdAt: Date.now(),
  };

  broadcast(payload);

  return NextResponse.json({ message: "OK" }, { status: 201 });
}
