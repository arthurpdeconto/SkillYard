"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import styles from "../auth.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  function updateField(field: "name" | "email" | "password") {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.message ?? "Não foi possível concluir o cadastro.");
      setIsSubmitting(false);
      return;
    }

    router.push("/login");
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

        {error && <p className={styles.error}>{error}</p>}

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
    </div>
  );
}
