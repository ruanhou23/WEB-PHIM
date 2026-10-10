"use client";

import { useState, useEffect } from "react";
import {
  LucideShieldCheck,
  LucideShieldOff,
  LucideUsers,
  LucidePlus,
  LucideTrash2,
  LucideLoader2,
  LucideAlertCircle,
  LucideCheckCircle2,
  LucideSettings,
  LucideEye,
  LucideLogIn,
  LucideUserX,
  LucideUserCheck,
} from "lucide-react";

type ViewerUser = {
  uid: string;
  email: string;
  displayName: string;
  createdAt: string;
  lastSignIn: string;
};

export default function AdminSettingsPage() {
  const [isProtected, setIsProtected] = useState(false);
  const [userLoginEnabled, setUserLoginEnabled] = useState(true);
  const [viewers, setViewers] = useState<ViewerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [togglingLogin, setTogglingLogin] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/site-settings");
      if (!res.ok) throw new Error("Không thể tải cài đặt");
      const data = await res.json();
      setIsProtected(data.siteProtection);
      setUserLoginEnabled(data.userLoginEnabled ?? true);
      setViewers(data.viewers || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleToggle = async () => {
    setToggling(true);
    setError("");
    setSuccessMsg("");
    try {
      const newState = !isProtected;
      const res = await fetch("/api/admin/site-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", enabled: newState }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setIsProtected(newState);
      setSuccessMsg(data.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setToggling(false);
    }
  };

  const handleToggleUserLogin = async () => {
    setTogglingLogin(true);
    setError("");
    setSuccessMsg("");
    try {
      const newState = !userLoginEnabled;
      const res = await fetch("/api/admin/site-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle-user-login", enabled: newState }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUserLoginEnabled(newState);
      setSuccessMsg(data.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTogglingLogin(false);
    }
  };

  const handleCreateViewer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create-viewer", email, password, displayName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccessMsg("Tạo tài khoản viewer thành công!");
      setEmail("");
      setPassword("");
      setDisplayName("");
      fetchSettings();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteViewer = async (uid: string) => {
    if (!confirm("Xóa tài khoản người xem này?")) return;
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-viewer", uid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccessMsg("Đã xóa tài khoản!");
      fetchSettings();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <LucideLoader2 className="h-10 w-10 animate-spin text-emerald-500 mb-4" />
        <p className="text-slate-500">Đang tải cài đặt...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <LucideSettings className="h-8 w-8 text-emerald-400" />
          Cài đặt Bảo vệ
        </h1>
        <p className="text-slate-400">
          Bật/tắt bảo vệ trang web và quản lý tài khoản người xem.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
          <LucideAlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
          <p>{error}</p>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          <LucideCheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          <p>{successMsg}</p>
        </div>
      )}

      {/* ═══════ Toggle Bảo vệ ═══════ */}
      <div
        className={`relative overflow-hidden rounded-3xl border p-8 shadow-xl transition-all ${
          isProtected
            ? "border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-[#070b18]"
            : "border-white/5 bg-[#070b18]"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                isProtected
                  ? "bg-emerald-500/20 ring-2 ring-emerald-500/30"
                  : "bg-white/5 ring-1 ring-white/10"
              }`}
            >
              {isProtected ? (
                <LucideShieldCheck className="h-7 w-7 text-emerald-400" />
              ) : (
                <LucideShieldOff className="h-7 w-7 text-slate-500" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Bảo vệ trang web</h2>
              <p className="mt-1 text-sm text-slate-400">
                {isProtected
                  ? "Đang BẬT — Người xem cần đăng nhập để truy cập trang web"
                  : "Đang TẮT — Trang web công khai, ai cũng có thể xem"}
              </p>
            </div>
          </div>

          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`relative h-12 rounded-2xl px-8 font-bold text-sm transition-all active:scale-95 disabled:opacity-50 ${
              isProtected
                ? "bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/30 hover:bg-rose-500/30"
                : "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 hover:bg-emerald-400"
            }`}
          >
            {toggling ? (
              <LucideLoader2 className="h-5 w-5 animate-spin mx-auto" />
            ) : isProtected ? (
              "Tắt bảo vệ"
            ) : (
              "Bật bảo vệ"
            )}
          </button>
        </div>

        {isProtected && (
          <div className="mt-6 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-4">
            <p className="text-xs text-emerald-300/80">
              📌 Khi bật, tất cả trang công khai (trang chủ, xem phim, danh sách...) sẽ yêu cầu
              đăng nhập. Trang đăng nhập viewer: <span className="font-mono font-bold">/login</span>
            </p>
          </div>
        )}
      </div>

      {/* ═══════ Toggle Đăng nhập Người dùng ═══════ */}
      <div
        className={`relative overflow-hidden rounded-3xl border p-8 shadow-xl transition-all ${
          userLoginEnabled
            ? "border-sky-500/30 bg-gradient-to-br from-sky-500/10 to-[#070b18]"
            : "border-white/5 bg-[#070b18]"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                userLoginEnabled
                  ? "bg-sky-500/20 ring-2 ring-sky-500/30"
                  : "bg-white/5 ring-1 ring-white/10"
              }`}
            >
              {userLoginEnabled ? (
                <LucideUserCheck className="h-7 w-7 text-sky-400" />
              ) : (
                <LucideUserX className="h-7 w-7 text-slate-500" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Đăng nhập phía Người dùng</h2>
              <p className="mt-1 text-sm text-slate-400">
                {userLoginEnabled
                  ? "Đang BẬT — Người xem có thể đăng nhập và đăng ký tài khoản trên website"
                  : "Đang TẮT — Nút đăng nhập sẽ ẩn, chặn tính năng đăng nhập/đăng ký phía người dùng"}
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleUserLogin}
            disabled={togglingLogin}
            className={`relative h-12 rounded-2xl px-8 font-bold text-sm transition-all active:scale-95 disabled:opacity-50 ${
              userLoginEnabled
                ? "bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/30 hover:bg-rose-500/30"
                : "bg-sky-500 text-black shadow-lg shadow-sky-500/20 hover:bg-sky-400"
            }`}
          >
            {togglingLogin ? (
              <LucideLoader2 className="h-5 w-5 animate-spin mx-auto" />
            ) : userLoginEnabled ? (
              "Tắt đăng nhập"
            ) : (
              "Bật đăng nhập"
            )}
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-sky-500/10 bg-sky-500/5 p-4">
          <p className="text-xs text-sky-300/80">
            💡 Tách biệt quyền hạn: Tài khoản Người dùng thường chỉ đăng nhập được ở website xem phim. Khi người dùng cố đăng nhập vào trang Quản trị (/admin), hệ thống sẽ từ chối truy cập.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ═══════ Form tạo Viewer ═══════ */}
        <div className="lg:col-span-1">
          <div className="rounded-3xl border border-white/5 bg-[#070b18] p-6 shadow-xl sticky top-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 ring-1 ring-purple-500/20">
                <LucidePlus className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Tạo Viewer</h2>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Tài khoản người xem</p>
              </div>
            </div>

            <form onSubmit={handleCreateViewer} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Tên</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ví dụ: Bạn Hau"
                  className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-sm text-slate-100 outline-none transition focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email (*)</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="viewer@mephim.com"
                  className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-sm text-slate-100 outline-none transition focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Mật khẩu (*)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ít nhất 6 ký tự"
                  className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-sm text-slate-100 outline-none transition focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-purple-400 active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <LucideLoader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <LucidePlus className="h-4 w-4" /> Tạo Viewer
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* ═══════ Danh sách Viewer ═══════ */}
        <div className="lg:col-span-2">
          <div className="rounded-3xl border border-white/5 bg-[#070b18] shadow-xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 ring-1 ring-indigo-500/20">
                  <LucideEye className="h-5 w-5 text-indigo-400" />
                </div>
                <h2 className="text-lg font-bold text-white">Người xem được cấp quyền</h2>
              </div>
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-slate-400">
                {viewers.length} tài khoản
              </span>
            </div>

            {viewers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                <LucideUsers className="h-12 w-12 opacity-20 mb-4" />
                <p className="font-medium">Chưa có tài khoản viewer nào</p>
                <p className="text-xs mt-1">Tạo tài khoản viewer để cấp quyền xem phim</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-white/[0.02] text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      <th className="px-6 py-4">Tài khoản</th>
                      <th className="px-6 py-4 hidden sm:table-cell">Ngày tạo</th>
                      <th className="px-6 py-4 hidden md:table-cell">Đăng nhập cuối</th>
                      <th className="px-6 py-4 text-right">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {viewers.map((v) => (
                      <tr key={v.uid} className="group transition hover:bg-white/[0.02]">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center text-white font-bold">
                              {(v.displayName || v.email)[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-white">{v.displayName || "Viewer"}</p>
                              <p className="text-xs text-slate-500">{v.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden sm:table-cell text-slate-400 text-xs">
                          {new Date(v.createdAt).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell text-slate-400 text-xs">
                          {v.lastSignIn ? new Date(v.lastSignIn).toLocaleDateString("vi-VN") : "Chưa"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteViewer(v.uid)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 transition hover:bg-rose-500 hover:text-white"
                          >
                            <LucideTrash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
