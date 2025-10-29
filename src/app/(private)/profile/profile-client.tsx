"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";

import styles from "../profile.module.css";

type ModalType = "name" | "password" | "delete" | null;

type ToastKind = "success" | "error";

interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ProfileFormProps {
  user: {
    name: string | null;
    email: string | null;
    role: string;
  };
  onUpdate: (formData: FormData) => Promise<{
    success?: boolean;
    error?: string;
    data?: { name?: string | null; email?: string | null; role?: string | null };
  }>;
  onDelete: () => Promise<void>;
}

const TOAST_DURATION = 5000;

export function ProfileClient({ user, onUpdate, onDelete }: ProfileFormProps) {
  const [profile, setProfile] = useState({
    name: user.name ?? "",
    email: user.email ?? "",
    role: user.role,
  });
  const [openModal, setOpenModal] = useState<ModalType>(null);
  const [pendingAction, setPendingAction] = useState<ModalType>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setProfile({
      name: user.name ?? "",
      email: user.email ?? "",
      role: user.role,
    });
  }, [user.name, user.email, user.role]);

  const isNamePending = isPending && pendingAction === "name";
  const isPasswordPending = isPending && pendingAction === "password";
  const isDeletePending = isPending && pendingAction === "delete";

  function addToast(message: string, kind: ToastKind) {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, kind }]);
  }

  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }

  function handleUpdateSuccess(
    next?: { name?: string | null; email?: string | null; role?: string | null },
    message = "Informações atualizadas com sucesso!",
  ) {
    if (next) {
      setProfile((prev) => ({
        name: next.name ?? prev.name,
        email: next.email ?? prev.email,
        role: next.role ?? prev.role,
      }));
    }
    addToast(message, "success");
    setOpenModal(null);
  }

  function handleError(message: string) {
    addToast(message, "error");
  }

  function handleNameSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = (formData.get("name") ?? "").toString().trim();

    if (!name) {
      handleError("Informe um nome válido.");
      return;
    }

    const payload = new FormData();
    payload.append("name", name);

    startTransition(() => {
      setPendingAction("name");
      void onUpdate(payload)
        .then((result) => {
          if (result?.error) {
            handleError(result.error);
          } else {
            handleUpdateSuccess(result?.data);
          }
        })
        .catch(() => handleError("Não foi possível atualizar o perfil."))
        .finally(() => {
          setPendingAction(null);
        });
    });
  }

  function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = (formData.get("password") ?? "").toString();
    const confirmPassword = (formData.get("confirmPassword") ?? "").toString();

    if (password.length < 8) {
      handleError("Utilize pelo menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      handleError("As senhas devem ser iguais.");
      return;
    }

    const payload = new FormData();
    payload.append("password", password);
    payload.append("confirmPassword", confirmPassword);

    startTransition(() => {
      setPendingAction("password");
      void onUpdate(payload)
        .then((result) => {
          if (result?.error) {
            handleError(result.error);
          } else {
            handleUpdateSuccess(result?.data, "Senha atualizada com sucesso!");
          }
        })
        .catch(() => handleError("Não foi possível atualizar a senha."))
        .finally(() => {
          setPendingAction(null);
        });
    });
  }

  function handleDeleteConfirm() {
    startTransition(() => {
      setPendingAction("delete");
      void onDelete().catch((error) => {
        if (error instanceof Error && "digest" in error) {
          throw error;
        }
        setPendingAction(null);
        handleError("Não foi possível excluir a conta.");
      });
    });
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h2 className={styles.heading}>Seu perfil</h2>
        <p className={styles.description}>
          Ajuste suas informações e mantenha a comunidade atualizada.
        </p>
      </header>

      <div className={styles.cards}>
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Informações pessoais</h3>
            <p className={styles.cardDescription}>
              Nome e e-mail visíveis para outros membros.
            </p>
          </div>

          <div className={styles.fieldList}>
            <div className={styles.fieldRow}>
              <div className={styles.fieldInfo}>
                <span className={styles.fieldLabel}>Nome</span>
                <span className={styles.fieldValue}>{profile.name || "Usuário sem nome"}</span>
              </div>
              <button
                type="button"
                className={styles.editButton}
                onClick={() => setOpenModal("name")}
              >
                <EditIcon className={styles.editIcon} />
                Editar nome
              </button>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.fieldInfo}>
                <span className={styles.fieldLabel}>E-mail</span>
                <span className={styles.fieldValue}>{profile.email}</span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Segurança</h3>
            <p className={styles.cardDescription}>
              Mantenha sua conta segura com uma senha forte.
            </p>
          </div>

          <div className={styles.fieldList}>
            <div className={styles.fieldRow}>
              <div className={styles.fieldInfo}>
                <span className={styles.fieldLabel}>Senha</span>
                <span className={styles.fieldValue}>••••••••</span>
              </div>
              <button
                type="button"
                className={styles.editButton}
                onClick={() => setOpenModal("password")}
              >
                <EditIcon className={styles.editIcon} />
                Alterar senha
              </button>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.fieldInfo}>
                <span className={styles.fieldLabel}>Papel</span>
                <span className={styles.badge}>{profile.role}</span>
              </div>
            </div>
          </div>
        </section>

        <section className={`${styles.card} ${styles.dangerCard}`}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Excluir conta</h3>
            <p className={styles.cardDescription}>
              Esta ação é permanente e não pode ser desfeita.
            </p>
          </div>
          <button
            type="button"
            className={styles.dangerButton}
            onClick={() => setOpenModal("delete")}
            disabled={isDeletePending}
          >
            {isDeletePending ? "Excluindo..." : "Excluir conta"}
          </button>
        </section>
      </div>

      {createPortal(
        <div className={styles.toastRegion} aria-live="assertive" role="status">
          {toasts.map((toast) => (
            <Toast key={toast.id} kind={toast.kind} onDismiss={() => dismissToast(toast.id)}>
              {toast.message}
            </Toast>
          ))}
        </div>,
        document.body,
      )}

      {openModal === "name" && (
        <Modal
          title="Editar nome"
          description="Atualize como deseja ser identificado pela comunidade."
          onClose={() => setOpenModal(null)}
        >
          <form className={`${styles.modalForm} ${styles.modalBody}`} onSubmit={handleNameSubmit}>
            <div className={styles.modalFormGroup}>
              <label className={styles.modalLabel} htmlFor="modal-name">
                Nome completo
              </label>
              <input
                id="modal-name"
                name="name"
                type="text"
                defaultValue={profile.name}
                className={styles.modalInput}
                minLength={2}
                required
                autoFocus
              />
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setOpenModal(null)}
              >
                Cancelar
              </button>
              <button type="submit" className={styles.primaryButton} disabled={isNamePending}>
                {isNamePending ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {openModal === "password" && (
        <Modal
          title="Atualizar senha"
          description="Use uma senha forte com ao menos 8 caracteres."
          onClose={() => setOpenModal(null)}
        >
          <form className={`${styles.modalForm} ${styles.modalBody}`} onSubmit={handlePasswordSubmit}>
            <div className={styles.modalFormGroup}>
              <label className={styles.modalLabel} htmlFor="modal-password">
                Nova senha
              </label>
              <input
                id="modal-password"
                name="password"
                type="password"
                className={styles.modalInput}
                minLength={8}
                required
                autoFocus
                autoComplete="new-password"
              />
              <p className={styles.modalHint}>Use pelo menos 8 caracteres com letras e números.</p>
            </div>
            <div className={styles.modalFormGroup}>
              <label className={styles.modalLabel} htmlFor="modal-confirm-password">
                Confirmar senha
              </label>
              <input
                id="modal-confirm-password"
                name="confirmPassword"
                type="password"
                className={styles.modalInput}
                minLength={8}
                required
                autoComplete="new-password"
              />
              <p className={styles.modalHint}>Repita a senha para garantir que está correta.</p>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setOpenModal(null)}
                disabled={isPasswordPending}
              >
                Cancelar
              </button>
              <button type="submit" className={styles.primaryButton} disabled={isPasswordPending}>
                {isPasswordPending ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {openModal === "delete" && (
        <Modal
          title="Excluir conta"
          description="Essa ação remove permanentemente seus dados e sessões ativas."
          onClose={() => setOpenModal(null)}
        >
          <div className={styles.modalBody}>
            <p>
              Tem certeza de que deseja continuar? Você precisará criar uma nova conta para acessar o
              SkillYard novamente.
            </p>
          </div>
          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setOpenModal(null)}
              disabled={isDeletePending}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={styles.dangerButton}
              onClick={handleDeleteConfirm}
              disabled={isDeletePending}
            >
              {isDeletePending ? "Excluindo..." : "Excluir definitivamente"}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}

interface ModalProps {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
}

function Modal({ title, description, onClose, children }: ModalProps) {
  const headingId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  return createPortal(
    <div className={styles.modalOverlay} role="presentation" onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={description ? descriptionId : undefined}
        onClick={(event) => event.stopPropagation()}
        tabIndex={-1}
        ref={dialogRef}
      >
        <div className={styles.modalHeader}>
          <div>
            <h3 id={headingId} className={styles.modalTitle}>
              {title}
            </h3>
            {description ? (
              <p id={descriptionId} className={styles.modalDescription}>
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className={styles.modalClose}
            aria-label="Fechar modal"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M4.5 12.5 12.9 4.1a1.25 1.25 0 0 1 1.77 0l1.23 1.24a1.25 1.25 0 0 1 0 1.76l-8.4 8.4a1 1 0 0 1-.51.27l-3.1.55a.5.5 0 0 1-.58-.58l.55-3.1a1 1 0 0 1 .27-.53Z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className={styles.editIcon}>
      <path d="M5.23 4.21a.75.75 0 1 0-1.06 1.06L8.94 10l-4.77 4.73a.75.75 0 1 0 1.06 1.06L10 11.06l4.73 4.73a.75.75 0 1 0 1.06-1.06L11.06 10l4.73-4.73a.75.75 0 0 0-1.06-1.06L10 8.94 5.23 4.21Z" />
    </svg>
  );
}

interface ToastProps {
  kind: ToastKind;
  onDismiss: () => void;
  children: React.ReactNode;
}

function Toast({ kind, onDismiss, children }: ToastProps) {
  useEffect(() => {
    const timeout = setTimeout(onDismiss, TOAST_DURATION);
    return () => clearTimeout(timeout);
  }, [onDismiss]);

  return (
    <div
      className={`${styles.toast} ${kind === "success" ? styles.toastSuccess : styles.toastError}`}
      role={kind === "error" ? "alert" : "status"}
    >
      <span>{children}</span>
      <button type="button" className={styles.toastClose} onClick={onDismiss} aria-label="Fechar alerta">
        <CloseIcon />
      </button>
    </div>
  );
}
