import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { Roles } from "@/lib/rbac";

import styles from "./layout.module.css";

type PrivateLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

const navigation = [
  { href: "/", label: "Início" },
  { href: "/profile", label: "Perfil" },
  { href: "/chat", label: "Chat" },
  { href: "/admin/users", label: "Admin" },
];

export default async function PrivateLayout({ children }: PrivateLayoutProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const links = session.user.role === Roles.ADMIN
    ? navigation
    : navigation.filter((item) => item.href !== "/admin/users");

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <p className={styles.brandCaption}>SkillYard</p>
            <h1 className={styles.brandTitle}>Troque habilidades, construa conexões</h1>
          </div>
          <nav className={styles.nav}>
            {links.map((item) => (
              <Link key={item.href} href={item.href} className={styles.navLink}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
