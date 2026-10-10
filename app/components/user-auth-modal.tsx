"use client";

import React, { useState } from "react";
import {
  LucideX,
  LucideMail,
  LucideLock,
  LucideUser,
  LucideLoader2,
  LucideAlertCircle,
  LucideCheckCircle2,
} from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "./auth-context";

export function UserAuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalMode, openAuthModal, refreshUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  React.useEffect(() => {
    setError("");
    setSuccess("");
  }, [isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // 1. Firebase client signIn
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken();

      // 2. Gọi API tạo session
      const res = await fetch("/api/viewer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Đăng nhập thất bại");
      }

      setSuccess("Đăng nhập thành công!");
      await refreshUser();
      setTimeout(() => {
        closeAuthModal();
      }, 600);
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string };
      switch (firebaseError.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          setError("Sai email hoặc mật khẩu");
          break;
        case "auth/invalid-email":
          setError("Email không hợp lệ");
          break;
        case "auth/too-many-requests":
          setError("Quá nhiều lần thử. Vui lòng đợi trong giây lát");
          break;
        default:
          setError(firebaseError.message || "Đăng nhập thất bại");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={closeAuthModal}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#070b18] p-1 shadow-2xl">
        <div className="rounded-[22px] bg-[#070b18]/90 p-6 sm:p-8">
          {/* Close Button */}
          <button
            onClick={closeAuthModal}
            className="absolute right-5 top-5 rounded-full p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            <LucideX className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-sky-500 p-0.5">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#070b18]">
                <span className="font-black text-emerald-400">M</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Đăng nhập tài khoản
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Đăng nhập để trải nghiệm xem phim trọn vẹn
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs text-rose-400">
              <LucideAlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-400">
              <LucideCheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Email</label>
                <div className="relative">
                  <LucideMail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="h-11 w-full rounded-xl border border-white/10 bg-black/40 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Mật khẩu</label>
                <div className="relative">
                  <LucideLock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 w-full rounded-xl border border-white/10 bg-black/40 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 font-bold text-black shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-emerald-500 active:scale-95 disabled:opacity-50"
              >
                {loading ? <LucideLoader2 className="h-5 w-5 animate-spin" /> : "Đăng nhập ngay"}
              </button>
            </form>
        </div>
      </div>
    </div>
  );
}
