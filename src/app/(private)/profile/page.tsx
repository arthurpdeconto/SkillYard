import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

import styles from "../profile.module.css";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h2 className={styles.heading}>Seu perfil</h2>
        <p className={styles.description}>
          Ajuste suas informações e mantenha a comunidade atualizada.
        </p>
      </header>

      <div className={styles.card}>
        <div className={styles.row}>
          <p className={styles.label}>Nome</p>
          <p className={styles.value}>{session.user.name ?? "Usuário sem nome"}</p>
        </div>
        <div className={styles.row}>
          <p className={styles.label}>E-mail</p>
          <p className={styles.value}>{session.user.email}</p>
        </div>
        <div className={styles.row}>
          <p className={styles.label}>Papel</p>
          <span className={styles.badge}>{session.user.role}</span>
        </div>
      </div>
    </section>
  );
}
