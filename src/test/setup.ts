import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll, vi } from 'vitest';

// Mock fetch globally
beforeAll(() => {
  global.fetch = vi.fn();
  global.Request = vi.fn() as any;
  global.Response = vi.fn() as any;
});

// Clear all mocks between tests
afterEach(() => {
  vi.clearAllMocks();
});

// Reset mocks
afterAll(() => {
  vi.resetAllMocks();
});