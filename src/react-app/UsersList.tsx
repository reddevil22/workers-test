import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import styles from "./UsersList.module.css";
import { fetchUsers } from "./services/Api";

export function UsersList() {
  const { data, error, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        Loading users...
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <div className={styles.errorIcon}>⚠️</div>
        <div>
          <strong>Error loading users</strong>
          <br />
          {(error as Error).message}
        </div>
      </div>
    );
  }

  const users = data || [];

  return (
    <div className={styles.listContainer}>
      <div className={styles.listHeader}>
        <div>
          <h2 className={styles.listTitle}>Users</h2>
          <p className={styles.listDescription}>
            Manage your application users and their permissions
          </p>
        </div>
        <div className={styles.listActions}>
          <Link to="/create" className={styles.addButton}>
            <span>+</span>
            Add User
          </Link>
        </div>
      </div>

      {users.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>👥</div>
          <h3 className={styles.emptyStateTitle}>No users found</h3>
          <p className={styles.emptyStateDescription}>
            Get started by creating your first user account.
          </p>
          <Link to="/create" className={styles.addButton}>
            <span>+</span>
            Create Your First User
          </Link>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>
                      {user.first_name} {user.last_name}
                    </strong>
                  </td>
                  <td>
                    <a
                      href={`mailto:${user.email}`}
                      className={styles.userEmail}
                    >
                      {user.email}
                    </a>
                  </td>
                  <td>
                    <span
                      className={`${styles.userRole} ${
                        styles[user.role as "admin" | "user"]
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <Link
                      to={`/users/${user.id}/edit`}
                      className={styles.addButton}
                      style={{
                        padding: "var(--space-2) var(--space-3)",
                        fontSize: "var(--text-sm)",
                        minHeight: "auto",
                      }}
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
