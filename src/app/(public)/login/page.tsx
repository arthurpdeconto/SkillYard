"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

import styles from "../auth.module.css";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const callbackUrl = searchParams.get("callbackUrl") ?? "/";

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl,
    });

    if (result?.error) {
      setError("Credenciais inválidas.");
      setIsSubmitting(false);
      return;
    }

    window.location.href = callbackUrl;
  }

  return (
    <div className={styles.stack}>
      <header className={styles.header}>
        <h1 className={styles.title}>Bem-vindo ao SkillYard</h1>
        <p className={styles.subtitle}>
          Acesse com seu e-mail para entrar na sua comunidade de troca de habilidades.
        </p>
      </header>

      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.field}>
          <span>E-mail</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={styles.input}
            required
          />
        </label>

        <label className={styles.field}>
          <span>Senha</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={styles.input}
            required
          />
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" className={styles.button} disabled={isSubmitting}>
          {isSubmitting ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className={styles.footer}>
        Precisa de uma conta?{" "}
        <a href="/register" className={styles.link}>
          Cadastre-se
        </a>
      </p>
    </div>
  );
}
