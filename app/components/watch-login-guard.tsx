"use client";

import React, { useState } from "react";
import {
  LucideLock,
  LucideMail,
  LucideUser,
  LucideLoader2,
  LucidePlay,
  LucideShieldAlert,
  LucideUserPlus,
  LucideKeyRound,
  LucideCheckCircle2,
} from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "./auth-context";
import VideoPlayer from "./video-player";

interface WatchLoginGuardProps {
  slug: string;
  sv: string;
  ep: string;
  title: string;
  movieName: string;
  episodeName?: string;
  playerEmbedUrl: string;
  playerM3u8Url: string;
  hasPlayableSource: boolean;
  posterUrl?: string;
}

export default function WatchLoginGuard({
  slug,
  sv,
  ep,
  title,
  movieName,
  episodeName,
  playerEmbedUrl,
  playerM3u8Url,
  hasPlayableSource,
  posterUrl,
}: WatchLoginGuardProps) {
  const { user, loading: authLoading, userLoginEnabled, refreshUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const idToken = await credential.user.getIdToken();

      const res = await fetch("/api/viewer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Tài khoản không có quyền truy cập");
      }

      setSuccess("Đăng nhập thành công! Đang tải phim...");
      await refreshUser();
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string };
      switch (firebaseError.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          setError("Sai email hoặc mật khẩu.");
          break;
        case "auth/invalid-email":
          setError("Email không hợp lệ.");
          break;
        case "auth/too-many-requests":
          setError("Quá nhiều lần thử thất bại. Vui lòng đợi trong giây lát.");
          break;
        default:
          setError(firebaseError.message || "Đăng nhập thất bại. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 1. Đang kiểm tra phiên đăng nhập
  if (authLoading) {
    return (
      <div className="relative flex aspect-video w-full flex-col items-center justify-center gap-3 bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        <p className="text-xs text-slate-400">Đang kiểm tra quyền truy cập phim...</p>
      </div>
    );
  }

  // 2. Đã đăng nhập -> Hiển thị trình phát phim
  if (user) {
    if (playerEmbedUrl) {
      return (
        <div className="relative aspect-video w-full bg-slate-950">
          <VideoPlayer
            slug={slug}
            sv={sv}
            ep={ep}
            title={title}
          />
        </div>
      );
    }

    if (hasPlayableSource) {
      return (
        <div className="relative z-10 flex aspect-video h-full flex-col items-center justify-center gap-2 px-3 text-center">
          <p className="text-sm text-slate-200">
            Nguồn này không hỗ trợ iframe trực tiếp. Bấm vào link để mở trình phát.
          </p>
          <a
            href={playerM3u8Url}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-emerald-500/20 px-4 py-2 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-500/40 hover:bg-emerald-500/30"
          >
            Mở nguồn phát
          </a>
        </div>
      );
    }

    return (
      <div className="relative z-10 flex aspect-video h-full flex-col items-center justify-center gap-2 px-3 text-center">
        <span className="text-sm font-semibold text-slate-100">
          Chưa có nguồn phát cho phim này
        </span>
        <p className="max-w-md text-xs text-slate-400">
          Hệ thống đã nhận diện thông tin phim nhưng chưa có link_embed hoặc link_m3u8 trong tập này.
        </p>
      </div>
    );
  }

  // 3. Chưa đăng nhập -> Hiển thị giao diện Đăng nhập / Đăng ký người xem trước khi xem phim
  return (
    <div className="relative flex min-h-[480px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl bg-[#070b18] px-4 py-8 text-slate-100 shadow-2xl ring-1 ring-white/10">
      {/* Background Poster mờ nếu có */}
      {posterUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10 blur-xl"
          style={{ backgroundImage: `url(${posterUrl})` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#070b18] via-[#070b18]/90 to-[#070b18]/80" />

      {/* Glow Orbs */}
      <div className="absolute -left-10 -top-10 h-64 w-64 rounded-full bg-emerald-500/10 blur-[90px]" />
      <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-sky-500/10 blur-[90px]" />

      <div className="relative z-10 w-full max-w-md">
        {/* Header Thông tin Phim & Khóa */}
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 p-0.5 shadow-lg shadow-emerald-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#070b18]">
              <LucideLock className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            Đăng nhập để xem phim
          </h2>
          <p className="mt-1 text-xs text-slate-400 line-clamp-1">
            Đang mở: <span className="font-semibold text-emerald-400">{movieName}</span>
            {episodeName ? ` - ${episodeName}` : ""}
          </p>
        </div>

        {/* Thông báo lỗi / thành công */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-300 animate-in fade-in">
            <LucideShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-300 animate-in fade-in">
            <LucideCheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        {!userLoginEnabled ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-center text-xs text-amber-200">
            Tính năng đăng nhập và xem phim hiện đang tạm thời đóng bởi Quản trị viên. Vui lòng quay lại sau!
          </div>
        ) : (
          /* FORM ĐĂNG NHẬP */
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-400">Email người dùng</label>
              <div className="relative">
                <LucideMail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="h-10 w-full rounded-xl border border-white/10 bg-black/50 pl-9 pr-3 text-xs text-slate-100 placeholder:text-slate-600 outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-400">Mật khẩu</label>
              <div className="relative">
                <LucideKeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-10 w-full rounded-xl border border-white/10 bg-black/50 pl-9 pr-3 text-xs text-slate-100 placeholder:text-slate-600 outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-xs font-bold text-black shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <LucideLoader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <LucidePlay className="h-4 w-4 fill-current" />
                  <span>Đăng nhập & Xem phim ngay</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
