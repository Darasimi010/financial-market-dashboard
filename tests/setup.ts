/* eslint-disable @typescript-eslint/no-explicit-any */
if (typeof (globalThis as any).setImmediate === 'undefined') {
  (globalThis as any).setImmediate = (fn: (...args: any[]) => void, ...args: any[]) =>
    setTimeout(fn, 0, ...args);
  (globalThis as any).clearImmediate = (id: any) => clearTimeout(id);
}
if (typeof (window as any).setImmediate === 'undefined') {
  (window as any).setImmediate = (globalThis as any).setImmediate;
  (window as any).clearImmediate = (globalThis as any).clearImmediate;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

import '@testing-library/jest-dom/jest-globals';
// import '@testing-library/jest-dom';
import { server } from './mocks/server';

// Mock matchMedia for jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: query.includes('dark'),
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
});
afterAll(() => server.close());
