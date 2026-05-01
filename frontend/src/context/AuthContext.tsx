"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface AuthContextType {
  user: any | null;
  session: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");
    const storedSession = localStorage.getItem("auth_session");

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setSession(storedSession ? JSON.parse(storedSession) : null);
      } catch {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        localStorage.removeItem("auth_session");
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    const { user, session } = await api.auth.login(email, password);

    const authorizedEmails = ["admin@masjidcrm.com"];
    if (!authorizedEmails.includes(user?.email || "")) {
      throw new Error("unauthorized");
    }

    setUser(user);
    setSession(session);
    localStorage.setItem("auth_token", session?.access_token || "");
    localStorage.setItem("auth_user", JSON.stringify(user));
    localStorage.setItem("auth_session", JSON.stringify(session));
  };

  const signOut = async () => {
    const token = localStorage.getItem("auth_token");
    try {
      await api.auth.logout(token || undefined);
    } catch {
    }
    setUser(null);
    setSession(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_session");
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
