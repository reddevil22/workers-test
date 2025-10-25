import { authStore } from "./AuthStore";

type User = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role: string;
};

const getAuthHeaders = (): Record<string, string> => {
  const token = authStore.getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchUsers = async (): Promise<User[]> => {
  const response = await fetch("/api/users", {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Network response was not ok");
  }
  const data = await response.json();
  return data.users as User[];
};

export const fetchUser = async (id: string): Promise<User> => {
  const response = await fetch(`/api/users/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Network response was not ok");
  }
  const data = await response.json();
  return data.user as User;
};

export const createUser = async (userData: {
  first_name?: string | null;
  last_name?: string | null;
  email: string | null;
  role?: string | null;
  password: string;
}): Promise<User> => {
  const response = await fetch("/api/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(userData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create user");
  }
  const data = await response.json();
  return data.user as User;
};

export const updateUser = async (
  id: string,
  userData: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    role?: string | null;
  }
): Promise<User> => {
  const response = await fetch(`/api/users/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(userData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update user");
  }
  const data = await response.json();
  return data.user as User;
};

export const deleteUser = async (id: string): Promise<void> => {
  const response = await fetch(`/api/users/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete user");
  }
};

// Generic API client for customer operations
export const api = {
  get: async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(`/api${endpoint}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Network response was not ok");
    }
    return response.json() as Promise<T>;
  },

  post: async <T>(
    endpoint: string,
    data: Record<string, unknown>
  ): Promise<T> => {
    const response = await fetch(`/api${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create resource");
    }
    return response.json() as Promise<T>;
  },

  put: async <T>(
    endpoint: string,
    data: Record<string, unknown>
  ): Promise<T> => {
    const response = await fetch(`/api${endpoint}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update resource");
    }
    return response.json() as Promise<T>;
  },

  delete: async (endpoint: string): Promise<void> => {
    const response = await fetch(`/api${endpoint}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete resource");
    }
  },
};
