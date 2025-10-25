import { render, RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import React, { ReactElement } from "react";
import { vi } from "vitest";

// Test data
export const mockUsers = [
  {
    id: "1",
    first_name: "John",
    last_name: "Doe",
    email: "john@example.com",
    role: "admin" as const,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "2",
    first_name: "Jane",
    last_name: "Smith",
    email: "jane@example.com",
    role: "user" as const,
    created_at: "2023-01-02T00:00:00Z",
    updated_at: "2023-01-02T00:00:00Z",
  },
];

export const mockCustomers = [
  {
    id: "1",
    first_name: "John",
    last_name: "Doe",
    mobile: "0712345678",
    city: "Johannesburg",
    province: "Gauteng",
    postal_code: "2001",
    customer_type: "residential",
    nationality: "South African",
    preferred_language: "english",
    communication_preference: "sms",
    marketing_consent: false,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "2",
    first_name: "Jane",
    last_name: "Smith",
    mobile: "0823456789",
    city: "Cape Town",
    province: "Western Cape",
    postal_code: "8000",
    customer_type: "business",
    nationality: "South African",
    preferred_language: "english",
    communication_preference: "email",
    marketing_consent: true,
    created_at: "2023-01-02T00:00:00Z",
    updated_at: "2023-01-02T00:00:00Z",
  },
];

// Mock API responses
export const mockApiResponses = {
  users: {
    list: {
      users: mockUsers,
      total: mockUsers.length,
      pagination: { total: mockUsers.length, page: 1, limit: 10 },
    },
    get: (id: string) => ({ user: mockUsers.find((u) => u.id === id) }),
    create: (userData: any) => ({
      user: { ...userData, id: "3", created_at: new Date().toISOString() },
    }),
    update: (id: string, userData: any) => ({
      user: { ...userData, id, updated_at: new Date().toISOString() },
    }),
    delete: () => ({ success: true }),
  },
  customers: {
    list: {
      customers: mockCustomers,
      total: mockCustomers.length,
      pagination: { total: mockCustomers.length, page: 1, limit: 10 },
    },
    get: (id: string) => ({ customer: mockCustomers.find((c) => c.id === id) }),
    create: (customerData: any) => ({
      customer: {
        ...customerData,
        id: "3",
        created_at: new Date().toISOString(),
      },
    }),
    update: (id: string, customerData: any) => ({
      customer: { ...customerData, id, updated_at: new Date().toISOString() },
    }),
    delete: () => ({ success: true }),
  },
  auth: {
    login: { user: mockUsers[0], token: "mock-jwt-token" },
    register: { user: mockUsers[1] },
    profile: { user: mockUsers[0] },
  },
};

// Test wrapper with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: AllTheProviders, ...options });

// Mock fetch for API calls
export const mockFetch = (response: any, ok = true, status = 200) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => response,
    text: async () => JSON.stringify(response),
  } as Response);
};

// Reset fetch mock
export const resetFetchMock = () => {
  vi.restoreAllMocks();
};

// Helper functions for testing
export const waitForLoadingToFinish = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

// Mock localStorage
export const createMockLocalStorage = () => {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
  };
};

// Re-export testing library utilities
export * from "@testing-library/react";
export { customRender as render };
