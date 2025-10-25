import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersUpdates$ } from "./services/realtime";
import styles from "./UserForm.module.css";
import { Modal } from "./components";
import { useParams, useNavigate } from "react-router-dom";
import { fetchUser, createUser, updateUser } from "./services/Api";

type UserPayload = {
  first_name?: string | null;
  last_name?: string | null;
  email: string | null;
  role?: string | null;
  password?: string;
};

export function UserForm() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const params = useParams();
  const isEdit = !!params.id;

  const {
    data: user,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["user", params.id],
    queryFn: () => fetchUser(params.id!),
    enabled: isEdit,
  });

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");

  // Update form state when user data loads
  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setEmail(user.email || "");
      setRole(user.role || "user");
    }
  }, [user]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | undefined>(
    undefined
  );
  const [modalType, setModalType] = useState<"success" | "error" | "info">(
    "info"
  );

  const create = useMutation({
    mutationFn: createUser,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      usersUpdates$.next();
      setModalType("success");
      setModalMessage("User created successfully");
      setModalOpen(true);
      setTimeout(() => {
        navigate("/");
      }, 1500);
    },
    onError(error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      setModalType("error");
      setModalMessage(msg || "Failed to create user");
      setModalOpen(true);
    },
  });

  const update = useMutation({
    mutationFn: ({ id, ...userData }: UserPayload & { id: string }) =>
      updateUser(id, userData),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", params.id] });
      usersUpdates$.next();
      setModalType("success");
      setModalMessage("User updated successfully");
      setModalOpen(true);
      setTimeout(() => {
        navigate("/");
      }, 1500);
    },
    onError(error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      setModalType("error");
      setModalMessage(msg || "Failed to update user");
      setModalOpen(true);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEdit) {
      const updatePayload: UserPayload = {
        first_name: firstName || null,
        last_name: lastName || null,
        email: email || "",
        role: role || null,
      };
      update.mutate({ ...updatePayload, id: params.id! });
    } else {
      const createPayload = {
        first_name: firstName || null,
        last_name: lastName || null,
        email: email || "",
        role: role || null,
        password: password || "",
      };
      create.mutate(createPayload);
    }
  };

  if (isEdit && isLoading) {
    return (
      <div className={styles.formContainer}>
        <div className={styles.formHeader}>
          <h2 className={styles.formTitle}>Loading User...</h2>
        </div>
        <div className={styles.loading}>Loading user details...</div>
      </div>
    );
  }

  if (isEdit && error) {
    return (
      <div className={styles.formContainer}>
        <div className={styles.formHeader}>
          <h2 className={styles.formTitle}>Error</h2>
        </div>
        <div className={styles.error}>
          <div className={styles.errorIcon}>⚠️</div>
          <div>
            <strong>Error loading user</strong>
            <br />
            {(error as Error).message}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <h2 className={styles.formTitle}>
          {isEdit ? "Edit User" : "Create New User"}
        </h2>
        <p className={styles.formDescription}>
          {isEdit
            ? "Update user information and permissions"
            : "Add a new user to your application"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>First Name</label>
          <input
            name="first_name"
            className={styles.formInput}
            placeholder="Enter first name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Last Name</label>
          <input
            name="last_name"
            className={styles.formInput}
            placeholder="Enter last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            Email Address
            <span className={styles.required}>*</span>
          </label>
          <input
            name="email"
            type="email"
            className={styles.formInput}
            placeholder="user@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p className={styles.formHelp}>
            We'll never share your email with anyone else.
          </p>
        </div>

        {!isEdit && (
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Password
              <span className={styles.required}>*</span>
            </label>
            <input
              name="password"
              type="password"
              className={styles.formInput}
              placeholder="Enter password"
              required={!isEdit}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className={styles.formHelp}>
              Password must be at least 6 characters long.
            </p>
          </div>
        )}

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            User Role
            <span className={styles.required}>*</span>
          </label>
          <select
            name="role"
            className={styles.formSelect}
            required
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="">Select a role</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <p className={styles.formHelp}>
            Admin users can manage other users and settings.
          </p>
        </div>

        <div className={styles.formActions}>
          <button
            type="submit"
            className={styles.formButton}
            disabled={create.isPending || update.isPending}
            style={{
              backgroundColor: "var(--primary-600)",
              color: "white",
              borderColor: "var(--primary-600)",
            }}
          >
            {create.isPending || update.isPending ? (
              <>
                <div className={styles.spinner}></div>
                {isEdit ? "Updating..." : "Creating..."}
              </>
            ) : isEdit ? (
              "Update User"
            ) : (
              "Create User"
            )}
          </button>

          <button
            type="button"
            className={styles.formButton}
            onClick={() => navigate("/")}
            disabled={create.isPending || update.isPending}
            style={{
              backgroundColor: "var(--secondary-100)",
              color: "var(--secondary-700)",
              borderColor: "var(--secondary-200)",
            }}
          >
            Cancel
          </button>
        </div>
      </form>

      <Modal
        open={modalOpen}
        title={modalType === "success" ? "Success" : "Error"}
        message={modalMessage}
        type={modalType}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
