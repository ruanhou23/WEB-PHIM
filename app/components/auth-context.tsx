"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

export type AuthUser = {
  uid: string;
  email: string;
  displayName: string;
  role: "admin" | "viewer";
  isAdmin: boolean;
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  userLoginEnabled: boolean;
  isAuthModalOpen: boolean;
  authModalMode: "login" | "register";
  openAuthModal: (mode?: "login" | "register") => void;
  closeAuthModal: () => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [userLoginEnabled, setUserLoginEnabled] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");

  // Kiểm tra trạng thái site và user session
  const refreshUser = useCallback(async () => {
    try {
      // 1. Kiểm tra trạng thái tính năng login của site
      const statusRes = await fetch("/api/site-status");
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setUserLoginEnabled(statusData.userLoginEnabled ?? true);
      }

      // 2. Kiểm tra session hiện tại của viewer
      const loginRes = await fetch("/api/viewer/login");
      if (loginRes.ok) {
        const loginData = await loginRes.json();
        if (loginData.authenticated && loginData.user) {
          setUser(loginData.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("[AuthProvider] Refresh error:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const openAuthModal = (mode: "login" | "register" = "login") => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const logout = async () => {
    try {
      await fetch("/api/viewer/logout", { method: "POST" });
      try {
        await signOut(auth);
      } catch {
        // Ignore firebase client signOut error
      }
      setUser(null);
    } catch (err) {
      console.error("[AuthProvider] Logout error:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        userLoginEnabled,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
