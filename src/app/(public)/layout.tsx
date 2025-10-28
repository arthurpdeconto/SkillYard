import styles from "./layout.module.css";

type PublicLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className={styles.wrapper}>
      <main className={styles.panel}>
        {children}
      </main>
    </div>
  );
}
