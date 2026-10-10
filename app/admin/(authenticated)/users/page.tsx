"use client";

import { useState, useEffect } from "react";
import {
    LucideUsers,
    LucidePlus,
    LucideTrash2,
    LucideLoader2,
    LucideShield,
    LucideAlertCircle,
    LucideCheckCircle2
} from "lucide-react";

type AdminUser = {
    uid: string;
    email: string;
    displayName: string;
    createdAt: string;
    lastSignIn: string;
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // Form state
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/register");
            if (!res.ok) {
                throw new Error("Không thể tải danh sách tài khoản");
            }
            const data = await res.json();
            setUsers(data.users || []);
        } catch (err: any) {
            setError(err.message || "Đã xảy ra lỗi");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccessMsg("");
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/admin/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, displayName }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Không thể tạo tài khoản");
            }

            setSuccessMsg("Tạo tài khoản thành công!");
            setEmail("");
            setPassword("");
            setDisplayName("");
            fetchUsers(); // Tải lại danh sách
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteUser = async (uid: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa tài khoản này? Hành động này không thể hoàn tác.")) {
            return;
        }

        setError("");
        setSuccessMsg("");

        try {
            const res = await fetch("/api/admin/register", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uid }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Không thể xóa tài khoản");
            }

            setSuccessMsg("Xóa tài khoản thành công!");
            fetchUsers(); // Tải lại danh sách
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto">
            {/* Header Info */}
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                    <LucideShield className="h-8 w-8 text-emerald-400" />
                    Quản lý Admin
                </h1>
                <p className="text-slate-400">Thêm, sửa, xóa các tài khoản có quyền truy cập trang quản trị.</p>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cột trái: Form tạo tài khoản */}
                <div className="lg:col-span-1">
                    <div className="rounded-3xl border border-white/5 bg-[#070b18] p-6 shadow-xl sticky top-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                                <LucidePlus className="h-5 w-5 text-emerald-400" />
                            </div>
                            <h2 className="text-lg font-bold text-white">Tạo tài khoản mới</h2>
                        </div>

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Tên hiển thị
                                </label>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="Ví dụ: Admin 2"
                                    className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-sm text-slate-100 outline-none transition focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Email (*)
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin2@mephim.com"
                                    className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-sm text-slate-100 outline-none transition focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Mật khẩu (*)
                                </label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Ít nhất 6 ký tự"
                                    className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-sm text-slate-100 outline-none transition focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-black transition hover:bg-emerald-400 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                            >
                                {isSubmitting ? (
                                    <LucideLoader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        <LucidePlus className="h-4 w-4" /> Tạo Admin
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Cột phải: Danh sách tài khoản */}
                <div className="lg:col-span-2">
                    <div className="rounded-3xl border border-white/5 bg-[#070b18] shadow-xl overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 ring-1 ring-sky-500/20">
                                    <LucideUsers className="h-5 w-5 text-sky-400" />
                                </div>
                                <h2 className="text-lg font-bold text-white">Danh sách Admin</h2>
                            </div>
                            <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-slate-400">
                                {users.length} tài khoản
                            </span>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                                <LucideLoader2 className="h-8 w-8 animate-spin mb-4 text-emerald-500" />
                                <p>Đang tải danh sách...</p>
                            </div>
                        ) : users.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                                <LucideUsers className="h-12 w-12 opacity-20 mb-4" />
                                <p>Không có dữ liệu</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="bg-white/[0.02] text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                            <th className="px-6 py-4">Tài khoản</th>
                                            <th className="px-6 py-4 hidden sm:table-cell">Ngày tạo</th>
                                            <th className="px-6 py-4 hidden md:table-cell">Đăng nhập cuối</th>
                                            <th className="px-6 py-4 text-right">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {users.map((user) => (
                                            <tr key={user.uid} className="group transition hover:bg-white/[0.02]">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-sky-500/20 flex items-center justify-center text-white font-bold">
                                                            {(user.displayName || user.email)[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-white">{user.displayName || "Admin"}</p>
                                                            <p className="text-xs text-slate-500">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 hidden sm:table-cell text-slate-400 text-xs">
                                                    {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                                                </td>
                                                <td className="px-6 py-4 hidden md:table-cell text-slate-400 text-xs">
                                                    {user.lastSignIn ? new Date(user.lastSignIn).toLocaleDateString('vi-VN') : "Chưa từng"}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleDeleteUser(user.uid)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 transition hover:bg-rose-500 hover:text-white"
                                                        title="Xóa tài khoản"
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
