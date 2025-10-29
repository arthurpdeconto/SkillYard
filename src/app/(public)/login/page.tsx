"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

import styles from "../auth.module.css";

interface Toast {
  id: number;
  message: string;
  kind: "success" | "error";
}

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useState({ current: 0 })[0];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const callbackUrl = searchParams.get("callbackUrl") ?? "/";

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl,
    });

    if (result?.error) {
      pushToast("Credenciais inválidas.", "error");
      setIsSubmitting(false);
      return;
    }

    pushToast("Login realizado com sucesso!", "success");
    setTimeout(() => {
      window.location.href = callbackUrl;
    }, 600);
  }

  function pushToast(message: string, kind: "success" | "error") {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => dismissToast(id), 4000);
  }

  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
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

      {toasts.length > 0 && (
        <div className={styles.toastRegion} aria-live="assertive" role="status">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`${styles.toast} ${
                toast.kind === "success" ? styles.toastSuccess : styles.toastError
              }`}
            >
              <span>{toast.message}</span>
              <button
                type="button"
                className={styles.toastClose}
                onClick={() => dismissToast(toast.id)}
                aria-label="Fechar mensagem"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
