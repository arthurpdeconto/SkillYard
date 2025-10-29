"use client";

import type { Route } from "next";
import { type ChangeEvent, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import styles from "./page.module.css";

interface SearchPostsInputProps {
  initialQuery: string;
}

export function SearchPostsInput({ initialQuery }: SearchPostsInputProps) {
  const router = useRouter();
  const rawPathname = usePathname();
  const pathname = (rawPathname ?? "/") as Route;
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setValue(initialQuery);
  }, [initialQuery]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value;
    setValue(nextValue);

    startTransition(() => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");

      if (nextValue.trim()) {
        params.set("q", nextValue);
      } else {
        params.delete("q");
      }

      const queryString = params.toString();
      const nextUrl = (queryString ? `${pathname}?${queryString}` : pathname) as Route;

      router.replace(nextUrl, { scroll: false });
    });
  }

  return (
    <div className={`${styles.searchControl} ${isPending ? styles.searchControlPending : ""}`}>
      <input
        id="search-posts"
        name="q"
        type="search"
        placeholder="Busque por título, conteúdo ou autor"
        value={value}
        onChange={handleChange}
        className={styles.searchInput}
        aria-label="Filtrar posts rapidamente"
      />
      {isPending && <span className={styles.searchSpinner} aria-hidden="true" />}
    </div>
  );
}
