import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usersUpdates$ } from "./services/realtime";
import styles from "./UserForm.module.css";
import { Modal } from "./components";

type CreateUserPayload = {
  first_name?: string | null;
  last_name?: string | null;
  email: string | null;
  role?: string | null;
};

export function UserForm() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | undefined>(
    undefined
  );
  const [modalType, setModalType] = useState<"success" | "error" | "info">(
    "info"
  );

  const create = useMutation({
    mutationFn: async (payload: CreateUserPayload) => {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      usersUpdates$.next();
      setModalType("success");
      setModalMessage("User created successfully");
      setModalOpen(true);
    },
    onError(error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      setModalType("error");
      setModalMessage(msg || "Failed to create user");
      setModalOpen(true);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const payload: CreateUserPayload = {
      first_name: fd.get("first_name") as string | null,
      last_name: fd.get("last_name") as string | null,
      email: fd.get("email") as string | null,
      role: fd.get("role") as string | null,
    };
    create.mutate(payload);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label>
        First name
        <input name="first_name" />
      </label>
      <label>
        Last name
        <input name="last_name" />
      </label>
      <label>
        Email
        <input name="email" type="email" />
      </label>
      <label>
        Role
        <select name="role">
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
      </label>
      <button type="submit">Create</button>
      <Modal
        open={modalOpen}
        title={modalType === "success" ? "Success" : "Error"}
        message={modalMessage}
        type={modalType}
        onClose={() => setModalOpen(false)}
      />
    </form>
  );
}
