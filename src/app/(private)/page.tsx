import { prisma } from "@/lib/prisma";

import styles from "./page.module.css";

export const revalidate = 0;

export default async function HomePage() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      content: true,
      createdAt: true,
      author: {
        select: {
          name: true,
        },
      },
    },
  });

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h2 className={styles.heading}>Posts recentes</h2>
        <p className={styles.description}>
          Conteúdos produzidos pela comunidade para estimular novas conexões e trocas.
        </p>
      </header>

      <div className={styles.grid}>
        {posts.map((post) => (
          <article key={post.id} className={styles.card}>
            <div className={styles.meta}>
              <span>{post.author?.name ?? "Equipe SkillYard"}</span>
              <time dateTime={post.createdAt.toISOString()}>
                {post.createdAt.toLocaleDateString("pt-BR")}
              </time>
            </div>
            <h3 className={styles.cardTitle}>{post.title}</h3>
            <p className={styles.cardContent}>{post.content}</p>
          </article>
        ))}

        {posts.length === 0 && (
          <div className={styles.empty}>
            Nenhum conteúdo publicado ainda. Admins podem criar o primeiro post na área
            administrativa.
          </div>
        )}
      </div>
    </section>
  );
}
