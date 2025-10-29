"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import styles from "../auth.module.css";

interface ToastState {
  id: number;
  message: string;
  kind: "success" | "error";
}

export default function RegisterPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const toastIdRef = useState({ current: 0 })[0];

  function updateField(field: keyof typeof form) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    if (form.password !== form.confirmPassword) {
      pushToast("As senhas devem ser iguais.", "error");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      name: form.name,
      email: form.email,
      password: form.password,
    };

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      pushToast(result?.message ?? "Não foi possível concluir o cadastro.", "error");
      setIsSubmitting(false);
      return;
    }

    pushToast("Conta criada com sucesso!", "success");
    setTimeout(() => router.push("/login"), 800);
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
        <h1 className={styles.title}>Cadastre-se</h1>
        <p className={styles.subtitle}>
          Crie sua conta para trocar habilidades com a comunidade SkillYard.
        </p>
      </header>

      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.field}>
          <span>Nome completo</span>
          <input
            type="text"
            value={form.name}
            onChange={updateField("name")}
            className={styles.input}
            required
          />
        </label>

        <label className={styles.field}>
          <span>E-mail</span>
          <input
            type="email"
            value={form.email}
            onChange={updateField("email")}
            className={styles.input}
            required
          />
        </label>

        <label className={styles.field}>
          <span>Senha</span>
          <input
            type="password"
            value={form.password}
            onChange={updateField("password")}
            className={styles.input}
            required
            minLength={8}
          />
        </label>

        <label className={styles.field}>
          <span>Confirmar senha</span>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={updateField("confirmPassword")}
            className={styles.input}
            required
            minLength={8}
          />
        </label>

        <button type="submit" className={styles.button} disabled={isSubmitting}>
          {isSubmitting ? "Cadastrando..." : "Criar conta"}
        </button>
      </form>

      <p className={styles.footer}>
        Já possui cadastro?{" "}
        <a href="/login" className={styles.link}>
          Faça login
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
