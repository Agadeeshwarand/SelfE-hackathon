import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, AuthUser, clearToken, setToken } from "./api";

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (payload: Record<string, unknown>) => Promise<AuthUser>;
  setSession: (token: string, user: AuthUser) => void;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const result = await api<AuthUser | { user: AuthUser }>("/auth/me");
      const me = "user" in result ? result.user : result;
      setUser(me);
    } catch (error) {
      console.error("HackForge auth refresh failed:", error);
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (localStorage.getItem("token")) refresh();
    else setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const result = await api<{ token: string; user: AuthUser }>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    setSession(result.token, result.user);
    return result.user;
  }

  async function register(payload: Record<string, unknown>) {
    const result = await api<{ token: string; user: AuthUser }>("/auth/register", {
      method: "POST",
      body: payload,
    });
    setSession(result.token, result.user);
    return result.user;
  }

  function setSession(token: string, nextUser: AuthUser) {
    setToken(token);
    setUser(nextUser);
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, loading, login, register, setSession, logout, refresh }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
