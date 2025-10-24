import { Routes, Route, Link, Navigate } from "react-router-dom";
import { UsersList } from "./UsersList";
import { UserForm } from "./UserForm";
import styles from "./App.module.css";

export function App() {
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
        </nav>
      </header>
      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<UsersList />} />
          <Route path="/create" element={<UserForm />} />
          <Route path="/users/:id" element={<UserForm />} />
          <Route path="/users/:id/edit" element={<UserForm />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
