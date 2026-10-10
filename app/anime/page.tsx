import Link from "next/link";
import Image from "next/image";
import type { Movie } from "@/data/movies";
import {
  getCountries,
  getGenres,
  getListBySlug,
  getYears,
} from "@/lib/api/ophim";
import { transformOPhimMoviesToMovies } from "@/lib/utils/transform";
import GenreMultiSelect from "../movies/genre-multi-select";
import HeaderNav from "../components/header-nav";

type SortField = "modified.time" | "year" | "_id";
type SortType = "desc" | "asc";

const DEFAULT_LIMIT = 24;

type QueryState = {
  page: number;
  limit: number;
  category: string;
  country: string;
  year: string;
  sortField: SortField;
  sortType: SortType;
};

type AnimePageProps = {
  searchParams?:
  | {
    category?: string;
    country?: string;
    year?: string;
    sort_field?: string;
    sort_type?: string;
    page?: string;
    limit?: string;
  }
  | Promise<{
    category?: string;
    country?: string;
    year?: string;
    sort_field?: string;
    sort_type?: string;
    page?: string;
    limit?: string;
  }>;
};

function normalizePage(value: string | undefined): number {
  const parsed = Number.parseInt(value || "1", 10);
  if (Number.isNaN(parsed) || parsed < 1) return 1;
  return parsed;
}

function normalizeLimit(value: string | undefined): number {
  const parsed = Number.parseInt(value || String(DEFAULT_LIMIT), 10);
  if (Number.isNaN(parsed) || parsed < 1) return DEFAULT_LIMIT;
  return Math.min(parsed, 100);
}

function normalizeSortField(value: string | undefined): SortField {
  if (value === "year" || value === "_id" || value === "modified.time") return value;
  return "modified.time";
}

function normalizeSortType(value: string | undefined): SortType {
  if (value === "asc" || value === "desc") return value;
  return "desc";
}

function getCdnDomainFromData(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const maybe = (data as { APP_DOMAIN_CDN_IMAGE?: unknown }).APP_DOMAIN_CDN_IMAGE;
  return typeof maybe === "string" ? maybe : undefined;
}

function parseCategorySlugs(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildAnimeHref(state: QueryState, patch: Partial<QueryState> = {}): string {
  const next = { ...state, ...patch };
  const query = new URLSearchParams();
  if (next.page > 1) query.set("page", String(next.page));
  if (next.limit !== DEFAULT_LIMIT) query.set("limit", String(next.limit));
  if (next.category) query.set("category", next.category);
  if (next.country) query.set("country", next.country);
  if (next.year) query.set("year", next.year);
  if (next.sortField !== "modified.time") query.set("sort_field", next.sortField);
  if (next.sortType !== "desc") query.set("sort_type", next.sortType);
  const q = query.toString();
  return q ? `/anime?${q}` : "/anime";
}

export default async function AnimePage({ searchParams }: AnimePageProps) {
  const resolved = await Promise.resolve(searchParams ?? {});
  const state: QueryState = {
    page: normalizePage(resolved.page),
    limit: normalizeLimit(resolved.limit),
    category: (resolved.category ?? "").trim(),
    country: (resolved.country ?? "").trim(),
    year: (resolved.year ?? "").trim(),
    sortField: normalizeSortField(resolved.sort_field),
    sortType: normalizeSortType(resolved.sort_type),
  };

  const [genresResult, countriesResult, yearsResult] = await Promise.allSettled([
    getGenres(),
    getCountries(),
    getYears(),
  ]);

  let movies: Movie[] = [];
  let totalItems = 0;
  let totalItemsPerPage = state.limit;
  let currentPage = state.page;
  let apiErrorMessage = "";

  const categorySlugs = parseCategorySlugs(state.category);
  const primaryCategory = categorySlugs[0] || "";

  const COUNTRY_NAMES: Record<string, string> = {
    "han-quoc": "🇰🇷 Han Quoc",
    "nhat-ban": "🇯🇵 Nhat Ban",
    "trung-quoc": "🇨🇳 Trung Quoc",
    "thai-lan": "🇹🇭 Thai Lan",
    "an-do": "🇮🇳 An Do",
    "viet-nam": "🇻🇳 Viet Nam",
    "hong-kong": "🇭🇰 Hong Kong",
    "dai-loan": "🇹🇼 Dai Loan",
    "philippines": "🇵🇭 Philippines",
    "au-my": "🇺🇸 Au My",
  };

  try {
    const params = {
      page: state.page,
      limit: state.limit,
      category: primaryCategory || undefined,
      country: state.country || undefined,
      year: state.year || undefined,
      sort_field: state.sortField,
      sort_type: state.sortType,
    };

    // Luôn luôn gọi list hoat-hinh
    const response = await getListBySlug("hoat-hinh", params);

    movies = transformOPhimMoviesToMovies(
      response.data.items || [],
      getCdnDomainFromData(response.data),
    );
    const pagination = response.data.params?.pagination;
    totalItems = pagination?.totalItems ?? movies.length;
    totalItemsPerPage = pagination?.totalItemsPerPage ?? state.limit;
    currentPage = pagination?.currentPage ?? state.page;
  } catch (error) {
    apiErrorMessage =
      error instanceof Error ? error.message : "Khong the tai du lieu he thong";
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / Math.max(1, totalItemsPerPage)));
  const prevPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(totalPages, currentPage + 1);

  return (
    <div className="mx-auto max-w-7xl px-3 pb-12 pt-4 sm:px-4 lg:px-6">
      <header className="relative z-50 mb-8 flex flex-col gap-3 rounded-3xl bg-gradient-to-r from-pink-500/20 via-purple-500/10 to-transparent px-6 py-4 ring-1 ring-white/10 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between shadow-2xl shadow-pink-500/10">
        <Link href="/" className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg shadow-pink-500/40 transform transition hover:scale-105">
            <span className="text-xl font-black text-white">A</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-purple-300">Thế Giới Anime</h1>
            <p className="text-xs font-medium text-pink-200/60 uppercase tracking-widest">Tuyển tập hoạt hình đỉnh cao</p>
          </div>
        </Link>

        <div className="flex flex-1 flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
          <HeaderNav
            genres={
              genresResult.status === "fulfilled" && Array.isArray(genresResult.value)
                ? genresResult.value.map((g) => ({ slug: g.slug, name: g.name }))
                : []
            }
            countries={
              countriesResult.status === "fulfilled" && Array.isArray(countriesResult.value)
                ? countriesResult.value.slice(0, 15).map((c) => ({ slug: c.slug, name: c.name }))
                : []
            }
            selectedGenreSlugs={categorySlugs}
            mode="movies"
          />
        </div>
      </header>

      {/* Hero Banner cho Anime */}
      <div className="relative w-full rounded-3xl overflow-hidden mb-10 ring-1 ring-white/10 shadow-2xl group">
        <div className="absolute inset-0 bg-gradient-to-r from-[#070b18] via-[#070b18]/80 to-transparent z-10" />
        <div className="absolute inset-0 bg-[url('https://img.ophim.live/uploads/movies/demon-slayer-kimetsu-no-yaiba-hashira-training-arc-poster.jpg')] bg-cover bg-center opacity-40 group-hover:opacity-50 transition duration-1000 group-hover:scale-105" />
        
        <div className="relative z-20 p-8 sm:p-12 max-w-2xl flex flex-col justify-center min-h-[300px]">
          <span className="inline-block px-3 py-1 mb-4 text-[10px] font-black tracking-widest text-pink-300 uppercase bg-pink-500/20 rounded-full border border-pink-500/30 w-fit">Độc quyền</span>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">Khám Phá Vũ Trụ <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">Anime Bất Tận</span></h2>
          <p className="text-slate-300 text-sm sm:text-base mb-8 max-w-lg leading-relaxed">
            Từ những tác phẩm kinh điển đến các siêu phẩm mùa mới nhất. Hình ảnh sắc nét, vietsub chuẩn xác, cập nhật liên tục mỗi ngày.
          </p>
        </div>
      </div>

      <section className="mb-8 rounded-3xl bg-[#070b18]/80 p-5 ring-1 ring-white/10 shadow-xl backdrop-blur-sm">
        <form action="/anime" method="get" className="grid gap-4 md:grid-cols-5">
          <input type="hidden" name="page" value="1" />

          <div className="text-[11px] font-medium text-slate-400">
            Thể loại
            <div className="mt-1.5">
              <GenreMultiSelect
                genres={(() => {
                  const apiGenres = genresResult.status === "fulfilled" && Array.isArray(genresResult.value)
                    ? genresResult.value.map((g) => ({ slug: g.slug, name: g.name }))
                    : [];
                  return apiGenres;
                })()}
                selected={categorySlugs}
              />
            </div>
          </div>

          <label className="text-[11px] font-medium text-slate-400">
            Quốc gia
            <select
              name="country"
              defaultValue={state.country}
              className="mt-1.5 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-xs text-slate-100 outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/50 transition-all cursor-pointer"
            >
              <option value="">Tất cả quốc gia</option>
              {countriesResult.status === "fulfilled" &&
                Array.isArray(countriesResult.value) &&
                countriesResult.value.map((country) => (
                  <option key={country.slug} value={country.slug}>
                    {country.name}
                  </option>
                ))}
            </select>
          </label>

          <label className="text-[11px] font-medium text-slate-400">
            Năm phát hành
            <select
              name="year"
              defaultValue={state.year}
              className="mt-1.5 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-xs text-slate-100 outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/50 transition-all cursor-pointer"
            >
              <option value="">Tất cả năm</option>
              {yearsResult.status === "fulfilled" &&
                Array.isArray(yearsResult.value) &&
                yearsResult.value
                  .slice()
                  .sort((a, b) => Number(b) - Number(a))
                  .map((year) => (
                    <option key={String(year)} value={String(year)}>
                      {String(year)}
                    </option>
                  ))}
            </select>
          </label>

          <label className="text-[11px] font-medium text-slate-400">
            Sắp xếp theo
            <select
              name="sort_field"
              defaultValue={state.sortField}
              className="mt-1.5 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-xs text-slate-100 outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/50 transition-all cursor-pointer"
            >
              <option value="modified.time">Ngày cập nhật</option>
              <option value="year">Năm sản xuất</option>
            </select>
          </label>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="h-10 flex-1 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 px-4 text-xs font-bold text-white hover:opacity-90 transition-opacity shadow-lg shadow-pink-500/20"
            >
              Lọc Anime
            </button>
            <Link
              href="/anime"
              className="flex h-10 items-center justify-center rounded-xl bg-white/5 px-4 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors border border-white/5"
            >
              Hủy
            </Link>
          </div>
        </form>
      </section>

      {categorySlugs.length > 0 && genresResult.status === "fulfilled" && Array.isArray(genresResult.value) && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Đang lọc thể loại:</span>
          {categorySlugs.map((slug) => {
            const genre = (genresResult.value as Array<{ slug: string; name: string }>).find((g) => g.slug === slug);
            const remaining = categorySlugs.filter((s) => s !== slug);
            return (
              <Link
                key={slug}
                href={buildAnimeHref(state, { category: remaining.join(","), page: 1 })}
                className="inline-flex items-center gap-1.5 rounded-full bg-pink-500/15 px-3 py-1 text-[11px] font-semibold text-pink-300 ring-1 ring-pink-500/30 transition hover:bg-rose-500/20 hover:text-rose-200 hover:ring-rose-500/40"
              >
                {genre?.name || slug}
                <span className="text-[10px] bg-pink-500/20 rounded-full w-4 h-4 flex items-center justify-center ml-1">×</span>
              </Link>
            );
          })}
        </div>
      )}
      
      {state.country && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Đang lọc quốc gia:</span>
          <Link
            href={buildAnimeHref(state, { country: "", page: 1 })}
            className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/15 px-3 py-1 text-[11px] font-semibold text-purple-300 ring-1 ring-purple-500/30 transition hover:bg-rose-500/20 hover:text-rose-200 hover:ring-rose-500/40"
          >
            {COUNTRY_NAMES[state.country] || state.country}
            <span className="text-[10px] bg-purple-500/20 rounded-full w-4 h-4 flex items-center justify-center ml-1">×</span>
          </Link>
        </div>
      )}

      {apiErrorMessage && (
        <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200 backdrop-blur-sm">
          ⚠️ Hệ thống dữ liệu đang tạm thời gián đoạn: {apiErrorMessage}
        </div>
      )}

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {movies.map((movie) => (
          <article
            key={movie.slug || String(movie.id)}
            className="group relative overflow-hidden rounded-2xl bg-[#0b1020] shadow-lg shadow-black/40 transition duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-pink-500/20 ring-1 ring-white/5 hover:ring-pink-500/30"
          >
            <Link href={`/watch/${movie.slug}`} className="block h-full flex flex-col">
              <div className="relative aspect-[2/3] w-full overflow-hidden">
                <Image
                  src={movie.poster}
                  alt={movie.title}
                  fill
                  className="object-cover transition duration-700 group-hover:scale-110 group-hover:opacity-90"
                  unoptimized
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070b18] via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-500" />
                
                <div className="absolute left-2 top-2 flex flex-col gap-1.5">
                  <span className="inline-flex rounded-lg bg-pink-500/80 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white shadow-lg backdrop-blur-md">
                    {movie.quality}
                  </span>
                </div>
                
                {movie.episode && (
                  <span className="absolute bottom-3 left-3 rounded-lg bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md ring-1 ring-white/20 shadow-lg">
                    {movie.episode}
                  </span>
                )}
              </div>
              <div className="flex flex-col justify-between flex-1 p-3 bg-gradient-to-b from-[#070b18] to-black">
                <h3 className="line-clamp-2 text-sm font-bold text-slate-100 group-hover:text-pink-400 transition-colors leading-snug">
                  {movie.title}
                </h3>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-[11px] font-medium text-slate-500">
                    {movie.year}
                  </p>
                  <p className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider">
                    {movie.language}
                  </p>
                </div>
              </div>
            </Link>
          </article>
        ))}
      </section>

      {movies.length === 0 && !apiErrorMessage && (
        <div className="mt-8 rounded-3xl bg-[#0b1020]/50 px-4 py-16 text-center ring-1 ring-white/5 backdrop-blur-sm">
          <div className="text-4xl mb-4 opacity-50">🌸</div>
          <p className="text-base text-slate-300 font-medium">
            Không tìm thấy bộ Anime nào phù hợp với bộ lọc hiện tại.
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Hãy thử thay đổi năm phát hành hoặc thể loại nhé!
          </p>
        </div>
      )}

      <div className="mt-10 flex items-center justify-between rounded-2xl bg-[#070b18]/80 px-4 py-3 text-sm font-medium text-slate-300 ring-1 ring-white/10 backdrop-blur-md shadow-xl">
        <div className="hidden sm:block text-slate-400">
          Trang <span className="text-white font-bold">{currentPage}</span> / {totalPages}
        </div>
        <div className="flex items-center gap-2 ml-auto w-full sm:w-auto justify-between sm:justify-end">
          <Link
            href={buildAnimeHref(state, { page: prevPage })}
            className={`flex items-center justify-center h-9 rounded-xl px-4 transition-all ${currentPage <= 1
                ? "pointer-events-none bg-white/5 text-slate-600 border border-transparent"
                : "bg-white/5 text-slate-200 hover:bg-pink-500 hover:text-white hover:shadow-lg hover:shadow-pink-500/20 border border-white/10 hover:border-pink-500/50"
              }`}
          >
            Trang trước
          </Link>
          <Link
            href={buildAnimeHref(state, { page: nextPage })}
            className={`flex items-center justify-center h-9 rounded-xl px-4 transition-all ${currentPage >= totalPages
                ? "pointer-events-none bg-white/5 text-slate-600 border border-transparent"
                : "bg-white/5 text-slate-200 hover:bg-pink-500 hover:text-white hover:shadow-lg hover:shadow-pink-500/20 border border-white/10 hover:border-pink-500/50"
              }`}
          >
            Trang tiếp
          </Link>
        </div>
      </div>
    </div>
  );
}
