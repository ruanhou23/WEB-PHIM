import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getListBySlug, searchMovies } from "@/lib/api/ophim";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/admin/auth";
import MoviePosterImage from "./MoviePosterImage";
import ExcelMoviesTab from "./ExcelMoviesTab";
import {
  LucideSearch,
  LucideChevronLeft,
  LucideChevronRight,
  LucideRotateCcw,
  LucideFilter,
  LucideEye,
  LucideTrash2,
  LucideInfo,
  LucideFileSpreadsheet,
  LucideGlobe
} from "lucide-react";

type AdminMoviesPageProps = {
  searchParams?:
  | {
    list?: string;
    keyword?: string;
    page?: string;
    source?: string;
  }
  | Promise<{
    list?: string;
    keyword?: string;
    page?: string;
    source?: string;
  }>;
};

const listTabs = [
  { key: "phim-moi", label: "Phim mới" },
  { key: "phim-le", label: "Phim lẻ" },
  { key: "phim-bo", label: "Phim bộ" },
];

const DEFAULT_OPHIM_CDN = "https://phimimg.com";
const OPHIM_PROXY_IMAGE_BASE = "https://ophim17.cc/_next/image";
const FALLBACK_POSTER_DATA_URI = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="360"><rect width="100%" height="100%" fill="#0b1020"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-family="Arial" font-size="14">No Image</text></svg>`,
)}`;
const FORCE_PROXY_IMAGE_NAME_SET = new Set([
  "benh-dich-hach-thumb.jpg",
  "kiem-com-bang-tro-choi-sinh-tu-thumb.jpg",
]);

function buildOphimProxyImageUrl(rawUrl: string, width: number = 1920): string {
  return `${OPHIM_PROXY_IMAGE_BASE}?url=${encodeURIComponent(rawUrl)}&w=${width}&q=75`;
}

function resolveOphimImageUrl(
  imagePath: string | undefined,
  cdnDomain: string = DEFAULT_OPHIM_CDN,
): string {
  if (!imagePath) return FALLBACK_POSTER_DATA_URI;
  const normalized = imagePath.trim();
  if (!normalized) return FALLBACK_POSTER_DATA_URI;
  const fileName = normalized.split("/").pop()?.toLowerCase() ?? "";
  if (FORCE_PROXY_IMAGE_NAME_SET.has(fileName)) {
    const cleanDomain = cdnDomain.replace(/\/+$/, "");
    const cleanPath = normalized.startsWith("/") ? normalized : `/${normalized}`;
    return buildOphimProxyImageUrl(`${cleanDomain}${cleanPath}`, 1920);
  }
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }
  const cleanDomain = cdnDomain.replace(/\/+$/, "");
  const cleanPath = normalized.startsWith("/") ? normalized : `/${normalized}`;
  return `${cleanDomain}${cleanPath}`;
}

function buildPageHref(
  list: string,
  keyword: string,
  page: number,
  currentPage: number,
): string {
  const params = new URLSearchParams();
  if (list !== "phim-moi") params.set("list", list);
  if (keyword) params.set("keyword", keyword);
  if (page !== currentPage) params.set("page", String(page));
  const query = params.toString();
  return query ? `/admin/movies?${query}` : "/admin/movies";
}

export default async function AdminMoviesPage({ searchParams }: AdminMoviesPageProps) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    redirect("/admin");
  }
  const session = await verifySessionCookie(sessionCookie);
  if (!session) {
    redirect("/admin");
  }

  const resolvedSearchParams = await Promise.resolve(searchParams ?? {});
  const source = resolvedSearchParams.source === "excel" ? "excel" : "api";
  const selectedList =
    resolvedSearchParams.list && ["phim-moi", "phim-le", "phim-bo"].includes(resolvedSearchParams.list)
      ? resolvedSearchParams.list
      : "phim-moi";
  const keyword = (resolvedSearchParams.keyword ?? "").trim();
  const pageValue = Number.parseInt(resolvedSearchParams.page ?? "1", 10);
  const currentPage = Number.isNaN(pageValue) || pageValue < 1 ? 1 : pageValue;

  let items: Array<{
    _id: string;
    name: string;
    slug: string;
    year: number;
    quality?: string;
    lang?: string;
    type: string;
    episode_current?: string;
    poster_url?: string;
    thumb_url?: string;
  }> = [];
  let totalItems = 0;
  let perPage = 24;
  let ophimCdnDomain = DEFAULT_OPHIM_CDN;
  let error = "";

  try {
    const response = keyword
      ? await searchMovies(keyword, { page: currentPage, limit: perPage })
      : await getListBySlug(selectedList, { page: currentPage, limit: perPage });

    items = response.data.items as typeof items;
    totalItems = response.data.params?.pagination?.totalItems ?? items.length;
    perPage = response.data.params?.pagination?.totalItemsPerPage ?? perPage;
    const maybeCdn = (response.data as { APP_DOMAIN_CDN_IMAGE?: string })
      .APP_DOMAIN_CDN_IMAGE;
    if (maybeCdn) ophimCdnDomain = maybeCdn;
  } catch (e) {
    error = e instanceof Error ? e.message : "Không thể tải danh sách phim";
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / Math.max(1, perPage)));
  const prevPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(totalPages, currentPage + 1);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Info */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-white">Quản lý phim</h1>
        <p className="text-slate-400">Duyệt danh sách, tìm kiếm và kiểm tra trạng thái phim.</p>
      </div>

      {/* Source Tabs: API vs Excel */}
      <div className="flex items-center gap-2">
        <Link
          href="/admin/movies"
          className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold transition-all ${source === "api"
            ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
            : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-100"
            }`}
        >
          <LucideGlobe className="h-3.5 w-3.5" />
          API OPhim
        </Link>
        <Link
          href="/admin/movies?source=excel"
          className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold transition-all ${source === "excel"
            ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
            : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-100"
            }`}
        >
          <LucideFileSpreadsheet className="h-3.5 w-3.5" />
          File Excel
        </Link>
      </div>

      {source === "excel" ? (
        <ExcelMoviesTab />
      ) : (
        <>
          {/* Filters & Search */}
          <section className="rounded-3xl border border-white/5 bg-[#070b18] p-6 shadow-xl">
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-center gap-2">
                <div className="mr-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <LucideFilter className="h-3.5 w-3.5" /> Bộ lọc:
                </div>
                {listTabs.map((tab) => {
                  const active = selectedList === tab.key && !keyword;
                  return (
                    <Link
                      key={tab.key}
                      href={buildPageHref(tab.key, "", 1, currentPage)}
                      className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${active
                        ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                        : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-100"
                        }`}
                    >
                      {tab.label}
                    </Link>
                  );
                })}
              </div>

              <form action="/admin/movies" method="get" className="flex flex-col gap-3 sm:flex-row">
                <input type="hidden" name="list" value={selectedList} />
                <div className="relative flex-1">
                  <LucideSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    name="keyword"
                    defaultValue={keyword}
                    placeholder="Tìm phim theo tên hoặc slug..."
                    className="h-11 w-full rounded-xl border border-white/10 bg-black/40 pl-10 pr-4 text-sm text-slate-100 outline-none transition focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="h-11 rounded-xl bg-emerald-500 px-6 text-sm font-bold text-black transition hover:bg-emerald-400 active:scale-95"
                  >
                    Tìm phim
                  </button>
                  <Link
                    href="/admin/movies"
                    className="flex h-11 items-center gap-2 rounded-xl bg-white/5 px-4 text-sm font-bold text-slate-200 transition hover:bg-white/10"
                  >
                    <LucideRotateCcw className="h-4 w-4" /> Làm lại
                  </Link>
                </div>
              </form>
            </div>
          </section>

          {error && (
            <div className="flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400">
              <LucideInfo className="h-5 w-5" />
              {error}
            </div>
          )}

          {/* Movie Table */}
          <section className="overflow-hidden rounded-3xl border border-white/5 bg-[#070b18] shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02] text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <th className="px-6 py-4">Thông tin phim</th>
                    <th className="px-6 py-4">Năm</th>
                    <th className="px-6 py-4">Phân loại</th>
                    <th className="px-6 py-4">Chất lượng</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-2 text-slate-500">
                          <LucideSearch className="h-10 w-10 opacity-20" />
                          <p className="text-lg font-medium opacity-50">Không tìm thấy phim nào</p>
                          <p className="text-xs">Hãy thử thay đổi từ khóa hoặc bộ lọc</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    items.map((movie) => (
                      <tr key={movie._id || movie.slug} className="group transition hover:bg-white/[0.02]">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <MoviePosterImage
                              src={resolveOphimImageUrl(movie.poster_url || movie.thumb_url, ophimCdnDomain)}
                              alt={movie.name}
                            />
                            <div className="min-w-0">
                              <p className="truncate font-bold text-white group-hover:text-emerald-400">{movie.name}</p>
                              <p className="truncate text-[11px] font-medium text-slate-500 uppercase tracking-tighter">
                                {movie.slug}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-400 font-medium">{movie.year || "—"}</td>
                        <td className="px-6 py-4">
                          <span className="rounded-md bg-white/5 px-2 py-1 text-[10px] font-bold text-slate-400 uppercase">
                            {movie.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span className="font-bold text-emerald-500/80">{movie.quality || "HD"}</span>
                            {movie.episode_current && (
                              <span className="text-[10px] text-slate-500">• {movie.episode_current}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/admin/dashboard?slug=${encodeURIComponent(movie.slug)}`}
                              title="Chi tiết"
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-400 transition hover:bg-emerald-500 hover:text-black"
                            >
                              <LucideInfo className="h-4 w-4" />
                            </Link>
                            <Link
                              href={`/watch/${movie.slug}`}
                              title="Xem"
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-400 transition hover:bg-sky-500 hover:text-black"
                            >
                              <LucideEye className="h-4 w-4" />
                            </Link>
                            <button
                              title="Xóa"
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-400 transition hover:bg-rose-500 hover:text-white"
                            >
                              <LucideTrash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col items-center justify-between gap-4 border-t border-white/5 bg-white/[0.01] px-6 py-4 sm:flex-row">
              <p className="text-xs font-medium text-slate-500">
                Trang <span className="text-white">{currentPage}</span> / <span className="text-white">{totalPages}</span>
                <span className="mx-2">•</span>
                Tổng <span className="text-white">{totalItems.toLocaleString()}</span> phim
              </p>
              <div className="flex items-center gap-1">
                <Link
                  href={buildPageHref(selectedList, keyword, prevPage, currentPage)}
                  className={`flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold transition-all ${currentPage > 1
                    ? "bg-white/5 text-slate-200 hover:bg-emerald-500 hover:text-black"
                    : "pointer-events-none opacity-20"
                    }`}
                >
                  <LucideChevronLeft className="h-4 w-4" /> Trước
                </Link>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-[11px] font-bold text-emerald-400 ring-1 ring-emerald-500/20">
                  {currentPage}
                </div>
                <Link
                  href={buildPageHref(selectedList, keyword, nextPage, currentPage)}
                  className={`flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold transition-all ${currentPage < totalPages
                    ? "bg-white/5 text-slate-200 hover:bg-emerald-500 hover:text-black"
                    : "pointer-events-none opacity-20"
                    }`}
                >
                  Sau <LucideChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
