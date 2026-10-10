"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Home,
  Film,
  Tv,
  Clapperboard,
  MonitorPlay,
  Laugh,
  Search,
} from "lucide-react";
import type { OPhimGenre, OPhimCountry } from "@/lib/types/api";
import { AIDebugPanel } from "./components/ai-debug-panel";
import AccessTracker from "./components/access-tracker";
import { AuthProvider } from "./components/auth-context";
import { UserAuthModal } from "./components/user-auth-modal";
import { UserNav } from "./components/user-nav";

type AppShellProps = {
  children: React.ReactNode;
  genres?: OPhimGenre[];
  countries?: OPhimCountry[];
};

const NAV_ITEMS = [
  { href: "/", label: "Trang chu", mobileLabel: "Home", icon: Home },
  { href: "/collection/list", label: "Phim sưu tầm", mobileLabel: "Sưu tầm", icon: MonitorPlay },
  { href: "/movies", label: "Danh sach phim", mobileLabel: "Movies", icon: Film },
  { href: "/movies?list=phim-chieu-rap", label: "Phim chieu rap", mobileLabel: "Rap", icon: Clapperboard, listSlug: "phim-chieu-rap" },
  { href: "/movies?list=phim-bo", label: "Phim bo", mobileLabel: "Bo", icon: Tv, listSlug: "phim-bo" },
  { href: "/movies?list=phim-le", label: "Phim le", mobileLabel: "Le", icon: MonitorPlay, listSlug: "phim-le" },
  { href: "/movies?list=hoat-hinh", label: "Hoat hinh", mobileLabel: "Anime", icon: Laugh, listSlug: "hoat-hinh" },
];

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedList = searchParams.get("list");

  const currentMoviesList = selectedList || "phim-moi";
  const isNavItemActive = (item: (typeof NAV_ITEMS)[number]) => {
    const itemPath = item.href.split("?")[0];
    if (pathname !== itemPath) return false;
    if ("listSlug" in item) {
      return currentMoviesList === item.listSlug;
    }
    if (item.href === "/movies") return !selectedList || currentMoviesList === "phim-moi";
    return true;
  };

  // Trang admin có layout riêng biệt, không render navbar, footer, auth context người xem
  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }

  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#050816] pb-16 text-slate-100 lg:pb-0">
        <AccessTracker />
        <div className="flex flex-col transition-all duration-300 ease-in-out">
          {/* Main Content Area */}
          <div className="relative flex flex-col min-w-0 w-full">
            {/* Top Header (Search & User Nav) */}
            <header className="sticky top-0 z-30 flex h-16 items-center border-b border-white/5 bg-[#050816]/95 px-4 backdrop-blur lg:bg-[#050816]/80 lg:px-6 md:h-20 lg:h-16 justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Mobile/Default Logo */}
                <Link href="/" className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
                    <span className="font-bold text-white">M</span>
                  </div>
                  <span className="font-bold text-white">mePhim</span>
                </Link>
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Tìm kiếm phim, diễn viên..."
                  className="w-full rounded-full border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500/50 focus:bg-white/10 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                />
              </div>

              {/* User Account / Login Button */}
              <div className="flex items-center gap-3">
                <UserNav />
              </div>
            </header>

            <main suppressHydrationWarning className="flex-1">{children}</main>

            <footer className="mt-auto border-t border-white/5 bg-[#040611] py-8">
              <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 text-center sm:text-left sm:flex-row sm:justify-between">
                <div>
                  <p className="font-bold text-slate-200">mePhim</p>
                  <p className="mt-2 text-xs text-slate-500">Trai nghiem xem phim tot nhat cua ban.</p>
                </div>
                <div className="flex flex-col gap-2 text-xs text-slate-500 sm:items-end">
                  <p>© 2024 mePhim. All rights reserved.</p>
                  <div className="flex gap-4">
                    <Link href="#" className="hover:text-emerald-400">Privacy</Link>
                    <Link href="#" className="hover:text-emerald-400">Terms</Link>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#070b18]/95 px-3 pb-safe pt-2 backdrop-blur lg:hidden">
          <div className="flex items-center justify-start gap-1 overflow-x-auto custom-scrollbar">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = isNavItemActive(item);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-w-[64px] flex-col items-center gap-1 rounded-lg p-2 transition-colors ${isActive ? "bg-emerald-500/10 text-emerald-400" : "text-slate-500 hover:bg-white/5 hover:text-emerald-300"
                    }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? "fill-emerald-400/20" : ""}`} />
                  <span className="text-[10px] font-medium">{item.mobileLabel}</span>
                </Link>
              );
            })}
          </div>
        </nav>
        <AIDebugPanel />
        <UserAuthModal />
      </div>
    </AuthProvider>
  );
}
