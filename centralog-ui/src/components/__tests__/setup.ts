import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Explicitly declare the global interface layout bounds to force compiler recognition
declare const global: typeof globalThis & {
  jest: Record<string, any>;
};

global.jest = {
  mock: (path: string, factory?: any) => vi.mock(path, factory),
  fn: (implementation?: any) => vi.fn(implementation),
  clearAllMocks: () => vi.clearAllMocks(),
} as any;