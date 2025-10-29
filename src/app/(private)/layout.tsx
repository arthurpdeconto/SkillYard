import type { Route } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { Roles } from "@/lib/rbac";

import styles from "./layout.module.css";
import { LayoutClient } from "./layout-client";

type PrivateLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

const navigation: ReadonlyArray<{ href: Route; label: string }> = [
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
      <LayoutClient links={links} />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
