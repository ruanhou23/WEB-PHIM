"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  LucideLogIn,
  LucideLogOut,
  LucideShield,
  LucideUser,
  LucideChevronDown,
  LucideExternalLink,
} from "lucide-react";
import { useAuth } from "./auth-context";

export function UserNav() {
  const { user, loading, userLoginEnabled, openAuthModal, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) {
    return null;
  }

  // Nếu chưa đăng nhập -> ẩn hoàn toàn nút đăng nhập ở góc trên bên phải
  if (!user) {
    return null;
  }

  // Đã đăng nhập
  const initials = (user.displayName || user.email || "U")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 p-1 pr-3 transition hover:bg-white/10"
      >
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs ${
            user.isAdmin
              ? "bg-gradient-to-br from-amber-400 to-emerald-500 text-black shadow-md shadow-amber-500/20"
              : "bg-gradient-to-br from-emerald-500 to-sky-500 text-black"
          }`}
        >
          {initials}
        </div>
        <div className="hidden text-left sm:block">
          <p className="max-w-[100px] truncate text-xs font-semibold text-white">
            {user.displayName || user.email.split("@")[0]}
          </p>
          <span
            className={`text-[9px] font-bold uppercase tracking-wider ${
              user.isAdmin ? "text-amber-400" : "text-emerald-400"
            }`}
          >
            {user.isAdmin ? "👑 Admin" : "Thành viên"}
          </span>
        </div>
        <LucideChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-white/10 bg-[#070b18] p-2 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="border-b border-white/5 p-3">
            <p className="font-bold text-sm text-white truncate">{user.displayName}</p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-300">
              {user.isAdmin ? (
                <>
                  <LucideShield className="h-3 w-3 text-amber-400" />
                  <span className="text-amber-300">Quản trị viên</span>
                </>
              ) : (
                <>
                  <LucideUser className="h-3 w-3 text-emerald-400" />
                  <span className="text-emerald-300">Tài khoản Người xem</span>
                </>
              )}
            </div>
          </div>

          <div className="space-y-1 py-1.5">
            {user.isAdmin && (
              <Link
                href="/admin/dashboard"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-amber-400 transition hover:bg-amber-400/10"
              >
                <div className="flex items-center gap-2.5">
                  <LucideShield className="h-4 w-4" />
                  <span>Trang Quản trị (Admin)</span>
                </div>
                <LucideExternalLink className="h-3.5 w-3.5 opacity-60" />
              </Link>
            )}

            <button
              onClick={() => {
                setDropdownOpen(false);
                logout();
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-rose-400 transition hover:bg-rose-500/10"
            >
              <LucideLogOut className="h-4 w-4" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
