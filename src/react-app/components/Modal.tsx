import styles from "./Modal.module.css";

type ModalProps = {
  open: boolean;
  title?: string;
  message?: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
};

export function Modal({
  open,
  title,
  message,
  type = "info",
  onClose,
}: ModalProps) {
  if (!open) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={`${styles.modal} ${styles[type]}`}>
        <header className={styles.header}>
          <h3>{title}</h3>
        </header>
        <div className={styles.body}>{message}</div>
        <footer className={styles.footer}>
          <button className={styles.button} onClick={onClose}>
            OK
          </button>
        </footer>
      </div>
    </div>
  );
}
