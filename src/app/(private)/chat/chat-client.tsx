"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import styles from "../chat.module.css";

interface UserPreview {
  id: string;
  name: string | null;
  email: string;
}

interface BroadcastMessage {
  id: string;
  author: string;
  body: string;
  createdAt: number;
}

interface DirectMessage {
  id: string;
  body: string;
  senderId: string;
  recipientId: string;
  createdAt: string;
}

type ConversationTarget =
  | { type: "broadcast" }
  | { type: "direct"; user: UserPreview };

type FeedbackState = { kind: "success" | "error"; message: string } | null;

interface ChatClientProps {
  currentUserId: string;
  currentUserLabel: string;
  friends: UserPreview[];
  otherUsers: UserPreview[];
}

function getDisplayName(user: UserPreview) {
  return user.name?.trim() || user.email;
}

function toTimeLabel(timestamp: number | string) {
  const date = typeof timestamp === "number" ? new Date(timestamp) : new Date(timestamp);
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function ChatClient({ currentUserId, currentUserLabel, friends, otherUsers }: ChatClientProps) {
  const [friendsList, setFriendsList] = useState(friends);
  const [otherUsersList, setOtherUsersList] = useState(otherUsers);
  const [selectedTarget, setSelectedTarget] = useState<ConversationTarget>({ type: "broadcast" });
  const [globalMessages, setGlobalMessages] = useState<BroadcastMessage[]>([]);
  const [directMessages, setDirectMessages] = useState<Record<string, DirectMessage[]>>({});
  const [directLoading, setDirectLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isGlobalConnected, setIsGlobalConnected] = useState(false);
  const [isDirectConnected, setIsDirectConnected] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [pendingFriendId, setPendingFriendId] = useState<string | null>(null);
  const directHistoryLoaded = useRef(new Set<string>());
  const messagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const source = new EventSource("/api/chat");

    source.onopen = () => setIsGlobalConnected(true);
    source.onerror = () => setIsGlobalConnected(false);
    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as BroadcastMessage;
        setGlobalMessages((prev) => [...prev, payload]);
      } catch (error) {
        console.error("[chat] erro ao ler mensagem global", error);
      }
    };

    return () => {
      setIsGlobalConnected(false);
      source.close();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const source = new EventSource("/api/direct-messages/stream");

    source.onopen = () => setIsDirectConnected(true);
    source.onerror = () => {
      if (!cancelled) {
        setIsDirectConnected(false);
      }
    };

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as DirectMessage;
        const otherUserId = payload.senderId === currentUserId ? payload.recipientId : payload.senderId;

        setDirectMessages((prev) => {
          const conversation = prev[otherUserId] ?? [];
          if (conversation.some((messageItem) => messageItem.id === payload.id)) {
            return prev;
          }
          return {
            ...prev,
            [otherUserId]: [...conversation, payload],
          };
        });
      } catch (error) {
        console.error("[chat] erro ao ler mensagem direta", error);
      }
    };

    return () => {
      cancelled = true;
      setIsDirectConnected(false);
      source.close();
    };
  }, [currentUserId]);

  useEffect(() => {
    const container = messagesRef.current;
    if (!container) {
      return;
    }
    container.scrollTop = container.scrollHeight;
  }, [selectedTarget, globalMessages, directMessages]);

  const activeMessages = useMemo(() => {
    if (selectedTarget.type === "broadcast") {
      return globalMessages;
    }
    const conversation = directMessages[selectedTarget.user.id] ?? [];
    return conversation;
  }, [selectedTarget, globalMessages, directMessages]);

  const isBroadcast = selectedTarget.type === "broadcast";
  const conversationTitle = isBroadcast ? "Canal geral" : getDisplayName(selectedTarget.user);
  const conversationSubtitle = isBroadcast
    ? "Converse com todos da comunidade."
    : selectedTarget.user.email;

  function pushFeedback(kind: "success" | "error", messageText: string) {
    setFeedback({ kind, message: messageText });
    setTimeout(() => setFeedback(null), 4000);
  }

  async function openConversation(user: UserPreview) {
    setSelectedTarget({ type: "direct", user });

    if (directHistoryLoaded.current.has(user.id)) {
      return;
    }

    setDirectLoading(true);
    try {
      const response = await fetch(`/api/direct-messages?participantId=${encodeURIComponent(user.id)}`);
      if (!response.ok) {
        throw new Error("Não foi possível carregar a conversa.");
      }
      const data = (await response.json()) as DirectMessage[];
      setDirectMessages((prev) => ({
        ...prev,
        [user.id]: data,
      }));
      directHistoryLoaded.current.add(user.id);
    } catch (error) {
      console.error(error);
      pushFeedback("error", (error as Error).message ?? "Erro ao carregar a conversa.");
    } finally {
      setDirectLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) {
      return;
    }

    setMessage("");
    setIsSending(true);

    try {
      if (isBroadcast) {
        await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ author: currentUserLabel, body: trimmed }),
        });
      } else {
        const targetId = selectedTarget.user.id;
        const response = await fetch("/api/direct-messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipientId: targetId, body: trimmed }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          const errorMessage = payload?.message ?? "Não foi possível enviar a mensagem.";
          throw new Error(errorMessage);
        }
      }
    } catch (error) {
      pushFeedback("error", (error as Error).message ?? "Erro ao enviar mensagem.");
      setMessage(trimmed);
    } finally {
      setIsSending(false);
    }
  }

  async function handleAddFriend(user: UserPreview) {
    setPendingFriendId(user.id);
    try {
      const response = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendId: user.id }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const messageText = payload?.message ?? "Não foi possível adicionar o amigo.";
        throw new Error(messageText);
      }

      setFriendsList((prev) => [...prev, user].sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b))));
      setOtherUsersList((prev) => prev.filter((item) => item.id !== user.id));
      pushFeedback("success", `${getDisplayName(user)} adicionado à sua lista de amigos.`);
    } catch (error) {
      pushFeedback("error", (error as Error).message ?? "Não foi possível adicionar o amigo.");
    } finally {
      setPendingFriendId(null);
    }
  }

  const conversationStatus = isBroadcast ? isGlobalConnected : isDirectConnected;
  const statusLabel = conversationStatus ? "conectado" : "desconectado";

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h2 className={styles.heading}>Mensagens</h2>
        <p className={styles.description}>
          Procure membros da comunidade, conecte-se com amigos e troque mensagens em tempo real.
        </p>
      </header>

      <div className={styles.chatShell}>
        <aside className={styles.contactsPanel} aria-label="Lista de conversas">
          <div className={styles.sectionBlock}>
            <p className={styles.sectionTitle}>Geral</p>
            <ul className={styles.contactList}>
              <li>
                <button
                  type="button"
                  className={`${styles.contactButton} ${
                    selectedTarget.type === "broadcast" ? styles.contactButtonActive : ""
                  }`}
                  onClick={() => setSelectedTarget({ type: "broadcast" })}
                >
                  <span className={styles.contactName}>Canal geral</span>
                  <span className={styles.contactSubtitle}>Todos podem participar</span>
                </button>
              </li>
            </ul>
          </div>

          <div className={styles.sectionBlock}>
            <p className={styles.sectionTitle}>Amigos</p>
            {friendsList.length === 0 ? (
              <p className={styles.sectionEmpty}>Nenhum amigo ainda. Adicione alguém para conversar rapidamente.</p>
            ) : (
              <ul className={styles.contactList}>
                {friendsList.map((friend) => (
                  <li key={friend.id} className={styles.contactItem}>
                    <button
                      type="button"
                      className={`${styles.contactButton} ${
                        selectedTarget.type === "direct" && selectedTarget.user.id === friend.id
                          ? styles.contactButtonActive
                          : ""
                      }`}
                      onClick={() => openConversation(friend)}
                    >
                      <span className={styles.contactName}>{getDisplayName(friend)}</span>
                      <span className={styles.contactSubtitle}>{friend.email}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.sectionBlock}>
            <p className={styles.sectionTitle}>Outros usuários</p>
            {otherUsersList.length === 0 ? (
              <p className={styles.sectionEmpty}>Todos por aqui já estão na sua lista de amigos.</p>
            ) : (
              <ul className={styles.contactList}>
                {otherUsersList.map((user) => (
                  <li key={user.id} className={styles.contactItem}>
                    <button
                      type="button"
                      className={`${styles.contactButton} ${
                        selectedTarget.type === "direct" && selectedTarget.user.id === user.id
                          ? styles.contactButtonActive
                          : ""
                      }`}
                      onClick={() => openConversation(user)}
                    >
                      <span className={styles.contactName}>{getDisplayName(user)}</span>
                      <span className={styles.contactSubtitle}>{user.email}</span>
                    </button>
                    <button
                      type="button"
                      className={styles.addFriendButton}
                      disabled={pendingFriendId === user.id}
                      onClick={() => handleAddFriend(user)}
                    >
                      {pendingFriendId === user.id ? "Adicionando..." : "Adicionar"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        <div className={styles.conversationPanel}>
          <div className={styles.conversationHeader}>
            <div>
              <h3 className={styles.conversationTitle}>{conversationTitle}</h3>
              <p className={styles.conversationSubtitle}>{conversationSubtitle}</p>
            </div>
            <span
              className={`${styles.statusPill} ${
                conversationStatus ? styles.statusPillConnected : styles.statusPillDisconnected
              }`}
            >
              {statusLabel}
            </span>
          </div>

          {feedback && (
            <div
              className={`${styles.feedback} ${
                feedback.kind === "success" ? styles.feedbackSuccess : styles.feedbackError
              }`}
              role="status"
            >
              {feedback.message}
            </div>
          )}

          <div className={styles.messages} ref={messagesRef}>
            {directLoading ? (
              <p className={styles.empty}>Carregando conversa...</p>
            ) : activeMessages.length === 0 ? (
              <p className={styles.empty}>
                {isBroadcast
                  ? "Nenhuma mensagem ainda. Inicie a conversa com a comunidade!"
                  : "Conversa vazia. Envie a primeira mensagem."}
              </p>
            ) : (
              activeMessages.map((msg) => {
                if (isBroadcast) {
                  const broadcastMessage = msg as BroadcastMessage;
                  return (
                    <article key={broadcastMessage.id} className={styles.message}>
                      <header className={styles.messageMeta}>
                        <span>{broadcastMessage.author}</span>
                        <time dateTime={new Date(broadcastMessage.createdAt).toISOString()}>
                          {toTimeLabel(broadcastMessage.createdAt)}
                        </time>
                      </header>
                      <p className={styles.messageBody}>{broadcastMessage.body}</p>
                    </article>
                  );
                }

                const directMessage = msg as DirectMessage;
                const isMine = directMessage.senderId === currentUserId;
                return (
                  <article
                    key={directMessage.id}
                    className={`${styles.message} ${isMine ? styles.messageSelf : styles.messagePeer}`}
                  >
                    <header className={styles.messageMeta}>
                      <span>{isMine ? "Você" : conversationTitle}</span>
                      <time dateTime={directMessage.createdAt}>{toTimeLabel(directMessage.createdAt)}</time>
                    </header>
                    <p className={styles.messageBody}>{directMessage.body}</p>
                  </article>
                );
              })
            )}
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formInner}>
              <input
                type="text"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={
                  isBroadcast ? "Envie uma mensagem para toda a comunidade" : "Envie uma mensagem direta"
                }
                className={styles.input}
                disabled={isSending}
              />
              <button type="submit" className={styles.submit} disabled={isSending || message.trim().length === 0}>
                {isSending ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
