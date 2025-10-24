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

  const getIcon = () => {
    switch (type) {
      case "success":
        return "✓";
      case "error":
        return "✕";
      case "info":
      default:
        return "ℹ";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className={`${styles.modal} ${styles[type]}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={`${styles.icon} ${styles[type]}`}>{getIcon()}</div>
            <h3 className={styles.title}>{title}</h3>
          </div>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </header>
        <div className={styles.body}>
          <p className={styles.message}>{message}</p>
        </div>
        <footer className={styles.footer}>
          <button className={styles.button} onClick={onClose} autoFocus>
            OK
          </button>
        </footer>
      </div>
    </div>
  );
}
