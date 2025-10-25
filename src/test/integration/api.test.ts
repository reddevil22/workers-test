import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { api } from "../../react-app/services/Api";

describe("API Integration Tests", () => {
  let mockFetch: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage for auth token
    const localStorageMock = {
      getItem: vi.fn(() => "mock-jwt-token"),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });

    // Mock fetch for each test
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Authentication API", () => {
    it("should login successfully", async () => {
      const mockResponse = {
        user: {
          id: "1",
          first_name: "John",
          last_name: "Doe",
          email: "john@example.com",
          role: "admin",
        },
        token: "mock-jwt-token",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await api.post("/auth/login", {
        email: "john@example.com",
        password: "password123",
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer mock-jwt-token",
        },
        body: JSON.stringify({
          email: "john@example.com",
          password: "password123",
        }),
      });

      expect(result).toEqual(mockResponse);
    });

    it("should handle login failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: "Invalid credentials" }),
      });

      await expect(
        api.post("/auth/login", {
          email: "john@example.com",
          password: "wrongpassword",
        })
      ).rejects.toThrow("Invalid credentials");
    });

    it("should register a new user", async () => {
      const mockResponse = {
        user: {
          id: "2",
          first_name: "Jane",
          last_name: "Smith",
          email: "jane@example.com",
          role: "user",
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      });

      const result = await api.post("/auth/register", {
        first_name: "Jane",
        last_name: "Smith",
        email: "jane@example.com",
        password: "password123",
        role: "user",
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe("Users API", () => {
    it("should fetch users list", async () => {
      const mockResponse = {
        users: [
          {
            id: "1",
            first_name: "John",
            last_name: "Doe",
            email: "john@example.com",
            role: "admin",
          },
        ],
        total: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await api.get("/users?page=1&limit=10");

      expect(mockFetch).toHaveBeenCalledWith("/api/users?page=1&limit=10", {
        headers: {
          Authorization: "Bearer mock-jwt-token",
        },
      });

      expect(result).toEqual(mockResponse);
    });

    it("should create a new user", async () => {
      const mockResponse = {
        user: {
          id: "3",
          first_name: "New",
          last_name: "User",
          email: "newuser@example.com",
          role: "user",
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      });

      const result = await api.post("/users", {
        first_name: "New",
        last_name: "User",
        email: "newuser@example.com",
        password: "password123",
        role: "user",
      });

      expect(result).toEqual(mockResponse);
    });

    it("should update a user", async () => {
      const mockResponse = {
        user: {
          id: "1",
          first_name: "Updated",
          last_name: "User",
          email: "updated@example.com",
          role: "admin",
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await api.put("/users/1", {
        first_name: "Updated",
        last_name: "User",
        email: "updated@example.com",
      });

      expect(result).toEqual(mockResponse);
    });

    it("should delete a user", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      const result = await api.delete("/users/1");

      expect(mockFetch).toHaveBeenCalledWith("/api/users/1", {
        method: "DELETE",
        headers: {
          Authorization: "Bearer mock-jwt-token",
        },
      });
      expect(result).toBeUndefined(); // api.delete returns void
    });
  });

  describe("Customers API", () => {
    it("should fetch customers list", async () => {
      const mockResponse = {
        customers: [
          {
            id: "1",
            first_name: "John",
            last_name: "Doe",
            mobile: "0712345678",
            city: "Johannesburg",
            province: "Gauteng",
            postal_code: "2001",
          },
        ],
        total: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await api.get("/customers?page=1&limit=10");

      expect(result).toEqual(mockResponse);
    });

    it("should create a new customer", async () => {
      const mockResponse = {
        customer: {
          id: "2",
          first_name: "Jane",
          last_name: "Smith",
          mobile: "0823456789",
          city: "Cape Town",
          province: "Western Cape",
          postal_code: "8000",
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      });

      const result = await api.post("/customers", {
        first_name: "Jane",
        last_name: "Smith",
        mobile: "0823456789",
        city: "Cape Town",
        province: "Western Cape",
        postal_code: "8000",
      });

      expect(result).toEqual(mockResponse);
    });

    it("should fetch a single customer", async () => {
      const mockResponse = {
        customer: {
          id: "1",
          first_name: "John",
          last_name: "Doe",
          mobile: "0712345678",
          city: "Johannesburg",
          province: "Gauteng",
          postal_code: "2001",
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await api.get("/customers/1");

      expect(result).toEqual(mockResponse);
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(api.get("/users")).rejects.toThrow("Network error");
    });

    it("should handle 404 errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: "Not found" }),
      });

      await expect(api.get("/nonexistent")).rejects.toThrow("Not found");
    });

    it("should handle 500 errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "Internal server error" }),
      });

      await expect(api.get("/users")).rejects.toThrow("Internal server error");
    });
  });
});
