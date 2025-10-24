import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usersUpdates$ } from "./services/realtime";
import styles from "./UsersList.module.css";

type User = {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
};

async function fetchUsers() {
  const res = await fetch("/api/users");
  if (!res.ok) throw new Error("Failed to fetch users");
  const data = await res.json();
  return data.users;
}

export function UsersList() {
  const queryClient = useQueryClient();
  const {
    data: users,
    isLoading,
    error,
  } = useQuery<User[]>({ queryKey: ["users"], queryFn: fetchUsers });

  useEffect(() => {
    const sub = usersUpdates$.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    });
    return () => sub.unsubscribe();
  }, [queryClient]);

  if (isLoading) return <div className={styles.loading}>Loading…</div>;
  if (error) return <div className={styles.error}>{String(error)}</div>;

  return (
    <div className={styles.list}>
      <h2>Users</h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {users?.map((u: User) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>
                {u.first_name} {u.last_name}
              </td>
              <td>{u.email}</td>
              <td>{u.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
