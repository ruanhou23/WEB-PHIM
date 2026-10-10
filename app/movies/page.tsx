import Link from "next/link";
import Image from "next/image";
import type { Movie } from "@/data/movies";
import {
  getCountries,
  getGenres,
  getListBySlug,
  getMoviesByCountry,
  getYears,
  searchMovies,
} from "@/lib/api/ophim";
import { transformOPhimMoviesToMovies } from "@/lib/utils/transform";
import GenreMultiSelect from "./genre-multi-select";
import HeaderNav from "../components/header-nav";

type ListSlug =
  | "phim-moi"
  | "phim-bo"
  | "phim-le"
  | "tv-shows"
  | "hoat-hinh"
  | "phim-vietsub"
  | "phim-thuyet-minh"
  | "phim-long-tieng"
  | "phim-bo-dang-chieu"
  | "phim-bo-hoan-thanh"
  | "phim-sap-chieu"
  | "subteam"
  | "phim-chieu-rap";
type SortField = "modified.time" | "year" | "_id";
type SortType = "desc" | "asc";

const DEFAULT_LIST_SLUG: ListSlug = "phim-moi";
const DEFAULT_LIMIT = 24;

const LIST_TABS: Array<{ slug: ListSlug; label: string }> = [
  { slug: "phim-moi", label: "Phim moi" },
  { slug: "phim-chieu-rap", label: "Phim chieu rap" },
  { slug: "phim-bo", label: "Phim bo" },
  { slug: "phim-le", label: "Phim le" },
  { slug: "tv-shows", label: "TV Shows" },
  { slug: "hoat-hinh", label: "Anime" },
];

const LIST_OPTIONS: Array<{ slug: ListSlug; label: string }> = [
  { slug: "phim-moi", label: "Phim moi" },
  { slug: "phim-bo", label: "Phim bo" },
  { slug: "phim-le", label: "Phim le" },
  { slug: "tv-shows", label: "TV Shows" },
  { slug: "hoat-hinh", label: "Anime" },
  { slug: "phim-vietsub", label: "Phim vietsub" },
  { slug: "phim-thuyet-minh", label: "Phim thuyet minh" },
  { slug: "phim-long-tieng", label: "Phim long tieng" },
  { slug: "phim-bo-dang-chieu", label: "Phim bo dang chieu" },
  { slug: "phim-bo-hoan-thanh", label: "Phim bo hoan thanh" },
  { slug: "phim-sap-chieu", label: "Phim sap chieu" },
  { slug: "subteam", label: "Subteam" },
  { slug: "phim-chieu-rap", label: "Phim chieu rap" },
];

type QueryState = {
  list: ListSlug;
  keyword: string;
  page: number;
  limit: number;
  category: string;
  country: string;
  year: string;
  sortField: SortField;
  sortType: SortType;
};

type MoviesPageProps = {
  searchParams?:
  | {
    list?: string;
    filter?: string;
    keyword?: string;
    page?: string;
    limit?: string;
    category?: string;
    country?: string;
    year?: string;
    sort_field?: string;
    sort_type?: string;
  }
  | Promise<{
    list?: string;
    filter?: string;
    keyword?: string;
    page?: string;
    limit?: string;
    category?: string;
    country?: string;
    year?: string;
    sort_field?: string;
    sort_type?: string;
  }>;
};

function toListSlugFromLegacyFilter(filter: string | undefined): ListSlug {
  if (filter === "single") return "phim-le";
  if (filter === "series") return "phim-bo";
  if (filter === "anime") return "hoat-hinh";
  return DEFAULT_LIST_SLUG;
}

function normalizeListSlug(list: string | undefined, legacyFilter: string | undefined): ListSlug {
  const value = (list || "").trim() as ListSlug;
  if (LIST_OPTIONS.some((option) => option.slug === value)) return value;
  return toListSlugFromLegacyFilter(legacyFilter);
}

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

function buildMoviesHref(state: QueryState, patch: Partial<QueryState> = {}): string {
  const next = { ...state, ...patch };
  const query = new URLSearchParams();
  if (next.list !== DEFAULT_LIST_SLUG) query.set("list", next.list);
  if (next.keyword) query.set("keyword", next.keyword);
  if (next.page > 1) query.set("page", String(next.page));
  if (next.limit !== DEFAULT_LIMIT) query.set("limit", String(next.limit));
  if (next.category) query.set("category", next.category);
  if (next.country) query.set("country", next.country);
  if (next.year) query.set("year", next.year);
  if (next.sortField !== "modified.time") query.set("sort_field", next.sortField);
  if (next.sortType !== "desc") query.set("sort_type", next.sortType);
  const q = query.toString();
  return q ? `/movies?${q}` : "/movies";
}

export default async function MoviesPage({ searchParams }: MoviesPageProps) {
  const resolved = await Promise.resolve(searchParams ?? {});
  const state: QueryState = {
    list: normalizeListSlug(resolved.list, resolved.filter),
    keyword: (resolved.keyword ?? "").trim(),
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
    "canada": "🇨🇦 Canada",
    "mexico": "🇲🇽 Mexico",
    "brazil": "🇧🇷 Brazil",
    "argentina": "🇦🇷 Argentina",
    "anh": "🇬🇧 Anh",
    "phap": "🇫🇷 Phap",
    "duc": "🇩🇪 Duc",
    "tay-ban-nha": "🇪🇸 Tay Ban Nha",
    "y": "🇮🇹 Y",
    "nga": "🇷🇺 Nga",
  };

  try {
    const params = {
      page: state.page,
      limit: state.limit,
      category: primaryCategory || undefined,
      year: state.year || undefined,
      sort_field: state.sortField,
      sort_type: state.sortType,
    };

    let response;
    if (state.keyword) {
      response = await searchMovies(state.keyword, { ...params, country: state.country || undefined });
    } else if (state.country) {
      response = await getMoviesByCountry(state.country, params);
    } else {
      response = await getListBySlug(state.list, params);
    }
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
    <div className="mx-auto max-w-6xl px-3 pb-8 pt-4 sm:px-4 lg:px-6">
      <header className="mb-4 flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-transparent to-sky-500/10 px-4 py-3 ring-1 ring-white/5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/40">
            <span className="text-lg font-extrabold text-black">M</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">mePhim</h1>
            <p className="text-xs text-slate-400">Danh sach phim va bo loc day du</p>
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
            extraParams={(() => {
              const entries: Array<[string, string]> = [];
              if (state.list !== DEFAULT_LIST_SLUG) entries.push(["list", state.list]);
              if (state.keyword) entries.push(["keyword", state.keyword]);
              if (state.country) entries.push(["country", state.country]);
              if (state.year) entries.push(["year", state.year]);
              if (state.sortField !== "modified.time") entries.push(["sort_field", state.sortField]);
              if (state.sortType !== "desc") entries.push(["sort_type", state.sortType]);
              return entries;
            })()}
          />

          <form action="/movies" method="get" className="relative">
            {state.list !== DEFAULT_LIST_SLUG && <input type="hidden" name="list" value={state.list} />}
            <input
              name="keyword"
              defaultValue={state.keyword}
              className="h-9 w-full rounded-full border border-white/10 bg-black/40 px-3 pr-9 text-xs text-slate-100 placeholder:text-slate-500 shadow-inner shadow-black/60 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              placeholder="Tim kiem phim..."
            />
            <button
              type="submit"
              className="absolute inset-y-0 right-0 px-3 text-[11px] text-slate-400 hover:text-emerald-300"
              aria-label="Tim kiem phim"
            >
              ⌕
            </button>
          </form>
        </div>
      </header>

      <header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-50">Danh sách phim</h1>
          <p className="text-xs text-slate-400">
            Bo loc theo danh-sach, the loai, quoc gia, nam, sap xep va phan trang.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {LIST_TABS.map((tab) => {
            const active = state.list === tab.slug;
            return (
              <Link
                key={tab.slug}
                href={tab.slug === "hoat-hinh" ? "/anime" : buildMoviesHref(state, { list: tab.slug, page: 1 })}
                className={`rounded-full px-3 py-1 transition ${active
                    ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/50"
                    : "bg-white/5 text-slate-200 hover:bg-white/10"
                  }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </header>

      <section className="mb-4 rounded-2xl bg-[#070b18] p-3 ring-1 ring-white/5">
        <form action="/movies" method="get" className="grid gap-2 md:grid-cols-6">
          <input type="hidden" name="page" value="1" />

          <label className="text-[11px] text-slate-400">
            Danh sach
            <select
              name="list"
              defaultValue={state.list}
              className="mt-1 h-9 w-full rounded-lg border border-white/10 bg-black/40 px-2 text-xs text-slate-100 outline-none focus:border-emerald-400"
            >
              {LIST_OPTIONS.map((option) => (
                <option key={option.slug} value={option.slug}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="text-[11px] text-slate-400">
            The loai
            <div className="mt-1">
              <GenreMultiSelect
                genres={(() => {
                  const apiGenres = genresResult.status === "fulfilled" && Array.isArray(genresResult.value)
                    ? genresResult.value.map((g) => ({ slug: g.slug, name: g.name }))
                    : [];
                  const merged = [...apiGenres];
                  if (!merged.some(m => m.slug === "phim-18")) {
                    merged.push({ slug: "phim-18", name: "Phim 18+" });
                  }
                  return merged;
                })()}
                selected={categorySlugs}
              />
            </div>
          </div>

          <label className="text-[11px] text-slate-400">
            Quoc gia
            <select
              name="country"
              defaultValue={state.country}
              className="mt-1 h-9 w-full rounded-lg border border-white/10 bg-black/40 px-2 text-xs text-slate-100 outline-none focus:border-emerald-400"
            >
              <option value="">Tat ca</option>
              {countriesResult.status === "fulfilled" &&
                Array.isArray(countriesResult.value) &&
                countriesResult.value.map((country) => (
                  <option key={country.slug} value={country.slug}>
                    {country.name}
                  </option>
                ))}
            </select>
          </label>

          <label className="text-[11px] text-slate-400">
            Nam
            <select
              name="year"
              defaultValue={state.year}
              className="mt-1 h-9 w-full rounded-lg border border-white/10 bg-black/40 px-2 text-xs text-slate-100 outline-none focus:border-emerald-400"
            >
              <option value="">Tat ca</option>
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

          <label className="text-[11px] text-slate-400">
            Sort field
            <select
              name="sort_field"
              defaultValue={state.sortField}
              className="mt-1 h-9 w-full rounded-lg border border-white/10 bg-black/40 px-2 text-xs text-slate-100 outline-none focus:border-emerald-400"
            >
              <option value="modified.time">modified.time</option>
              <option value="year">year</option>
              <option value="_id">_id</option>
            </select>
          </label>

          <label className="text-[11px] text-slate-400">
            Sort type
            <select
              name="sort_type"
              defaultValue={state.sortType}
              className="mt-1 h-9 w-full rounded-lg border border-white/10 bg-black/40 px-2 text-xs text-slate-100 outline-none focus:border-emerald-400"
            >
              <option value="desc">desc</option>
              <option value="asc">asc</option>
            </select>
          </label>

          <label className="text-[11px] text-slate-400 md:col-span-3">
            Tu khoa
            <input
              name="keyword"
              defaultValue={state.keyword}
              placeholder="Ten phim, dien vien..."
              className="mt-1 h-9 w-full rounded-lg border border-white/10 bg-black/40 px-3 text-xs text-slate-100 outline-none focus:border-emerald-400"
            />
          </label>

          <label className="text-[11px] text-slate-400">
            Limit
            <select
              name="limit"
              defaultValue={String(state.limit)}
              className="mt-1 h-9 w-full rounded-lg border border-white/10 bg-black/40 px-2 text-xs text-slate-100 outline-none focus:border-emerald-400"
            >
              {[12, 24, 36, 48].map((limit) => (
                <option key={limit} value={limit}>
                  {limit}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end gap-2 md:col-span-2">
            <button
              type="submit"
              className="h-9 rounded-lg bg-emerald-500 px-4 text-xs font-semibold text-black hover:bg-emerald-400"
            >
              Ap dung bo loc
            </button>
            <Link
              href="/movies"
              className="inline-flex h-9 items-center rounded-lg bg-white/5 px-4 text-xs text-slate-200 hover:bg-white/10"
            >
              Dat lai
            </Link>
          </div>
        </form>
      </section>

      {state.keyword && (
        <p className="mb-3 text-xs text-slate-400">
          Ket qua tim kiem cho:{" "}
          <span className="font-semibold text-emerald-300">{state.keyword}</span>
        </p>
      )}
      {categorySlugs.length > 0 && genresResult.status === "fulfilled" && Array.isArray(genresResult.value) && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">Dang loc theo the loai:</span>
          {categorySlugs.map((slug) => {
            const genre = (genresResult.value as Array<{ slug: string; name: string }>).find((g) => g.slug === slug);
            const remaining = categorySlugs.filter((s) => s !== slug);
            return (
              <Link
                key={slug}
                href={buildMoviesHref(state, { category: remaining.join(","), page: 1 })}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-medium text-emerald-300 ring-1 ring-emerald-500/30 transition hover:bg-red-500/15 hover:text-red-300 hover:ring-red-500/30"
                title={`Bo chon ${genre?.name || slug}`}
              >
                {genre?.name || slug}
                <span className="text-[10px]">×</span>
              </Link>
            );
          })}
          <Link
            href={buildMoviesHref(state, { category: "", page: 1 })}
            className="rounded-full bg-white/5 px-2 py-1 text-[10px] text-slate-400 transition hover:bg-red-500/10 hover:text-red-300"
          >
            Xoa tat ca
          </Link>
        </div>
      )}
      {state.country && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">Dang loc theo quoc gia:</span>
          <Link
            href={buildMoviesHref(state, { country: "", page: 1 })}
            className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/15 px-2.5 py-1 text-[11px] font-medium text-sky-300 ring-1 ring-sky-500/30 transition hover:bg-red-500/15 hover:text-red-300 hover:ring-red-500/30"
            title={`Bo chon ${COUNTRY_NAMES[state.country] || state.country}`}
          >
            {COUNTRY_NAMES[state.country] || state.country}
            <span className="text-[10px]">×</span>
          </Link>
        </div>
      )}
      {apiErrorMessage && (
        <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          He thong du lieu dang tam thoi gian doan: {apiErrorMessage}
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {movies.map((movie) => (
          <article
            key={movie.slug || String(movie.id)}
            className="group relative overflow-hidden rounded-xl bg-[#0b1020] shadow-md shadow-black/40 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/30"
          >
            <Link href={`/watch/${movie.slug}`}>
              <div className="relative aspect-[2/3] w-full overflow-hidden">
                <Image
                  src={movie.poster}
                  alt={movie.title}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-110"
                  unoptimized
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute left-2 top-2 flex flex-col gap-1">
                  <span className="inline-flex rounded bg-black/70 px-2 py-0.5 text-xs font-semibold text-emerald-300 backdrop-blur">
                    {movie.quality}
                  </span>
                </div>
                {movie.isSeries && movie.episode && (
                  <span className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-0.5 text-xs font-medium text-amber-300 backdrop-blur">
                    {movie.episode}
                  </span>
                )}
              </div>
              <div className="space-y-1 px-3 pb-3 pt-2">
                <h3 className="line-clamp-2 text-sm font-semibold text-slate-50 group-hover:text-emerald-400">
                  {movie.title}
                </h3>
                <p className="text-xs text-slate-400">
                  {movie.year} • {movie.isSeries ? "Phim bộ" : "Phim lẻ"}
                </p>
                <p className="line-clamp-1 text-[11px] text-slate-500">
                  {movie.language}
                </p>
              </div>
            </Link>
          </article>
        ))}
      </section>

      {movies.length === 0 && (
        <div className="mt-4 rounded-xl bg-[#0b1020] px-4 py-8 text-center">
          <p className="text-sm text-slate-400">
            Khong tim thay phim phu hop bo loc hoac tu khoa.
          </p>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between rounded-xl bg-[#070b18] px-3 py-2 text-xs text-slate-300 ring-1 ring-white/5">
        <div className="flex items-center gap-2 ml-auto">
          <Link
            href={buildMoviesHref(state, { page: prevPage })}
            className={`rounded px-3 py-1 ${currentPage <= 1
                ? "pointer-events-none bg-white/5 text-slate-500"
                : "bg-white/5 text-slate-200 hover:bg-white/10"
              }`}
          >
            Trang truoc
          </Link>
          <Link
            href={buildMoviesHref(state, { page: nextPage })}
            className={`rounded px-3 py-1 ${currentPage >= totalPages
                ? "pointer-events-none bg-white/5 text-slate-500"
                : "bg-white/5 text-slate-200 hover:bg-white/10"
              }`}
          >
            Trang sau
          </Link>
        </div>
      </div>
    </div>
  );
}

