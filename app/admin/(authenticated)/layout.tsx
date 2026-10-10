"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LucideLayoutDashboard,
    LucideFilm,
    LucideLogOut,
    LucideMenu,
    LucideX,
    LucideHome,
    LucideSettings,
    LucideSearch,
    LucideBell,
    LucideUsers,
    LucideBarChart3,
    LucideTags
} from "lucide-react";

export default function AdminAuthenticatedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // Close mobile sidebar on navigation
    useEffect(() => {
        setIsMobileSidebarOpen(false);
    }, [pathname]);

    const navItems = [
        {
            label: "Dashboard",
            href: "/admin/dashboard",
            icon: LucideLayoutDashboard,
        },
        {
            label: "Quản lý phim",
            href: "/admin/movies",
            icon: LucideFilm,
        },
        {
            label: "Tài khoản",
            href: "/admin/users",
            icon: LucideUsers,
        },
        {
            label: "Truy cập",
            href: "/admin/analytics",
            icon: LucideBarChart3,
        },
        {
            label: "Thể loại",
            href: "/admin/genres",
            icon: LucideTags,
        },
    ];

    const bottomNavItems = [
        {
            label: "Cài đặt bảo vệ",
            href: "/admin/settings",
            icon: LucideSettings,
        },
        {
            label: "Về trang chủ",
            href: "/",
            icon: LucideHome,
        },
    ];

    return (
        <div className="flex min-h-screen bg-[#020617] text-slate-200">
            {/* Mobile Header */}
            <div className="fixed top-0 z-40 flex w-full items-center justify-between border-b border-white/5 bg-[#070b18]/80 px-4 py-3 backdrop-blur-md lg:hidden">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
                        <LucideFilm className="h-5 w-5 text-black" />
                    </div>
                    <span className="font-bold text-white">Admin Panel</span>
                </div>
                <button
                    onClick={() => setIsMobileSidebarOpen(true)}
                    className="rounded-lg p-2 hover:bg-white/5"
                >
                    <LucideMenu className="h-6 w-6" />
                </button>
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
                    onClick={() => setIsMobileSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/5 bg-[#070b18] transition-transform lg:static lg:translate-x-0 ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="flex h-16 items-center justify-between px-6">
                    <div className="flex items-center gap-2 text-emerald-400">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                            <LucideFilm className="h-5 w-5" />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-white">
                            Antigravity <span className="text-xs font-medium text-emerald-500/80">ADMIN</span>
                        </span>
                    </div>
                    <button
                        onClick={() => setIsMobileSidebarOpen(false)}
                        className="rounded-lg p-2 lg:hidden hover:bg-white/5"
                    >
                        <LucideX className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex flex-1 flex-col justify-between p-4 pt-2">
                    <nav className="space-y-1">
                        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            MENU CHÍNH
                        </p>
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${isActive
                                            ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 shadow-lg shadow-emerald-500/5"
                                            : "text-slate-400 hover:bg-white/5 hover:text-slate-100 uppercase"
                                        }`}
                                >
                                    <Icon className={`h-5 w-5 ${isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300"}`} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="space-y-4">
                        <nav className="space-y-1">
                            {bottomNavItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-slate-100"
                                    >
                                        <Icon className="h-5 w-5 text-slate-500" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                            <form action="/api/admin/logout" method="post">
                                <button
                                    type="submit"
                                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-rose-400 transition hover:bg-rose-500/10"
                                >
                                    <LucideLogOut className="h-5 w-5" />
                                    Đăng xuất
                                </button>
                            </form>
                        </nav>

                        <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-emerald-500/10 to-transparent p-4">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-black font-bold text-xs">
                                    AD
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-xs font-bold text-white">Administrator</p>
                                    <p className="truncate text-[10px] text-slate-500">admin@demo.com</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:pl-0 pt-16 lg:pt-0 overflow-auto">
                {/* Top Header (Desktop) */}
                <header className="hidden h-16 w-full items-center justify-between border-b border-white/5 bg-[#020617]/50 px-8 backdrop-blur-sm lg:flex">
                    <div className="relative w-96">
                        <LucideSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm tác vụ..."
                            className="h-10 w-full rounded-full border border-white/5 bg-white/5 pl-10 pr-4 text-sm text-slate-200 outline-none transition focus:border-emerald-500/30 focus:bg-white/10"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="relative rounded-full border border-white/5 bg-white/5 p-2 text-slate-400 transition hover:bg-white/10 hover:text-slate-100">
                            <LucideBell className="h-5 w-5" />
                            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
                        </button>
                        <div className="h-8 w-px bg-white/10" />
                        <div className="flex items-center gap-3 text-sm font-medium">
                            <span className="text-slate-400">Xin chào,</span>
                            <span className="text-emerald-400">Quản trị viên</span>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-4 sm:p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
