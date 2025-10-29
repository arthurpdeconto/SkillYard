"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

import styles from "./layout.module.css";

interface NavigationItem {
  href: string;
  label: string;
}

interface LayoutClientProps {
  links: NavigationItem[];
}

export function LayoutClient({ links }: LayoutClientProps) {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <div className={styles.brand}>
          <p className={styles.brandCaption}>SkillYard</p>
          <h1 className={styles.brandTitle}>Troque habilidades, construa conexões</h1>
        </div>
        <nav className={styles.nav} aria-label="Navegação principal">
          {links.map((item) => (
            <Link key={item.href} href={item.href} className={styles.navLink}>
              {item.label}
            </Link>
          ))}
          <button type="button" className={styles.logoutButton} onClick={() => signOut({ callbackUrl: "/login" })}>
            Sair
          </button>
        </nav>
      </div>
    </header>
  );
}
