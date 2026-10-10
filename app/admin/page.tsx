"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LucideShieldCheck,
  LucideMail,
  LucideLock,
  LucideArrowLeft,
  LucideLoader2,
} from "lucide-react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Đăng nhập với Firebase Auth (client-side)
      const credential = await signInWithEmailAndPassword(auth, email, password);

      // 2. Lấy ID token
      const idToken = await credential.user.getIdToken();

      // 3. Gửi ID token lên server để tạo session cookie
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        try {
          await signOut(auth);
        } catch {}
        setError(data.message || "Đăng nhập thất bại");
        return;
      }

      // 4. Đăng nhập thành công → chuyển đến dashboard
      router.push("/admin/dashboard");
      router.refresh();
    } catch (err: unknown) {
      // Xử lý lỗi Firebase Auth
      const firebaseError = err as { code?: string; message?: string };
      switch (firebaseError.code) {
        case "auth/user-not-found":
          setError("Tài khoản không tồn tại");
          break;
        case "auth/wrong-password":
        case "auth/invalid-credential":
          setError("Sai email hoặc mật khẩu");
          break;
        case "auth/invalid-email":
          setError("Email không hợp lệ");
          break;
        case "auth/user-disabled":
          setError("Tài khoản đã bị vô hiệu hóa");
          break;
        case "auth/too-many-requests":
          setError("Quá nhiều lần thử. Vui lòng đợi vài phút");
          break;
        default:
          setError(firebaseError.message || "Không thể kết nối máy chủ");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020617] px-4 py-12">
      {/* Background Orbs */}
      <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-[100px]" />
      <div className="absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-sky-500/10 blur-[100px]" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-sky-500 p-0.5 shadow-lg shadow-emerald-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#020617]">
              <LucideShieldCheck className="h-8 w-8 text-emerald-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Admin Portal
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Đăng nhập bằng tài khoản Firebase để quản trị hệ thống
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-1 shadow-2xl backdrop-blur-xl">
          <div className="rounded-[22px] bg-[#070b18]/80 p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="email" className="ml-1 text-xs font-medium text-slate-400">
                  Email
                </label>
                <div className="relative">
                  <LucideMail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 w-full rounded-xl border border-white/10 bg-black/40 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10"
                    placeholder="admin@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="ml-1 text-xs font-medium text-slate-400">
                  Mật khẩu
                </label>
                <div className="relative">
                  <LucideLock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 w-full rounded-xl border border-white/10 bg-black/40 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group relative flex h-12 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <LucideLoader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Đăng nhập"
                )}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
              </button>
            </form>

            <div className="mt-8 rounded-2xl border border-white/5 bg-white/5 p-4">
              <p className="text-center text-xs text-slate-500">
                🔒 Xác thực qua <span className="font-semibold text-emerald-400">Firebase Authentication</span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-emerald-400"
          >
            <LucideArrowLeft className="h-4 w-4" />
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
