import "@testing-library/jest-dom";
import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

// Extend Vitest's expect
expect.extend(matchers);

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock ResizeObserver
const mockResizeObserver = vi.fn();
mockResizeObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});
window.ResizeObserver = mockResizeObserver;

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock crypto.randomUUID
Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: () => "test-uuid-" + Math.random().toString(36).substr(2, 9),
  },
});
