"use client";

import { useEffect, useRef, useState } from "react";

import styles from "../chat.module.css";

interface ChatMessage {
  id: string;
  author: string;
  body: string;
  createdAt: number;
}

export default function ChatPage() {
  const [currentUser, setCurrentUser] = useState<string>("Participante");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.user) {
          setCurrentUser(data.user.name ?? data.user.email ?? "Participante");
        }
      })
      .catch(() => {
        // mantém o rótulo padrão
      });

    const source = new EventSource("/api/chat");
    eventSourceRef.current = source;

    source.onopen = () => setIsConnected(true);
    source.onerror = () => setIsConnected(false);
    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as ChatMessage;
        setMessages((prev) => [...prev, payload]);
      } catch {
        // formato inesperado, ignorar
      }
    };

    return () => {
      cancelled = true;
      source.close();
      eventSourceRef.current = null;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) {
      return;
    }

    setMessage("");

    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: currentUser, body: trimmed }),
      });
    } catch (error) {
      console.error("Failed to send chat message", error);
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
