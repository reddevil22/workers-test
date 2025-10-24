import { Routes, Route, Link } from "react-router-dom";
import { UsersList } from "./UsersList";
import { UserForm } from "./UserForm";
import styles from "./App.module.css";

export function App() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Admin — User Management</h1>
        <nav>
          <Link to="/">Users</Link> | <Link to="/create">Create</Link>
        </nav>
      </header>
      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<UsersList />} />
          <Route path="/create" element={<UserForm />} />
        </Routes>
      </main>
    </div>
  );
}
