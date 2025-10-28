import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Roles } from "@/lib/rbac";

import styles from "./admin-users.module.css";

export const revalidate = 0;

export default async function AdminUsersPage() {
  const session = await auth();

  if (session?.user.role !== Roles.ADMIN) {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: { select: { name: true } },
      createdAt: true,
    },
  });

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div className={styles.copy}>
          <h2 className={styles.heading}>Painel administrativo</h2>
          <p className={styles.description}>
            Gerencie usuários, promova colaboradores e acompanhe novas contas.
          </p>
        </div>
        <Link href="/" className={styles.primaryLink}>
          Ver posts
        </Link>
      </header>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Papel</th>
              <th>Entrou em</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name ?? "Sem nome"}</td>
                <td>{user.email}</td>
                <td>
                  <span className={styles.roleBadge}>{user.role?.name ?? Roles.USER}</span>
                </td>
                <td>{user.createdAt.toLocaleDateString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <p className={styles.empty}>Nenhum usuário encontrado. Execute o seed para gerar um administrador padrão.</p>
        )}
      </div>
    </section>
  );
}
