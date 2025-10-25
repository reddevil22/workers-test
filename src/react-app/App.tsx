import { Routes, Route, Link, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { UsersList } from "./UsersList";
import { UserForm } from "./UserForm";
import {
  LoginForm,
  CustomerList,
  CustomerForm,
  CustomerDetail,
} from "./components";
import { authStore } from "./services/AuthStore";
import styles from "./App.module.css";

function ProtectedRoute({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const subscription = authStore
      .isAuthenticated$()
      .subscribe(setIsAuthenticated);
    const adminSubscription = authStore.isAdmin$().subscribe(setIsAdmin);

    return () => {
      subscription.unsubscribe();
      adminSubscription.unsubscribe();
    };
  }, []);

  if (isAuthenticated === null || isAdmin === null) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className={styles.error}>
        <div className={styles.errorIcon}>🚫</div>
        <div>
          <strong>Access Denied</strong>
          <br />
          You need admin privileges to access this page.
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    authStore.initialize();
    const subscription = authStore
      .isAuthenticated$()
      .subscribe(setIsAuthenticated);

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.container}>
        <LoginForm onSuccess={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>User Management</h1>
          <p className={styles.subtitle}>Manage your application users</p>
        </div>
        <nav className={styles.nav}>
          <Link to="/" className="active">
            Users
          </Link>
          <Link to="/create">Create User</Link>
          <Link to="/customers">Customers</Link>
          <Link to="/customers/create">Create Customer</Link>
          <button
            onClick={() => authStore.logout()}
            className={styles.logoutButton}
          >
            Logout
          </button>
        </nav>
      </header>
      <main className={styles.main}>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute requireAdmin={true}>
                <UsersList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create"
            element={
              <ProtectedRoute requireAdmin={true}>
                <UserForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users/:id"
            element={
              <ProtectedRoute>
                <UserForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users/:id/edit"
            element={
              <ProtectedRoute requireAdmin={true}>
                <UserForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <ProtectedRoute requireAdmin={true}>
                <CustomerList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers/create"
            element={
              <ProtectedRoute requireAdmin={true}>
                <CustomerForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers/:id"
            element={
              <ProtectedRoute requireAdmin={true}>
                <CustomerDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers/:id/edit"
            element={
              <ProtectedRoute requireAdmin={true}>
                <CustomerForm />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
