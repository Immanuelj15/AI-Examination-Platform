"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

export interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  role: "ADMIN" | "EXAMINER" | "STUDENT";
  organization_id?: number;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginAsDemo: (role: "ADMIN" | "EXAMINER" | "STUDENT") => Promise<boolean>;
  register: (
    fullName: string,
    email: string,
    password: string,
    role: "EXAMINER" | "STUDENT"
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => false,
  loginAsDemo: async () => false,
  register: async () => ({ success: false }),
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedToken = localStorage.getItem("evalora_token");
    const savedUser = localStorage.getItem("evalora_user");
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("evalora_token");
        localStorage.removeItem("evalora_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password })
      });
      if (!res.ok) {
        return false;
      }
      const data = await res.json();
      const userProfile: UserProfile = {
        id: data.user_id,
        email: data.email,
        full_name: data.full_name,
        role: data.role as "ADMIN" | "EXAMINER" | "STUDENT"
      };

      setToken(data.access_token);
      setUser(userProfile);
      localStorage.setItem("evalora_token", data.access_token);
      localStorage.setItem("evalora_refresh", data.refresh_token);
      localStorage.setItem("evalora_user", JSON.stringify(userProfile));

      // Role based smart redirect
      if (userProfile.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else if (userProfile.role === "EXAMINER") {
        router.push("/examiner/dashboard");
      } else {
        router.push("/student/dashboard");
      }
      return true;
    } catch (e) {
      console.error("Login failed", e);
      return false;
    }
  };

  const loginAsDemo = async (role: "ADMIN" | "EXAMINER" | "STUDENT"): Promise<boolean> => {
    const creds = {
      ADMIN: { email: "admin@example.com", password: "admin123" },
      EXAMINER: { email: "examiner@example.com", password: "examiner123" },
      STUDENT: { email: "student@example.com", password: "student123" }
    };
    const c = creds[role];
    return await login(c.email, c.password);
  };

  const register = async (
    fullName: string,
    email: string,
    password: string,
    role: "EXAMINER" | "STUDENT" = "STUDENT"
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
          role
        })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.detail || "Registration failed." };
      }
      const userProfile: UserProfile = {
        id: data.user_id,
        email: data.email,
        full_name: data.full_name,
        role: data.role as "EXAMINER" | "STUDENT"
      };

      setToken(data.access_token);
      setUser(userProfile);
      localStorage.setItem("evalora_token", data.access_token);
      localStorage.setItem("evalora_refresh", data.refresh_token);
      localStorage.setItem("evalora_user", JSON.stringify(userProfile));

      if (userProfile.role === "EXAMINER") {
        router.push("/examiner/dashboard");
      } else {
        router.push("/student/dashboard");
      }
      return { success: true };
    } catch (e) {
      console.error("Registration failed", e);
      return { success: false, message: "Unable to connect to server. Please try again." };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("evalora_token");
    localStorage.removeItem("evalora_refresh");
    localStorage.removeItem("evalora_user");
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, loginAsDemo, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
