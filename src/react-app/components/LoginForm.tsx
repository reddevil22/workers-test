import { useState } from "react";
import { lastValueFrom } from "rxjs";
import { authStore } from "../services/AuthStore";
import styles from "./LoginForm.module.css";

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await lastValueFrom(authStore.login({ email, password }));
      authStore.clearError();
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <h2 className={styles.loginTitle}>Sign In</h2>
          <p className={styles.loginDescription}>
            Enter your credentials to access your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.loginForm}>
          {error && (
            <div className={styles.errorMessage}>
              <div className={styles.errorIcon}>⚠️</div>
              {error}
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Email Address</label>
            <input
              type="email"
              className={styles.formInput}
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Password</label>
            <input
              type="password"
              className={styles.formInput}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className={styles.spinner}></div>
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className={styles.loginFooter}>
          <p className={styles.footerText}>
            Don't have an account?{" "}
            <button
              type="button"
              className={styles.linkButton}
              onClick={() => {
                // This would typically switch to a register form
                console.log("Switch to register");
              }}
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
