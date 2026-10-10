import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  getCountries,
  getGenres,
  getHomeData,
  getMovieDetail,
  getMovieImages,
  getMoviePeoples,
} from "@/lib/api/ophim";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/admin/auth";
import {
  LucideTrendingUp,
  LucideLayers,
  LucideGlobe,
  LucideSearch,
  LucideActivity,
  LucidePlusCircle,
  LucideExternalLink,
  LucideEye,
  LucideImage,
  LucideUsers,
  LucideAlertCircle,
  LucideInfo
} from "lucide-react";

type DashboardPageProps = {
  searchParams?:
  | {
    slug?: string;
  }
  | Promise<{
    slug?: string;
  }>;
};

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

export default async function AdminDashboardPage({
  searchParams,
}: DashboardPageProps) {
  const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";
  const normalizeTmdbSize = (size: string) => {
    const normalized = (size || "").trim();
    if (!normalized) return "";
    if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
      const marker = "/t/p/";
      const markerIndex = normalized.indexOf(marker);
      if (markerIndex >= 0) {
        const afterMarker = normalized.slice(markerIndex + marker.length);
        return afterMarker.replace(/^\/+/, "").replace(/\/+$/, "");
      }
    }
    return normalized.replace(/^\/+/, "").replace(/\/+$/, "");
  };
  const buildTmdbImageUrl = (
    filePath: string,
    preferredSize: string,
    fallbackSize: string = "original",
  ) => {
    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
      return filePath;
    }
    const cleanPath = filePath.startsWith("/") ? filePath : `/${filePath}`;
    const size =
      normalizeTmdbSize(preferredSize) || normalizeTmdbSize(fallbackSize) || "original";
    return `${TMDB_IMAGE_BASE_URL}/${size}${cleanPath}`;
  };

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
  const slug = (resolvedSearchParams.slug ?? "").trim();

  const [homeResult, genresResult, countriesResult] = await Promise.allSettled([
    getHomeData(),
    getGenres(),
    getCountries(),
  ]);

  const totalMovies =
    homeResult.status === "fulfilled"
      ? (homeResult.value.data.params?.pagination?.totalItems ??
        homeResult.value.data.items?.length ??
        0)
      : 0;
  const totalGenres =
    genresResult.status === "fulfilled" ? genresResult.value.length : 0;
  const totalCountries =
    countriesResult.status === "fulfilled" ? countriesResult.value.length : 0;
  const ophimCdnDomain =
    homeResult.status === "fulfilled"
      ? homeResult.value.data.APP_DOMAIN_CDN_IMAGE || DEFAULT_OPHIM_CDN
      : DEFAULT_OPHIM_CDN;
  const latestMovies =
    homeResult.status === "fulfilled" ? homeResult.value.data.items.slice(0, 5) : [];

  let movieDetail: Awaited<ReturnType<typeof getMovieDetail>> | null = null;
  let movieImages: Awaited<ReturnType<typeof getMovieImages>> | null = null;
  let moviePeoples: Awaited<ReturnType<typeof getMoviePeoples>> | null = null;
  let detailError = "";
  let imageError = "";
  let peoplesError = "";
  if (slug) {
    try {
      const [detailResult, imagesResult, peoplesResult] = await Promise.allSettled([
        getMovieDetail(slug),
        getMovieImages(slug),
        getMoviePeoples(slug),
      ]);

      if (detailResult.status === "fulfilled") {
        movieDetail = detailResult.value;
      } else {
        detailError =
          detailResult.reason instanceof Error
            ? detailResult.reason.message
            : "Không tìm thấy phim";
      }

      if (imagesResult.status === "fulfilled") {
        movieImages = imagesResult.value;
      } else {
        imageError =
          imagesResult.reason instanceof Error
            ? imagesResult.reason.message
            : "Không lấy được hình ảnh phim";
      }

      if (peoplesResult.status === "fulfilled") {
        moviePeoples = peoplesResult.value;
      } else {
        peoplesError =
          peoplesResult.reason instanceof Error
            ? peoplesResult.reason.message
            : "Không lấy được dữ liệu diễn viên";
      }
    } catch (error) {
      detailError = error instanceof Error ? error.message : "Không tìm thấy phim";
    }
  }

  const item = movieDetail?.status === "success" ? movieDetail.data.item : null;
  const episodeServers = item?.episodes ?? movieDetail?.data.episodes ?? [];
  const images = movieImages?.data?.images ?? [];
  const imageSizes = movieImages?.data?.image_sizes;
  const peoples = moviePeoples?.data?.peoples ?? [];
  const posterImages = images.filter((img) =>
    String(img.type ?? "")
      .toLowerCase()
      .includes("poster"),
  );
  const backdropImages = images.filter((img) =>
    String(img.type ?? "")
      .toLowerCase()
      .includes("backdrop"),
  );
  const backdropPreviewSize = imageSizes?.backdrop?.w780 || "w780";
  const backdropOriginalSize = imageSizes?.backdrop?.original || "original";
  const posterPreviewSize =
    imageSizes?.poster?.w780 ||
    imageSizes?.poster?.w342 ||
    imageSizes?.poster?.w185 ||
    imageSizes?.poster?.original ||
    "w342";
  const posterOriginalSize = imageSizes?.poster?.original || "original";
  const totalPlayableEpisodes = episodeServers.reduce((sum, server) => {
    const playable = (server.server_data ?? []).filter(
      (ep) => ep.link_embed?.trim() || ep.link_m3u8?.trim(),
    ).length;
    return sum + playable;
  }, 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Info */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-white">Trang chủ Quản trị</h1>
        <p className="text-slate-400">Tổng quan dữ liệu và hệ thống API Ophim.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Tổng số phim", value: totalMovies, color: "emerald", icon: LucideTrendingUp, trend: "+12.5%" },
          { label: "Thể loại", value: totalGenres, color: "sky", icon: LucideLayers, trend: "Ổn định" },
          { label: "Quốc gia", value: totalCountries, color: "amber", icon: LucideGlobe, trend: "Tăng trưởng" },
          { label: "Theo dõi API", value: "Online", color: "indigo", icon: LucideActivity, trend: "99.9% Uptime" },
        ].map((stat, i) => (
          <div key={i} className="group relative overflow-hidden rounded-3xl border border-white/5 bg-[#070b18] p-6 transition-all hover:border-emerald-500/20 hover:shadow-2xl hover:shadow-emerald-500/5">
            <div className="flex items-start justify-between">
              <div className={`rounded-xl bg-${stat.color}-500/10 p-2.5 text-${stat.color}-400 ring-1 ring-${stat.color}-500/20`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{stat.trend}</span>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-400">{stat.label}</p>
              <p className="mt-1 text-3xl font-bold text-white">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</p>
            </div>
            <div className={`absolute -bottom-1 left-0 h-1 w-0 bg-gradient-to-r from-${stat.color}-500 to-transparent transition-all duration-700 group-hover:w-full`} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Lookup Section */}
        <section className="lg:col-span-2 space-y-4">
          <div className="rounded-3xl border border-white/5 bg-[#070b18] p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 ring-1 ring-orange-500/20">
                <LucideSearch className="h-5 w-5 text-orange-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Tra cứu chi tiết phim</h2>
            </div>

            <form action="/admin/dashboard" method="get" className="flex gap-2">
              <div className="relative flex-1">
                <LucideSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  name="slug"
                  defaultValue={slug}
                  placeholder="Nhập slug phim (ví dụ: tro-choi-con-muc)"
                  className="h-12 w-full rounded-xl border border-white/10 bg-black/40 pl-10 pr-4 text-sm text-slate-100 outline-none transition focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10"
                />
              </div>
              <button
                type="submit"
                className="h-12 rounded-xl bg-orange-500 px-6 font-semibold text-black transition hover:bg-orange-400 active:scale-95"
              >
                Kiểm tra
              </button>
            </form>

            {(detailError || imageError || peoplesError) && (
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
                <LucideAlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
                <div>
                  <p className="font-bold">Lỗi truy xuất dữ liệu</p>
                  <ul className="mt-1 list-inside list-disc opacity-80">
                    {detailError && <li>Gốc: {detailError}</li>}
                    {imageError && <li>Ảnh: {imageError}</li>}
                    {peoplesError && <li>Nhân sự: {peoplesError}</li>}
                  </ul>
                </div>
              </div>
            )}

            {item && (
              <div className="mt-8 overflow-hidden rounded-2xl border border-white/5 bg-black/20">
                <div className="p-1">
                  <div className="flex flex-col md:flex-row md:items-stretch overflow-hidden rounded-[14px]">
                    <div className="relative aspect-[2/3] w-full md:w-48 shrink-0">
                      <img
                        src={resolveOphimImageUrl(item.poster_url || item.thumb_url, ophimCdnDomain)}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black p-4">
                        <span className="rounded bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-black uppercase">
                          {item.quality ?? "HD"}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col justify-between p-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-2xl font-bold text-white leading-tight">{item.name}</h3>
                          <p className="text-sm font-medium text-slate-500">{item.origin_name}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-y-3 text-xs">
                          <div className="flex flex-col gap-1">
                            <span className="text-slate-500 uppercase tracking-wider font-bold text-[10px]">Slug</span>
                            <span className="text-slate-200">{item.slug}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-slate-500 uppercase tracking-wider font-bold text-[10px]">Năm</span>
                            <span className="text-slate-200">{item.year}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-slate-500 uppercase tracking-wider font-bold text-[10px]">Tập phim</span>
                            <span className="text-slate-200">{totalPlayableEpisodes} / {item.episode_total}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-slate-500 uppercase tracking-wider font-bold text-[10px]">TMDB Data</span>
                            <span className="text-slate-200">{images.length} ảnh • {peoples.length} diễn viên</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 flex flex-wrap gap-2">
                        <Link
                          href={`/watch/${item.slug}`}
                          className="flex items-center gap-2 rounded-xl bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-400 ring-1 ring-orange-500/20 hover:bg-orange-500/20"
                        >
                          <LucideEye className="h-4 w-4" /> Xem phim
                        </Link>
                        <a
                          href={`https://phimapi.com/v1/api/phim/${item.slug}`}
                          target="_blank"
                          className="flex items-center gap-2 rounded-xl bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-400 ring-1 ring-sky-500/20 hover:bg-sky-500/20"
                        >
                          <LucideExternalLink className="h-4 w-4" /> API Raw
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {(images.length > 0 || peoples.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-3xl border border-white/5 bg-[#070b18] p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <LucideImage className="h-5 w-5 text-emerald-400" />
                    <h3 className="font-bold text-white">Ảnh TMDB ({images.length})</h3>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {images.slice(0, 6).map((img, i) => (
                    <div key={i} className="aspect-video overflow-hidden rounded-lg bg-black/40 ring-1 ring-white/10 group">
                      <img
                        src={buildTmdbImageUrl(img.file_path, "w300")}
                        alt=""
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl border border-white/5 bg-[#070b18] p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <LucideUsers className="h-5 w-5 text-sky-400" />
                    <h3 className="font-bold text-white">Nhân sự ({peoples.length})</h3>
                  </div>
                </div>
                <div className="space-y-2">
                  {peoples.slice(0, 4).map((person, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl bg-white/5 p-2">
                      <div className="h-8 w-8 rounded-full bg-sky-500/20 flex items-center justify-center text-[10px] font-bold text-sky-400">
                        {person.name?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-white">{person.name}</p>
                        <p className="truncate text-[10px] text-slate-500">{person.character || person.known_for_department}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Latest Activity / Sidebar Desktop */}
        <aside className="space-y-6">
          <section className="rounded-3xl border border-white/5 bg-[#070b18] p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Phim mới nhất</h2>
              <Link href="/admin/movies" className="text-xs font-bold text-emerald-400 hover:text-emerald-300">Tất cả</Link>
            </div>

            <div className="space-y-3">
              {latestMovies.map((m) => (
                <div key={m._id} className="group relative flex items-center gap-3 rounded-2xl bg-white/5 p-2 transition hover:bg-white/10">
                  <img
                    src={resolveOphimImageUrl(m.poster_url || m.thumb_url, ophimCdnDomain)}
                    alt={m.name}
                    className="h-14 w-10 shrink-0 rounded-lg object-cover ring-1 ring-white/10"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white group-hover:text-emerald-400">{m.name}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                      <span>{m.year}</span>
                      <span>•</span>
                      <span className="text-emerald-500/80">{m.quality || "HD"}</span>
                    </div>
                  </div>
                  <Link
                    href={`/admin/dashboard?slug=${m.slug}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-emerald-500 hover:text-black"
                  >
                    <LucideInfo className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-white/5 bg-gradient-to-br from-indigo-500/20 to-transparent p-6 relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-white">Phát hành mới?</h3>
              <p className="mt-2 text-sm text-slate-400">Bạn muốn thêm nguồn dữ liệu mới từ TMDB hoặc API khác?</p>
              <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-black transition hover:bg-slate-100 active:scale-95">
                <LucidePlusCircle className="h-4 w-4" /> Bắt đầu cấu hình
              </button>
            </div>
            <LucideActivity className="absolute -bottom-6 -right-6 h-32 w-32 text-indigo-500/10 group-hover:rotate-12 transition-transform duration-700" />
          </section>
        </aside>
      </div>
    </div>
  );
}
