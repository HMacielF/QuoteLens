import { createDemoApi } from './demo.js';
import { createLiveApi } from './live.js';

export { ApiError } from './errors.js';

export const API_BASE = import.meta.env.VITE_API_BASE || '';
export const DEV_USER = import.meta.env.VITE_DEV_USER || '';

const cache = new Map();

// One interface, two backends: the session decides which one a page talks to.
export function apiFor(session) {
  const id = `${session.mode}:${session.userId}`;
  if (!cache.has(id)) {
    cache.set(id, session.mode === 'live'
      ? createLiveApi({ base: API_BASE, devUser: session.devUser })
      : createDemoApi({ userId: session.userId }));
  }
  return cache.get(id);
}
