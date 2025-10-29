"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { createPortal } from "react-dom";

import styles from "./admin-users.module.css";
import { createPostAction, deletePostAction, deleteUserAction } from "./actions";

interface AdminUsersClientProps {
  currentUserId: string;
  users: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    createdAt: string;
  }[];
  posts: {
    id: string;
    title: string;
    createdAt: string;
    author: string;
  }[];
}

interface Toast {
  id: number;
  message: string;
  kind: "success" | "error";
}

export function AdminUsersClient({ currentUserId, users, posts }: AdminUsersClientProps) {
  const [localUsers, setLocalUsers] = useState(users);
  const [localPosts, setLocalPosts] = useState(posts);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isPending, startTransition] = useTransition();
  const [formState, setFormState] = useState({ title: "", content: "" });
  const [isMounted, setIsMounted] = useState(false);
  const toastId = useMemo(() => ({ current: 0 }), []);
  const [confirmDialog, setConfirmDialog] = useState<
    | { type: "user"; id: string; description: string }
    | { type: "post"; id: string; description: string }
    | null
  >(null);
  const [activeSection, setActiveSection] = useState<"create" | "posts" | "users">("create");
  const [postQuery, setPostQuery] = useState("");
  const [userQuery, setUserQuery] = useState("");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  function addToast(message: string, kind: "success" | "error") {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => dismissToast(id), 4500);
  }

  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }

  function handleDeleteUser(userId: string, email: string) {
    if (userId === currentUserId) {
      addToast("Você não pode excluir sua própria conta enquanto estiver logado.", "error");
      return;
    }

    setConfirmDialog({
      type: "user",
      id: userId,
      description: `Tem certeza que deseja excluir a conta ${email}?`,
    });
  }

  function handleCreatePost(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const formData = new FormData(formElement);

    startTransition(() => {
      void createPostAction(formData)
        .then((createdPost) => {
          if (createdPost) {
            setLocalPosts((prev) => [createdPost, ...prev]);
          }
          addToast("Post publicado com sucesso!", "success");
          setFormState({ title: "", content: "" });
          formElement.reset();
        })
        .catch((error) => {
          addToast(error.message ?? "Não foi possível criar o post.", "error");
        });
    });
  }

  function handleDeletePost(postId: string, title: string) {
    setConfirmDialog({
      type: "post",
      id: postId,
      description: `Excluir definitivamente o post “${title}”?`,
    });
  }

  const filteredPosts = useMemo(() => {
    const query = postQuery.trim().toLowerCase();
    if (!query) {
      return localPosts;
    }

    return localPosts.filter((post) => {
      const author = post.author?.toLowerCase() ?? "";
      return post.title.toLowerCase().includes(query) || author.includes(query);
    });
  }, [localPosts, postQuery]);

  const filteredUsers = useMemo(() => {
    const query = userQuery.trim().toLowerCase();
    if (!query) {
      return localUsers;
    }

    return localUsers.filter((user) => {
      const name = user.name?.toLowerCase() ?? "";
      return name.includes(query) || user.email.toLowerCase().includes(query) || user.role.toLowerCase().includes(query);
    });
  }, [localUsers, userQuery]);

  const sections = [
    { id: "create", label: "Criar post" },
    { id: "posts", label: "Administrar posts" },
    { id: "users", label: "Administrar usuários" },
  ] as const;

  const hasPostQuery = postQuery.trim().length > 0;
  const hasUserQuery = userQuery.trim().length > 0;

  const postFilterSectionId = "post-filter-section";
  const userFilterInputId = "user-filter";

  const executeDeletion = useCallback(() => {
    if (!confirmDialog) {
      return;
    }

    if (confirmDialog.type === "user") {
      startTransition(() => {
        void deleteUserAction(confirmDialog.id)
          .then(() => {
            setLocalUsers((prev) => prev.filter((user) => user.id !== confirmDialog.id));
            addToast("Usuário excluído com sucesso!", "success");
            setConfirmDialog(null);
          })
          .catch((error) => {
            addToast(error.message ?? "Não foi possível excluir o usuário.", "error");
          });
      });
    } else {
      startTransition(() => {
        void deletePostAction(confirmDialog.id)
          .then(() => {
            setLocalPosts((prev) => prev.filter((post) => post.id !== confirmDialog.id));
            addToast("Post excluído com sucesso!", "success");
            setConfirmDialog(null);
          })
          .catch((error) => {
            addToast(error.message ?? "Não foi possível excluir o post.", "error");
          });
      });
    }
  }, [confirmDialog]);

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div className={styles.copy}>
          <h2 className={styles.heading}>Painel administrativo</h2>
          <p className={styles.description}>
            Gerencie usuários, divulgue novidades para a comunidade e mantenha o ambiente organizado.
          </p>
        </div>
      </header>

      <nav className={styles.sectionNav} aria-label="Seções do painel">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            className={`${styles.sectionButton} ${
              activeSection === section.id ? styles.sectionButtonActive : ""
            }`}
            onClick={() => setActiveSection(section.id)}
          >
            {section.label}
          </button>
        ))}
      </nav>

      <div className={styles.sectionContent}>
        {activeSection === "create" && (
          <section className={styles.editorCard} aria-labelledby="create-post-heading">
            <div className={styles.cardHeader}>
              <h3 id="create-post-heading">Nova publicação</h3>
              <p>Compartilhe atualizações importantes com a comunidade.</p>
            </div>
            <form className={styles.postForm} onSubmit={handleCreatePost}>
              <label className={styles.postLabel} htmlFor="post-title">
                Título
              </label>
              <input
                id="post-title"
                name="title"
                type="text"
                className={styles.postInput}
                placeholder="Título do post"
                defaultValue={formState.title}
                required
                minLength={3}
              />
              <p className={styles.inputHint}>Use pelo menos 3 caracteres para um título descritivo.</p>

              <label className={styles.postLabel} htmlFor="post-content">
                Conteúdo
              </label>
              <textarea
                id="post-content"
                name="content"
                className={styles.postTextarea}
                placeholder="Escreva aqui a mensagem para a comunidade"
                rows={6}
                defaultValue={formState.content}
                required
                minLength={10}
              />
              <p className={styles.inputHint}>Corpo do post deve ter ao menos 10 caracteres.</p>

              <button type="submit" className={styles.primaryButton} disabled={isPending}>
                {isPending ? "Publicando..." : "Publicar"}
              </button>
            </form>
          </section>
        )}

        {activeSection === "posts" && (
          <section className={styles.postsCard} aria-labelledby="manage-posts-heading">
            <div className={styles.cardHeader}>
              <div>
                <h3 id="manage-posts-heading">Administrar posts</h3>
                <p>Revise publicações, encontre conteúdos específicos e remova posts antigos.</p>
              </div>
              <span className={styles.cardBadge}>
                {filteredPosts.length} {filteredPosts.length === 1 ? "post" : "posts"}
              </span>
            </div>

            <div className={styles.sectionControls}>
              <label className={styles.searchLabel} htmlFor={postFilterSectionId}>
                <span className={styles.searchLabelText}>Filtro da sessão</span>
                <input
                  id={postFilterSectionId}
                  type="search"
                  className={styles.searchInput}
                  placeholder="Buscar por título ou autor"
                  value={postQuery}
                  onChange={(event) => setPostQuery(event.target.value)}
                />
              </label>
              {hasPostQuery && (
                <button
                  type="button"
                  className={styles.clearFilterButton}
                  onClick={() => setPostQuery("")}
                >
                  Limpar
                </button>
              )}
            </div>

            {filteredPosts.length === 0 ? (
              <p className={styles.empty}>
                {hasPostQuery ? "Nenhum post encontrado com esse filtro." : "Nenhum post publicado ainda."}
              </p>
            ) : (
              <ul className={styles.postList}>
                {filteredPosts.map((post) => (
                  <li key={post.id} className={styles.postItem}>
                    <div className={styles.postContent}>
                      <div>
                        <p className={styles.postTitle}>{post.title}</p>
                        <p className={styles.postMeta}>
                          {post.author} — {new Date(post.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <button
                        type="button"
                        className={`${styles.postActionButton} ${styles.outlineDangerButton}`}
                        onClick={() => handleDeletePost(post.id, post.title)}
                        aria-label={`Excluir post ${post.title}`}
                      >
                        Excluir
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {activeSection === "users" && (
          <section className={styles.tableWrapper} aria-labelledby="manage-users-heading">
            <div className={styles.tableHeader}>
              <div>
                <h3 id="manage-users-heading">Usuários cadastrados</h3>
                <p className={styles.tableSubtitle}>
                  Exibindo {filteredUsers.length} de {localUsers.length} contas registradas.
                </p>
              </div>
            </div>

            <div className={`${styles.sectionControls} ${styles.sectionControlsTable}`}>
              <label className={styles.searchLabel} htmlFor={userFilterInputId}>
                <span className={styles.searchLabelText}>Filtrar usuários</span>
                <input
                  id={userFilterInputId}
                  type="search"
                  className={styles.searchInput}
                  placeholder="Buscar por nome, e-mail ou papel"
                  value={userQuery}
                  onChange={(event) => setUserQuery(event.target.value)}
                />
              </label>
              {hasUserQuery && (
                <button
                  type="button"
                  className={styles.clearFilterButton}
                  onClick={() => setUserQuery("")}
                >
                  Limpar
                </button>
              )}
            </div>

            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th>Papel</th>
                    <th>Entrou em</th>
                    <th aria-label="Ações" />
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const isSelf = user.id === currentUserId;
                    return (
                      <tr key={user.id}>
                        <td>{user.name ?? "Sem nome"}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={styles.roleBadge}>{user.role}</span>
                        </td>
                        <td>{new Date(user.createdAt).toLocaleDateString("pt-BR")}</td>
                        <td>
                          {!isSelf && (
                            <button
                              type="button"
                              className={styles.outlineDangerButton}
                              onClick={() => handleDeleteUser(user.id, user.email)}
                              aria-label={`Excluir ${user.email}`}
                              disabled={isPending}
                            >
                              Excluir
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <p className={styles.empty}>
                {hasUserQuery ? "Nenhum usuário corresponde ao filtro informado." : "Nenhum usuário encontrado."}
              </p>
            )}
          </section>
        )}
      </div>

      {isMounted &&
        createPortal(
          <div className={styles.toastRegion} aria-live="assertive" role="status">
            {toasts.map((toast) => (
              <Toast key={toast.id} kind={toast.kind} onDismiss={() => dismissToast(toast.id)}>
                {toast.message}
              </Toast>
            ))}
          </div>,
          document.body,
        )}

      {isMounted && confirmDialog && (
        <ConfirmModal
          description={confirmDialog.description}
          onCancel={() => setConfirmDialog(null)}
          onConfirm={executeDeletion}
          isLoading={isPending}
        />
      )}
    </section>
  );
}

interface ToastProps {
  kind: "success" | "error";
  onDismiss: () => void;
  children: React.ReactNode;
}

function Toast({ kind, onDismiss, children }: ToastProps) {
  useEffect(() => {
    const timeout = setTimeout(onDismiss, 4500);
    return () => clearTimeout(timeout);
  }, [onDismiss]);

  return (
    <div className={`${styles.toast} ${kind === "success" ? styles.toastSuccess : styles.toastError}`}>
      <span>{children}</span>
      <button type="button" className={styles.toastClose} onClick={onDismiss} aria-label="Fechar alerta">
        ×
      </button>
    </div>
  );
}

interface ConfirmModalProps {
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

function ConfirmModal({ description, onCancel, onConfirm, isLoading }: ConfirmModalProps) {
  const headingId = `confirm-${Math.random().toString(36).slice(2, 8)}`;

  return createPortal(
    <div className={styles.confirmOverlay} role="presentation" onClick={onCancel}>
      <div
        className={styles.confirmDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        onClick={(event) => event.stopPropagation()}
      >
        <h4 id={headingId} className={styles.confirmTitle}>
          Confirmar exclusão
        </h4>
        <p className={styles.confirmDescription}>{description}</p>
        <div className={styles.confirmActions}>
          <button type="button" className={styles.secondaryButton} onClick={onCancel} disabled={isLoading}>
            Cancelar
          </button>
          <button type="button" className={styles.dangerButton} onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
