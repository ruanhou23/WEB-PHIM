"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LucideActivity,
  LucideUsers,
  LucideBot,
  LucideShieldOff,
  LucideRefreshCw,
  LucideLoader2,
  LucideGlobe,
  LucideBan,
  LucideCheck,
  LucideEye,
  LucideBarChart3,
  LucideClock,
} from "lucide-react";

type AnalyticsData = {
  totalRequests24h: number;
  uniqueVisitors24h: number;
  botRequests24h: number;
  blockedRequests24h: number;
  topPages: { path: string; count: number }[];
  topIPs: { ip: string; count: number; isBlocked: boolean }[];
  hourlyData: { hour: string; views: number; unique: number; bots: number }[];
  recentLogs: {
    path: string;
    method: string;
    ip: string;
    userAgent: string;
    timestamp: number;
    isBot: boolean;
    blocked: boolean;
  }[];
  blockedIPsList: string[];
};

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/analytics");
      if (!res.ok) throw new Error("Không thể tải dữ liệu");
      const json = await res.json();
      setData(json);
      setError("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Auto-refresh mỗi 30s
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleIPAction = async (ip: string, action: "block" | "unblock") => {
    setActionLoading(ip);
    try {
      const res = await fetch("/api/admin/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ip }),
      });
      if (!res.ok) throw new Error("Thao tác thất bại");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Tìm giá trị max cho biểu đồ
  const maxViews = data ? Math.max(...data.hourlyData.map((h) => h.views), 1) : 1;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <LucideBarChart3 className="h-8 w-8 text-emerald-400" />
            Lượt truy cập & Bảo mật
          </h1>
          <p className="text-slate-400">Theo dõi lưu lượng truy cập, phát hiện bot và quản lý IP.</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
        >
          {loading ? (
            <LucideLoader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LucideRefreshCw className="h-4 w-4" />
          )}
          Tải lại
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className="flex flex-col items-center justify-center py-20">
          <LucideLoader2 className="h-10 w-10 animate-spin text-emerald-500 mb-4" />
          <p className="text-slate-500">Đang tải dữ liệu...</p>
        </div>
      ) : data ? (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Tổng request (24h)",
                value: data.totalRequests24h.toLocaleString(),
                icon: LucideActivity,
                color: "emerald",
              },
              {
                label: "IP duy nhất",
                value: data.uniqueVisitors24h.toLocaleString(),
                icon: LucideUsers,
                color: "sky",
              },
              {
                label: "Bot/Crawler",
                value: data.botRequests24h.toLocaleString(),
                icon: LucideBot,
                color: "amber",
              },
              {
                label: "Đã chặn",
                value: data.blockedRequests24h.toLocaleString(),
                icon: LucideShieldOff,
                color: "rose",
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-3xl border border-white/5 bg-[#070b18] p-6 transition-all hover:border-emerald-500/20"
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`rounded-xl p-2.5 ring-1 ${
                      stat.color === "emerald"
                        ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                        : stat.color === "sky"
                          ? "bg-sky-500/10 text-sky-400 ring-sky-500/20"
                          : stat.color === "amber"
                            ? "bg-amber-500/10 text-amber-400 ring-amber-500/20"
                            : "bg-rose-500/10 text-rose-400 ring-rose-500/20"
                    }`}
                  >
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium text-slate-400">{stat.label}</p>
                  <p className="mt-1 text-3xl font-bold text-white">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Hourly Chart */}
          <div className="rounded-3xl border border-white/5 bg-[#070b18] p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <LucideClock className="h-5 w-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">Lượt truy cập theo giờ (24h)</h2>
            </div>
            <div className="flex items-end gap-1 h-40">
              {data.hourlyData.map((h, i) => {
                const height = Math.max((h.views / maxViews) * 100, 2);
                const botHeight = h.bots > 0 ? Math.max((h.bots / maxViews) * 100, 2) : 0;
                return (
                  <div key={i} className="group relative flex-1 flex flex-col items-center">
                    {/* Tooltip */}
                    <div className="absolute -top-20 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                      <div className="whitespace-nowrap rounded-lg bg-slate-800 px-3 py-2 text-xs shadow-lg ring-1 ring-white/10">
                        <p className="font-bold text-white">{h.hour}</p>
                        <p className="text-emerald-400">{h.views} views</p>
                        <p className="text-sky-400">{h.unique} unique</p>
                        {h.bots > 0 && <p className="text-amber-400">{h.bots} bots</p>}
                      </div>
                    </div>
                    {/* Bars */}
                    <div className="w-full flex flex-col gap-0.5 items-center" style={{ height: "100%" }}>
                      <div className="flex-1" />
                      {botHeight > 0 && (
                        <div
                          className="w-full rounded-t bg-amber-500/40 min-w-[4px]"
                          style={{ height: `${botHeight}%` }}
                        />
                      )}
                      <div
                        className="w-full rounded-t bg-emerald-500/60 transition-all group-hover:bg-emerald-500 min-w-[4px]"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    {/* Label */}
                    {i % 3 === 0 && (
                      <span className="mt-2 text-[9px] text-slate-600">{h.hour}</span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center gap-6 text-[10px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Người dùng
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500/50" /> Bot
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Pages */}
            <div className="rounded-3xl border border-white/5 bg-[#070b18] p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <LucideEye className="h-5 w-5 text-sky-400" />
                <h2 className="text-lg font-bold text-white">Trang được xem nhiều nhất</h2>
              </div>
              {data.topPages.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">Chưa có dữ liệu</p>
              ) : (
                <div className="space-y-2">
                  {data.topPages.map((p, i) => (
                    <div
                      key={p.path}
                      className="flex items-center gap-3 rounded-xl bg-white/[0.02] p-3 transition hover:bg-white/[0.05]"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-[10px] font-bold text-sky-400 ring-1 ring-sky-500/20">
                        {i + 1}
                      </span>
                      <span className="flex-1 truncate text-sm text-slate-300 font-mono">
                        {p.path}
                      </span>
                      <span className="text-xs font-bold text-slate-500">{p.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top IPs & Blocked */}
            <div className="rounded-3xl border border-white/5 bg-[#070b18] p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <LucideGlobe className="h-5 w-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white">Top IP truy cập</h2>
              </div>
              {data.topIPs.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">Chưa có dữ liệu</p>
              ) : (
                <div className="space-y-2">
                  {data.topIPs.map((item) => (
                    <div
                      key={item.ip}
                      className="flex items-center gap-3 rounded-xl bg-white/[0.02] p-3 transition hover:bg-white/[0.05]"
                    >
                      <span className="flex-1 truncate text-sm text-slate-300 font-mono">
                        {item.ip}
                      </span>
                      <span className="text-xs font-bold text-slate-500">{item.count} req</span>
                      <button
                        onClick={() =>
                          handleIPAction(item.ip, item.isBlocked ? "unblock" : "block")
                        }
                        disabled={actionLoading === item.ip}
                        className={`flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[10px] font-bold transition ${
                          item.isBlocked
                            ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 hover:bg-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20 hover:bg-rose-500/20"
                        }`}
                      >
                        {actionLoading === item.ip ? (
                          <LucideLoader2 className="h-3 w-3 animate-spin" />
                        ) : item.isBlocked ? (
                          <>
                            <LucideCheck className="h-3 w-3" /> Bỏ chặn
                          </>
                        ) : (
                          <>
                            <LucideBan className="h-3 w-3" /> Chặn
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Blocked IPs list */}
              {data.blockedIPsList.length > 0 && (
                <div className="mt-6 border-t border-white/5 pt-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-rose-400">
                    IP đang bị chặn ({data.blockedIPsList.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {data.blockedIPsList.map((ip) => (
                      <span
                        key={ip}
                        className="flex items-center gap-1.5 rounded-lg bg-rose-500/10 px-2.5 py-1 text-[11px] font-mono text-rose-400 ring-1 ring-rose-500/20"
                      >
                        <LucideBan className="h-3 w-3" />
                        {ip}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Logs Table */}
          <div className="rounded-3xl border border-white/5 bg-[#070b18] shadow-xl overflow-hidden">
            <div className="p-6 border-b border-white/5">
              <h2 className="text-lg font-bold text-white flex items-center gap-3">
                <LucideActivity className="h-5 w-5 text-emerald-400" />
                Truy cập gần đây
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-white/[0.02] text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <th className="px-6 py-3">Thời gian</th>
                    <th className="px-6 py-3">Trang</th>
                    <th className="px-6 py-3">IP</th>
                    <th className="px-6 py-3">User-Agent</th>
                    <th className="px-6 py-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.recentLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                        Chưa có dữ liệu. Hãy truy cập một vài trang để bắt đầu ghi nhận.
                      </td>
                    </tr>
                  ) : (
                    data.recentLogs.map((log, i) => (
                      <tr key={i} className="transition hover:bg-white/[0.02]">
                        <td className="whitespace-nowrap px-6 py-3 text-xs text-slate-500">
                          {new Date(log.timestamp).toLocaleTimeString("vi-VN")}
                        </td>
                        <td className="px-6 py-3 text-xs text-slate-300 font-mono max-w-[200px] truncate">
                          <span className="mr-1.5 text-[9px] font-bold text-slate-600">
                            {log.method}
                          </span>
                          {log.path}
                        </td>
                        <td className="px-6 py-3 text-xs text-slate-400 font-mono">{log.ip}</td>
                        <td className="px-6 py-3 text-[10px] text-slate-600 max-w-[250px] truncate">
                          {log.userAgent}
                        </td>
                        <td className="px-6 py-3">
                          {log.blocked ? (
                            <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-400">
                              CHẶN
                            </span>
                          ) : log.isBot ? (
                            <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                              BOT
                            </span>
                          ) : (
                            <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                              OK
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
