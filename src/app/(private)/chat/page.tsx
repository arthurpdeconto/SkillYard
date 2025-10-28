"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import styles from "./chat.module.css";

interface ChatMessage {
  id: string;
  author: string;
  body: string;
  createdAt: number;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  const wsUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    return `${protocol}://${window.location.host}/api/chat`;
  }, []);

  useEffect(() => {
    if (!wsUrl) {
      return undefined;
    }

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.addEventListener("open", () => setIsConnected(true));
    socket.addEventListener("close", () => setIsConnected(false));
    socket.addEventListener("message", (event) => {
      try {
        const payload = JSON.parse(event.data.toString()) as ChatMessage;
        setMessages((prev) => [...prev, payload]);
      } catch {
        // ignore invalid payloads
      }
    });

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [wsUrl]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim()) {
      return;
    }

    const payload = {
      body: message.trim(),
      createdAt: Date.now(),
    };

    setMessage("");

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h2 className={styles.heading}>Canal geral</h2>
        <p className={styles.description}>
          Compartilhe oportunidades e dúvidas em tempo real com toda a comunidade.
        </p>
        <p className={styles.statusLine}>
          Status:{" "}
          <span className={isConnected ? styles.statusConnected : styles.statusDisconnected}>
            {isConnected ? "conectado" : "desconectado"}
          </span>
        </p>
      </header>

      <div className={styles.layout}>
        <div className={styles.chatPanel}>
          <div className={styles.messages}>
            {messages.map((msg) => (
              <article key={msg.id} className={styles.message}>
                <header className={styles.messageMeta}>
                  <span>{msg.author}</span>
                  <time dateTime={new Date(msg.createdAt).toISOString()}>
                    {new Date(msg.createdAt).toLocaleTimeString("pt-BR")}
                  </time>
                </header>
                <p className={styles.messageBody}>{msg.body}</p>
              </article>
            ))}

            {messages.length === 0 && <p className={styles.empty}>Nenhuma mensagem ainda. Seja o primeiro!</p>}
          </div>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formInner}>
              <input
                type="text"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Envie uma mensagem para toda a comunidade"
                className={styles.input}
              />
              <button type="submit" className={styles.submit}>
                Enviar
              </button>
            </div>
          </form>
        </div>

        <aside className={styles.sidebar}>
          <h3 className={styles.sidebarTitle}>Boas práticas</h3>
          <ul className={styles.sidebarList}>
            <li>• Seja respeitoso com a comunidade.</li>
            <li>• Compartilhe aprendizados de forma objetiva.</li>
            <li>• Evite dados pessoais e links suspeitos.</li>
          </ul>
        </aside>
      </div>
    </section>
  );
}
