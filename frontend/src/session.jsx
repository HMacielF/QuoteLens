import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { apiFor, API_BASE, DEV_USER } from './api/index.js';

const KEY = 'quotelens.session';
const SessionContext = createContext(null);

function readSession() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved?.mode === 'demo' || (saved?.mode === 'live' && API_BASE)) return saved;
  } catch {
    // Blocked storage: start signed out.
  }
  return null;
}

function writeSession(session) {
  try {
    if (session) localStorage.setItem(KEY, JSON.stringify(session));
    else localStorage.removeItem(KEY);
  } catch {
    // Blocked storage: the session lasts until the tab closes.
  }
}

export function SessionProvider({ children }) {
  const [session, setSession] = useState(readSession);

  const update = useCallback((next) => {
    writeSession(next);
    setSession(next);
  }, []);

  const value = useMemo(() => ({
    session,
    api: session ? apiFor(session) : null,
    signInDemo: () => update({ mode: 'demo', userId: 'demo-user', name: 'Demo User', email: '', since: new Date().toISOString() }),
    signInDev: () => update({ mode: 'live', userId: DEV_USER, devUser: DEV_USER, name: DEV_USER, email: '', since: new Date().toISOString() }),
    updateProfile: (changes) => update({ ...session, ...changes }),
    signOut: () => update(null),
  }), [session, update]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export const useSession = () => useContext(SessionContext);
