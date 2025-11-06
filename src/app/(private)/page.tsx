import Link from "next/link";

import { prisma } from "@/lib/prisma";

import styles from "./page.module.css";
import { CreatePostCard } from "./create-post-card";
import { PostsList } from "./posts-list";
import { SearchPostsInput } from "./search-posts-input";

export const revalidate = 0;

interface SearchParams {
  q?: string;
}

interface PostPreview {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  author: { name: string | null } | null;
}

function isPromise<T>(value: unknown): value is Promise<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "then" in value &&
    typeof (value as { then?: unknown }).then === "function"
  );
}

interface HomePageProps {
  searchParams?: SearchParams | Promise<SearchParams>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = isPromise<SearchParams>(searchParams) ? await searchParams : searchParams;
  const queryParam = typeof resolvedSearchParams?.q === "string" ? resolvedSearchParams.q.trim() : "";
  const isFiltering = queryParam.length > 0;

  const posts: PostPreview[] = await prisma.post.findMany({
    where: {
      published: true,
      ...(isFiltering
        ? {
            OR: [
              { title: { contains: queryParam, mode: "insensitive" } },
              { content: { contains: queryParam, mode: "insensitive" } },
              { author: { name: { contains: queryParam, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
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
        <h2 className={styles.heading}>Habilidades recentes</h2>
        <p className={styles.description}>
          Conteúdos produzidos pela comunidade para estimular novos conhecimentos e trocas.
        </p>
      </header>

      <div className={styles.toolbar}>
        <form className={styles.searchForm} role="search" method="get">
          <label className={styles.searchLabel} htmlFor="search-posts">
            <span className={styles.searchLegend}>Filtrar posts rapidamente</span>
            <SearchPostsInput initialQuery={queryParam} />
          </label>
        </form>

        {isFiltering && (
          <Link href="/" className={styles.clearFilters}>
            Limpar filtro
          </Link>
        )}
      </div>

      <CreatePostCard />

      <PostsList
        posts={posts.map((post) => ({
          id: post.id,
          title: post.title,
          content: post.content,
          authorLabel: post.author?.name ?? "Equipe SkillYard",
          createdAt: post.createdAt.toISOString(),
        }))}
        emptyMessage={
          isFiltering
            ? "Nenhum post corresponde ao filtro aplicado. Tente palavras-chave diferentes."
            : "Nenhum conteúdo publicado ainda. Que tal escrever o primeiro?"
        }
      />
    </section>
  );
}
