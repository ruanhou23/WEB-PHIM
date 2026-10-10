import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/admin/auth";
import { getGenres, getMoviesByGenre } from "@/lib/api/ophim";
import {
  LucideTags,
  LucideFilm,
  LucideBarChart,
  LucideRefreshCcw,
  LucideAlertCircle
} from "lucide-react";

export const revalidate = 3600; // Cache for 1 hour

export default async function AdminGenresStatsPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  if (!sessionCookie) {
    redirect("/admin");
  }
  
  const session = await verifySessionCookie(sessionCookie);
  if (!session) {
    redirect("/admin");
  }

  let error = "";
  let stats: { id: string; name: string; slug: string; count: number }[] = [];
  let totalAllGenresCount = 0;

  try {
    const genres = await getGenres();
    
    // Fetch count for each genre. We limit to 1 item to speed up response.
    const promises = genres.map(async (genre) => {
      try {
        const response = await getMoviesByGenre(genre.slug, { limit: 1 });
        const count = response.data.params?.pagination?.totalItems ?? 0;
        return {
          id: genre._id,
          name: genre.name,
          slug: genre.slug,
          count
        };
      } catch (err) {
        return {
          id: genre._id,
          name: genre.name,
          slug: genre.slug,
          count: 0
        };
      }
    });

    const results = await Promise.all(promises);
    
    // Sort descending by count
    stats = results.sort((a, b) => b.count - a.count);
    totalAllGenresCount = stats.reduce((sum, item) => sum + item.count, 0);
    
  } catch (err) {
    error = err instanceof Error ? err.message : "Không thể tải dữ liệu thể loại.";
  }

  const highestCount = stats.length > 0 ? stats[0].count : 1;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <LucideTags className="h-8 w-8 text-emerald-400" />
            Thống kê thể loại
          </h1>
          <p className="text-slate-400">Xem tổng quan số lượng phim theo từng thể loại cụ thể.</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400 shadow-lg">
          <LucideAlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="group relative overflow-hidden rounded-3xl border border-white/5 bg-[#070b18] p-6 shadow-xl transition-all hover:border-emerald-500/30">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl transition-all group-hover:bg-emerald-500/20" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Tổng số thể loại</p>
              <h2 className="mt-2 text-4xl font-black text-white">{stats.length}</h2>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
              <LucideTags className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-3xl border border-white/5 bg-[#070b18] p-6 shadow-xl transition-all hover:border-sky-500/30">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-sky-500/10 blur-3xl transition-all group-hover:bg-sky-500/20" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Tổng lượt gán thẻ</p>
              <h2 className="mt-2 text-4xl font-black text-white">{totalAllGenresCount.toLocaleString()}</h2>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/20">
              <LucideFilm className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-3xl border border-white/5 bg-[#070b18] p-6 shadow-xl transition-all hover:border-purple-500/30 sm:col-span-2 lg:col-span-1">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-purple-500/10 blur-3xl transition-all group-hover:bg-purple-500/20" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Nhiều phim nhất</p>
              <h2 className="mt-2 text-2xl font-bold text-white truncate max-w-[150px]" title={stats[0]?.name}>
                {stats[0]?.name || "—"}
              </h2>
              <p className="mt-1 text-sm text-purple-400 font-medium">{stats[0]?.count?.toLocaleString() || 0} phim</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20">
              <LucideBarChart className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart / List */}
      <section className="rounded-3xl border border-white/5 bg-[#070b18] p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Biểu đồ số lượng</h3>
          <p className="text-xs text-slate-500 flex items-center gap-1"><LucideRefreshCcw className="w-3 h-3"/> Cập nhật 1 giờ / lần</p>
        </div>

        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {stats.map((item, index) => {
            const percentage = highestCount > 0 ? (item.count / highestCount) * 100 : 0;
            return (
              <div key={item.id} className="group relative flex flex-col gap-2">
                <div className="flex items-end justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex w-6 justify-center text-xs font-bold text-slate-600 group-hover:text-emerald-500 transition-colors">
                      {index + 1}
                    </span>
                    <span className="font-semibold text-slate-200 group-hover:text-white transition-colors">
                      {item.name}
                    </span>
                    <span className="hidden sm:inline-block rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-500 group-hover:bg-white/10 group-hover:text-slate-400 transition-colors">
                      {item.slug}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-emerald-400">
                    {item.count.toLocaleString()}
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="ml-9 h-2.5 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-1000 ease-out"
                    style={{ width: `${Math.max(percentage, 1)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.5);
        }
      `}} />
    </div>
  );
}
