import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { auth } from "@/lib/auth";

import { subscribeToDirectMessages } from "../bus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  const write = (payload: string) => writer.write(encoder.encode(payload));

  const unsubscribe = subscribeToDirectMessages(userId, (event) => {
    write(`data: ${JSON.stringify(event)}\n\n`);
  });

  write(`event: ready\ndata: {}\n\n`);

  const heartbeat = setInterval(() => {
    write(`: heartbeat\n\n`);
  }, 30_000);

  request.signal.addEventListener("abort", () => {
    clearInterval(heartbeat);
    unsubscribe();
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
