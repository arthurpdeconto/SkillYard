"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import styles from "./page.module.css";
import { createPostAction } from "./posts/actions";

type FeedbackState =
  | { kind: "success"; message: string }
  | { kind: "error"; message: string }
  | null;

export function CreatePostCard() {
  const [formState, setFormState] = useState({ title: "", content: "" });
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [isPending, startTransition] = useTransition();

  const isSubmitDisabled = useMemo(() => {
    const title = formState.title.trim();
    const content = formState.content.trim();
    return title.length < 3 || content.length < 10;
  }, [formState]);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timeout = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timeout);
  }, [feedback]);

  function updateField(field: "title" | "content") {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setFormState((prev) => ({ ...prev, [field]: value }));
    };
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submission = new FormData(event.currentTarget);

    startTransition(() => {
      void createPostAction(submission)
        .then(() => {
          setFormState({ title: "", content: "" });
          setFeedback({ kind: "success", message: "Post publicado com sucesso!" });
        })
        .catch((error: unknown) => {
          const message =
            error instanceof Error && error.message ? error.message : "Não foi possível publicar o post.";
          setFeedback({ kind: "error", message });
        });
    });
  }

  return (
    <section className={styles.createCard} aria-labelledby="create-post-heading">
      <div className={styles.createHeader}>
        <h3 id="create-post-heading">Compartilhe uma novidade</h3>
        <p>Divulgue oportunidades, vitórias pessoais ou dicas que possam ajudar a comunidade.</p>
      </div>

      {feedback && (
        <p
          className={`${styles.createFeedback} ${
            feedback.kind === "success" ? styles.createFeedbackSuccess : styles.createFeedbackError
          }`}
          role="status"
        >
          {feedback.message}
        </p>
      )}

      <form className={styles.createForm} onSubmit={handleSubmit}>
        <label className={styles.createLabel} htmlFor="home-post-title">
          Título
        </label>
        <input
          id="home-post-title"
          name="title"
          type="text"
          className={styles.createInput}
          placeholder="Ex.: Networking na próxima semana"
          value={formState.title}
          onChange={updateField("title")}
          disabled={isPending}
          minLength={3}
          required
        />
        <p className={styles.createHint}>Use pelo menos 3 caracteres.</p>

        <label className={styles.createLabel} htmlFor="home-post-content">
          Conteúdo
        </label>
        <textarea
          id="home-post-content"
          name="content"
          className={styles.createTextarea}
          placeholder="Compartilhe detalhes, links úteis e o contexto para a comunidade."
          value={formState.content}
          onChange={updateField("content")}
          disabled={isPending}
          rows={5}
          minLength={10}
          required
        />
        <p className={styles.createHint}>Corpo do post deve conter ao menos 10 caracteres.</p>

        <div className={styles.createActions}>
          <button type="submit" className={styles.createSubmit} disabled={isPending || isSubmitDisabled}>
            {isPending ? "Publicando..." : "Publicar post"}
          </button>
        </div>
      </form>
    </section>
  );
}
