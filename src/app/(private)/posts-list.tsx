"use client";

import { useEffect, useMemo, useState } from "react";

import styles from "./page.module.css";

interface PostCardData {
  id: string;
  title: string;
  content: string;
  authorLabel: string;
  createdAt: string;
}

interface PostsListProps {
  posts: PostCardData[];
  emptyMessage: string;
}

export function PostsList({ posts, emptyMessage }: PostsListProps) {
  const [activePost, setActivePost] = useState<PostCardData | null>(null);

  useEffect(() => {
    if (!activePost) {
      return;
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActivePost(null);
      }
    }

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [activePost]);

  const overlayDate = useMemo(() => {
    if (!activePost) {
      return null;
    }
    return new Date(activePost.createdAt).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, [activePost]);

  return (
    <>
      <div className={styles.grid}>
        {posts.map((post) => {
          const createdAtLabel = new Date(post.createdAt).toLocaleDateString("pt-BR");
          return (
            <article
              key={post.id}
              className={`${styles.card} ${styles.clickableCard}`}
              role="button"
              tabIndex={0}
              onClick={() => setActivePost(post)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setActivePost(post);
                }
              }}
            >
              <div className={styles.meta}>
                <span>{post.authorLabel}</span>
                <time dateTime={post.createdAt}>{createdAtLabel}</time>
              </div>
              <h3 className={styles.cardTitle}>{post.title}</h3>
              <p className={styles.cardContent}>
                {post.content.length > 280 ? `${post.content.slice(0, 280)}…` : post.content}
              </p>
            </article>
          );
        })}

        {posts.length === 0 && (
          <div className={styles.empty}>
            {emptyMessage}
          </div>
        )}
      </div>

      {activePost && (
        <div className={styles.modalOverlay} role="presentation" onClick={() => setActivePost(null)}>
          <article
            className={styles.modalContent}
            role="dialog"
            aria-modal="true"
            aria-labelledby="post-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className={styles.modalHeader}>
              <div>
                <p className={styles.modalMeta}>
                  {activePost.authorLabel} — {overlayDate}
                </p>
                <h2 id="post-modal-title" className={styles.modalTitle}>
                  {activePost.title}
                </h2>
              </div>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setActivePost(null)}
                aria-label="Fechar post"
              >
                ×
              </button>
            </header>
            <div className={styles.modalBody}>
              <p>{activePost.content}</p>
            </div>
          </article>
        </div>
      )}
    </>
  );
}
