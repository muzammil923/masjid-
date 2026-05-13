"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=2592000; SameSite=Lax`;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

interface AuthContextType {
  user: any | null;
  session: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
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

  const setAuthData = (user: any, session: any) => {
    setUser(user);
    setSession(session);
    localStorage.setItem("auth_token", session?.access_token || "");
    localStorage.setItem("auth_user", JSON.stringify(user));
    localStorage.setItem("auth_session", JSON.stringify(session));
    setCookie("auth_token", session?.access_token || "");
  };

  const signIn = async (email: string, password: string) => {
    const { user, session } = await api.auth.login(email, password);
    setAuthData(user, session);
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      throw new Error(error.message);
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    const { user, session } = await api.auth.register(email, password, name);
    setAuthData(user, session);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
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
    clearCookie("auth_token");
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signInWithGoogle, register, signOut }}>
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
