"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LucideLock, LucideMail, LucideLoader2, LucideEye } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

function ViewerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Đăng nhập Firebase Auth
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken();

      // 2. Tạo viewer session cookie
      const res = await fetch("/api/viewer/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error || "Tài khoản không có quyền truy cập");
        return;
      }

      // 3. Chuyển về trang đích (redirect) hoặc trang chủ
      router.push(redirectTo);
      router.refresh();
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
      <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-purple-500/10 blur-[100px]" />
      <div className="absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-indigo-500/10 blur-[100px]" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-400 to-indigo-500 p-0.5 shadow-lg shadow-purple-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#020617]">
              <LucideEye className="h-8 w-8 text-purple-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Trang web được bảo vệ
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Bạn cần tài khoản được cấp phép để truy cập nội dung này
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-1 shadow-2xl backdrop-blur-xl">
          <div className="rounded-[22px] bg-[#070b18]/80 p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="viewer-email" className="ml-1 text-xs font-medium text-slate-400">
                  Email
                </label>
                <div className="relative">
                  <LucideMail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="viewer-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 w-full rounded-xl border border-white/10 bg-black/40 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10"
                    placeholder="email@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="viewer-password" className="ml-1 text-xs font-medium text-slate-400">
                  Mật khẩu
                </label>
                <div className="relative">
                  <LucideLock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="viewer-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 w-full rounded-xl border border-white/10 bg-black/40 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10"
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
                className="group relative flex h-12 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 font-semibold text-white shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <LucideLoader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Đăng nhập xem phim"
                )}
              </button>
            </form>

            <div className="mt-6 rounded-2xl border border-white/5 bg-white/5 p-4">
              <p className="text-center text-xs text-slate-500">
                🔒 Liên hệ quản trị viên để được cấp tài khoản
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ViewerLoginPage() {
  return (
    <Suspense fallback={null}>
      <ViewerLoginForm />
    </Suspense>
  );
}
