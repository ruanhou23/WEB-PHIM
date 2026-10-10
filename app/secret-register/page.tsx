"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LucideLock,
  LucideMail,
  LucideUser,
  LucideLoader2,
  LucideUserPlus,
  LucideCheckCircle2,
  LucideArrowLeft,
  LucideShield,
  LucideLogIn,
} from "lucide-react";
import { useAuth } from "@/app/components/auth-context";

export default function SecretRegisterPage() {
  const { user, loading: authLoading } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu nhập lại không khớp.");
      return;
    }

    setLoading(true);

    try {
      // Tạo tài khoản người xem (role: viewer)
      const regRes = await fetch("/api/viewer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          displayName: displayName.trim() || undefined,
        }),
      });

      const regData = await regRes.json();
      if (!regRes.ok) {
        throw new Error(regData.error || "Đăng ký tài khoản thất bại.");
      }

      setSuccess(`Tạo tài khoản thành công cho ${email}! Tài khoản này có thể đăng nhập xem phim ngay lập tức.`);
      // Reset form để có thể tạo thêm tài khoản nếu cần
      setDisplayName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đăng ký thất bại.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // 1. Đang tải trạng thái xác thực
  if (authLoading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-[#020617] px-4">
        <div className="flex flex-col items-center gap-3">
          <LucideLoader2 className="h-8 w-8 animate-spin text-emerald-400" />
          <p className="text-xs text-slate-400">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  // 2. Chưa đăng nhập -> Chặn truy cập và yêu cầu đăng nhập
  if (!user) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020617] px-4 py-12">
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-rose-500/10 blur-[100px]" />
        <div className="relative w-full max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 p-0.5 shadow-lg shadow-rose-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#020617]">
              <LucideLock className="h-8 w-8 text-rose-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Yêu cầu đăng nhập
          </h1>
          <p className="mt-2 text-xs text-slate-400">
            Chỉ người dùng hoặc quản trị viên đã đăng nhập mới có thể truy cập trang đăng ký này.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/login?redirect=/secret-register"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-xs font-bold text-black shadow-lg shadow-emerald-500/20 transition hover:scale-[1.01]"
            >
              <LucideLogIn className="h-4 w-4" />
              <span>Đăng nhập để vào trang</span>
            </Link>

            <Link
              href="/"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <LucideArrowLeft className="h-4 w-4" />
              <span>Quay về trang chủ</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Đã đăng nhập -> Cho phép tạo/đăng ký tài khoản
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020617] px-4 py-12">
      {/* Background Orbs */}
      <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-emerald-500/10 blur-[120px]" />
      <div className="absolute -right-24 -bottom-24 h-96 w-96 rounded-full bg-teal-500/10 blur-[120px]" />

      <div className="relative w-full max-w-md">
        {/* Navigation & Status bar */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <LucideArrowLeft className="h-4 w-4" />
            <span>Về trang chủ</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold text-emerald-300">
              {user.isAdmin ? "👑 Quản trị viên" : "👤 Thành viên"}
            </span>
          </div>
        </div>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 p-0.5 shadow-lg shadow-emerald-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#020617]">
              <LucideUserPlus className="h-7 w-7 text-emerald-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Tạo tài khoản người xem
          </h1>
          <p className="mt-1.5 text-xs text-slate-400">
            Đang thực hiện bởi: <span className="font-semibold text-slate-200">{user.displayName || user.email}</span>
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-1 shadow-2xl backdrop-blur-xl">
          <div className="rounded-[22px] bg-[#070b18]/80 p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="ml-1 text-xs font-medium text-slate-400">
                  Tên hiển thị (tùy chọn)
                </label>
                <div className="relative">
                  <LucideUser className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="h-11 w-full rounded-xl border border-white/10 bg-black/40 pl-10 pr-4 text-xs text-slate-100 placeholder:text-slate-600 outline-none transition focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10"
                    placeholder="Ví dụ: Bạn xem phim"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="ml-1 text-xs font-medium text-slate-400">
                  Email (*)
                </label>
                <div className="relative">
                  <LucideMail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 w-full rounded-xl border border-white/10 bg-black/40 pl-10 pr-4 text-xs text-slate-100 placeholder:text-slate-600 outline-none transition focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10"
                    placeholder="email@example.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="ml-1 text-xs font-medium text-slate-400">
                  Mật khẩu (*)
                </label>
                <div className="relative">
                  <LucideLock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 w-full rounded-xl border border-white/10 bg-black/40 pl-10 pr-4 text-xs text-slate-100 placeholder:text-slate-600 outline-none transition focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10"
                    placeholder="Tối thiểu 6 ký tự"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="ml-1 text-xs font-medium text-slate-400">
                  Nhập lại mật khẩu (*)
                </label>
                <div className="relative">
                  <LucideLock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 w-full rounded-xl border border-white/10 bg-black/40 pl-10 pr-4 text-xs text-slate-100 placeholder:text-slate-600 outline-none transition focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10"
                    placeholder="Nhập lại mật khẩu"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs text-rose-400 animate-in fade-in">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                  {error}
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-400 animate-in fade-in">
                  <LucideCheckCircle2 className="h-4 w-4 shrink-0" />
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 font-bold text-xs text-black shadow-lg shadow-emerald-500/20 transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <LucideLoader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <LucideUserPlus className="h-4 w-4" />
                    <span>Tạo tài khoản mới</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 border-t border-white/5 pt-4 text-center">
              <p className="text-[11px] text-slate-500">
                Tài khoản tạo tại đây sẽ có quyền Người xem và có thể đăng nhập xem phim ngay.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
