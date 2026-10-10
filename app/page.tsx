import Image from "next/image";
import Link from "next/link";
import {
  getCountries,
  getGenres,
  getListBySlug,
  getMoviesByGenre,
} from "@/lib/api/ophim";
import { transformOPhimMoviesToMovies } from "@/lib/utils/transform";
import type { Movie } from "@/data/movies";
import HeaderNav from "./components/header-nav";


function MovieCard({ movie }: { movie: Movie }) {
  return (
    <Link href={`/watch/${movie.slug}`} className="block h-full">
      <article className="group relative flex h-full flex-col overflow-hidden rounded-xl bg-[#0b1020] shadow-md shadow-black/40 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/30 cursor-pointer">
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

        <div className="flex flex-1 flex-col space-y-1 px-3 pb-3 pt-2">
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
      </article>
    </Link>
  );
}



function getCdnDomainFromListData(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const maybe = (data as { APP_DOMAIN_CDN_IMAGE?: unknown }).APP_DOMAIN_CDN_IMAGE;
  return typeof maybe === "string" ? maybe : undefined;
}

type HomePageProps = {
  searchParams?:
  | {
    genre?: string;
    p?: string;
    hot_page?: string;
    latest_page?: string;
    single_page?: string;
    series_page?: string;
    excel_page?: string;
  }
  | Promise<{
    genre?: string;
    p?: string;
    hot_page?: string;
    latest_page?: string;
    single_page?: string;
    series_page?: string;
    excel_page?: string;
  }>;
};

type HomeQueryState = {
  genre: string;
  browsePage: number;
  hotPage: number;
  latestPage: number;
  singlePage: number;
  seriesPage: number;
};

type SectionPageKey = "hotPage" | "latestPage" | "singlePage" | "seriesPage";
type TopImdbMovie = {
  name: string;
  slug: string;
  score: number;
  poster?: string;
  year?: number;
  isSeries?: boolean;
};

const SECTION_PAGE_QUERY_KEY: Record<SectionPageKey, string> = {
  hotPage: "hot_page",
  latestPage: "latest_page",
  singlePage: "single_page",
  seriesPage: "series_page",
};

function parsePageValue(value: string | undefined, fallback: number = 1): number {
  const parsed = Number.parseInt(value ?? String(fallback), 10);
  return Number.isNaN(parsed) || parsed < 1 ? fallback : parsed;
}

function toHomeQueryEntries(state: HomeQueryState): Array<[string, string]> {
  const entries: Array<[string, string]> = [];
  if (state.genre !== "all") entries.push(["genre", state.genre]);
  if (state.browsePage > 1) entries.push(["p", String(state.browsePage)]);
  if (state.hotPage > 1) entries.push([SECTION_PAGE_QUERY_KEY.hotPage, String(state.hotPage)]);
  if (state.latestPage > 1) entries.push([SECTION_PAGE_QUERY_KEY.latestPage, String(state.latestPage)]);
  if (state.singlePage > 1) entries.push([SECTION_PAGE_QUERY_KEY.singlePage, String(state.singlePage)]);
  if (state.seriesPage > 1) entries.push([SECTION_PAGE_QUERY_KEY.seriesPage, String(state.seriesPage)]);
  return entries;
}

function buildHomeHrefFromState(state: HomeQueryState): string {
  const params = new URLSearchParams();
  for (const [key, value] of toHomeQueryEntries(state)) {
    params.set(key, value);
  }
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

function buildHomeBrowseHref(state: HomeQueryState, genre: string, page: number): string {
  return buildHomeHrefFromState({
    ...state,
    genre,
    browsePage: Math.max(1, page),
  });
}

function toggleGenreInList(currentGenre: string, slug: string): string {
  if (slug === "all") return "all";
  const current = currentGenre === "all" ? [] : currentGenre.split(",").map((s) => s.trim()).filter(Boolean);
  const isSelected = current.includes(slug);
  const next = isSelected ? current.filter((s) => s !== slug) : [...current, slug];
  return next.length > 0 ? next.join(",") : "all";
}

function SectionPagination({
  state,
  sectionKey,
  currentPage,
  totalPages,
  totalItems,
}: {
  state: HomeQueryState;
  sectionKey: SectionPageKey;
  currentPage: number;
  totalPages: number;
  totalItems: number;
}) {
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);
  const pageQueryKey = SECTION_PAGE_QUERY_KEY[sectionKey];
  const preservedInputs = toHomeQueryEntries(state).filter(([key]) => key !== pageQueryKey);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#070b18] px-3 py-2 text-xs text-slate-300 ring-1 ring-white/5">
      <div className="flex flex-wrap items-center gap-2 ml-auto">
        <Link
          href={buildHomeHrefFromState({
            ...state,
            [sectionKey]: Math.max(1, safeCurrentPage - 1),
          })}
          className={`rounded px-3 py-1 ${safeCurrentPage <= 1
            ? "pointer-events-none bg-white/5 text-slate-500"
            : "bg-white/5 text-slate-200 hover:bg-white/10"
            }`}
        >
          Trang truoc
        </Link>

        <form action="/" method="get" className="flex items-center gap-2">
          {preservedInputs.map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
          <input
            type="number"
            name={pageQueryKey}
            min={1}
            max={safeTotalPages}
            defaultValue={safeCurrentPage}
            className="h-7 w-20 rounded border border-white/10 bg-black/30 px-2 text-center text-xs text-slate-100 focus:border-emerald-400 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded bg-emerald-500/20 px-2 py-1 text-[11px] text-emerald-300 hover:bg-emerald-500/30"
          >
            Den trang
          </button>
        </form>

        <Link
          href={buildHomeHrefFromState({
            ...state,
            [sectionKey]: Math.min(safeTotalPages, safeCurrentPage + 1),
          })}
          className={`rounded px-3 py-1 ${safeCurrentPage >= safeTotalPages
            ? "pointer-events-none bg-white/5 text-slate-500"
            : "bg-white/5 text-slate-200 hover:bg-white/10"
            }`}
        >
          Trang sau
        </Link>
      </div>
    </div>
  );
}

export default async function Home({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams ?? {});
  const rawGenre = (resolvedSearchParams.genre ?? "all").trim() || "all";
  const selectedGenreSlugs = rawGenre === "all"
    ? []
    : rawGenre.split(",").map((s) => s.trim()).filter(Boolean);
  const selectedGenre = selectedGenreSlugs.length > 0 ? rawGenre : "all";
  const requestedPage = parsePageValue(resolvedSearchParams.p, 1);
  const requestedHotPage = parsePageValue(resolvedSearchParams.hot_page, 1);
  const requestedLatestPage = parsePageValue(resolvedSearchParams.latest_page, 1);
  const requestedSinglePage = parsePageValue(resolvedSearchParams.single_page, 1);
  const requestedSeriesPage = parsePageValue(resolvedSearchParams.series_page, 1);

  const baseState: HomeQueryState = {
    genre: selectedGenre,
    browsePage: requestedPage,
    hotPage: requestedHotPage,
    latestPage: requestedLatestPage,
    singlePage: requestedSinglePage,
    seriesPage: requestedSeriesPage,
  };

  const sectionPerPage = 12;

  const [
    hotResult,
    latestResult,
    singleResult,
    seriesResult,
    genresResult,
    countriesResult,
  ] =
    await Promise.allSettled([
      getListBySlug("phim-hot", { page: requestedHotPage, limit: sectionPerPage }),
      getListBySlug("phim-moi", { page: requestedLatestPage, limit: sectionPerPage }),
      getListBySlug("phim-le", { page: requestedSinglePage, limit: sectionPerPage }),
      getListBySlug("phim-bo", { page: requestedSeriesPage, limit: sectionPerPage }),
      getGenres(),
      getCountries(),
    ]);

  const featuredMovies: Movie[] =
    hotResult.status === "fulfilled"
      ? transformOPhimMoviesToMovies(
        hotResult.value.data.items || [],
        getCdnDomainFromListData(hotResult.value.data),
      )
      : [];

  const latestMovies: Movie[] =
    latestResult.status === "fulfilled"
      ? transformOPhimMoviesToMovies(
        latestResult.value.data.items || [],
        getCdnDomainFromListData(latestResult.value.data),
      )
      : [];

  const singleMovies: Movie[] =
    singleResult.status === "fulfilled"
      ? transformOPhimMoviesToMovies(
        singleResult.value.data.items || [],
        getCdnDomainFromListData(singleResult.value.data),
      )
      : [];

  const seriesMovies: Movie[] =
    seriesResult.status === "fulfilled"
      ? transformOPhimMoviesToMovies(
        seriesResult.value.data.items || [],
        getCdnDomainFromListData(seriesResult.value.data),
      )
      : [];

  const featuredMovieMap = new Map(featuredMovies.map((movie) => [movie.slug, movie]));
  const topImdbFromApi: TopImdbMovie[] =
    hotResult.status === "fulfilled"
      ? (hotResult.value.data.items || [])
        .map((movie) => ({
          name: movie.name || movie.origin_name || "Unknown",
          slug: movie.slug,
          score:
            typeof movie.imdb?.vote_average === "number"
              ? movie.imdb.vote_average
              : typeof movie.tmdb?.vote_average === "number"
                ? movie.tmdb.vote_average
                : 0,
          poster: featuredMovieMap.get(movie.slug)?.poster,
          year: featuredMovieMap.get(movie.slug)?.year,
          isSeries: featuredMovieMap.get(movie.slug)?.isSeries,
        }))
        .filter((movie) => movie.slug && movie.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
      : [];

  const topImdbMovies: TopImdbMovie[] =
    topImdbFromApi.length > 0
      ? topImdbFromApi
      : [
        { name: "The Shawshank Redemption", slug: "the-shawshank-redemption", score: 9.3, year: 1994 },
        { name: "The Godfather", slug: "the-godfather", score: 9.2, year: 1972 },
        { name: "The Dark Knight", slug: "the-dark-knight", score: 9.0, year: 2008 },
      ];

  const PRIORITY_GENRES = [
    { slug: "hanh-dong", name: "Hanh Dong" },
    { slug: "tinh-cam", name: "Tinh Cam" },
    { slug: "hai-huoc", name: "Hai Huoc" },
    { slug: "kinh-di", name: "Kinh Di" },
    { slug: "khoa-hoc", name: "Khoa Hoc" },
    { slug: "tam-ly", name: "Tam Ly" },
    { slug: "bi-an", name: "Trinh Tham" },
    { slug: "co-trang", name: "Co Trang" },
    { slug: "vien-tuong", name: "Vien Tuong" },
    { slug: "phieu-luu", name: "Phieu Luu" },
    { slug: "hoat-hinh", name: "Anime" },
  ];
  const apiGenres =
    genresResult.status === "fulfilled" && Array.isArray(genresResult.value)
      ? genresResult.value.map((genre) => ({ slug: genre.slug, name: genre.name }))
      : [];
  const mergedGenres = [...PRIORITY_GENRES];
  for (const g of apiGenres) {
    if (!mergedGenres.some((m) => m.slug === g.slug)) {
      mergedGenres.push(g);
    }
  }
  const genreOptions = [{ slug: "all", name: "Tat ca" }, ...mergedGenres];
  const navGenres = mergedGenres;
  const navCountries =
    countriesResult.status === "fulfilled" && Array.isArray(countriesResult.value)
      ? countriesResult.value.slice(0, 10)
      : [];

  const isGenreValid =
    selectedGenre === "all" ||
    selectedGenreSlugs.every((slug) => genreOptions.some((g) => g.slug === slug));
  const safeGenre = isGenreValid ? selectedGenre : "all";
  const safeState: HomeQueryState = {
    ...baseState,
    genre: safeGenre,
  };

  const homeBrowsePerPage = 10;
  const primaryBrowseGenre = safeGenre === "all" ? "all" : safeGenre.split(",")[0]?.trim() || "all";
  const browseResult = await Promise.allSettled([
    primaryBrowseGenre === "all"
      ? getListBySlug("phim-moi", { page: requestedPage, limit: homeBrowsePerPage })
      : primaryBrowseGenre === "hoat-hinh"
        ? getListBySlug("hoat-hinh", { page: requestedPage, limit: homeBrowsePerPage })
        : getMoviesByGenre(primaryBrowseGenre, { page: requestedPage, limit: homeBrowsePerPage }),
  ]);

  const browseData =
    browseResult[0].status === "fulfilled" ? browseResult[0].value.data : null;
  const browseMovies = browseData
    ? transformOPhimMoviesToMovies(
      browseData.items || [],
      getCdnDomainFromListData(browseData),
    )
    : [];
  const browsePagination = browseData?.params?.pagination;
  const currentBrowsePage = browsePagination?.currentPage ?? requestedPage;
  const totalBrowseItems = browsePagination?.totalItems ?? browseMovies.length;
  const browsePerPage = browsePagination?.totalItemsPerPage ?? homeBrowsePerPage;
  const totalBrowsePages = Math.max(
    1,
    Math.ceil(totalBrowseItems / Math.max(1, browsePerPage)),
  );
  const trendingHeroMovies = (latestMovies.length > 0 ? latestMovies : featuredMovies).slice(0, 5);
  const heroMovie = trendingHeroMovies[0];



  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-3 pb-8 pt-4 sm:px-4 lg:px-6">
      {/* Header */}
      <header className="relative z-50 mb-4 flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-transparent to-sky-500/10 px-4 py-3 ring-1 ring-white/5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/40">
            <span className="text-lg font-extrabold text-black">M</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
              mePhim
            </h1>
            <p className="text-xs text-slate-400">
              Xem phim online miễn phí, tốc độ cao
            </p>
          </div>
        </Link>

        <div className="flex flex-1 flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
          <HeaderNav
            genres={navGenres}
            countries={navCountries.map((c) => ({ slug: c.slug || c.name, name: c.name }))}
            selectedGenreSlugs={selectedGenreSlugs}
            mode="home"
            extraParams={toHomeQueryEntries(safeState)}
          />

          <form action="/movies" method="get" className="relative">
            <input
              name="keyword"
              className="h-9 w-full rounded-full border border-white/10 bg-black/40 px-3 pr-9 text-xs text-slate-100 placeholder:text-slate-500 shadow-inner shadow-black/60 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              placeholder="Tìm kiếm phim, diễn viên..."
            />
            <button
              type="submit"
              className="absolute inset-y-0 right-0 px-3 text-[11px] text-slate-500 hover:text-emerald-300"
              aria-label="Tìm kiếm phim"
            >
              ⌕
            </button>
          </form>
        </div>
      </header>

      {/* Hero + Sidebar */}
      <section className="relative z-10 mb-6 grid gap-4 md:grid-cols-[minmax(0,2.5fr)_minmax(260px,1fr)]">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-black px-4 py-5 ring-1 ring-white/5">
          {heroMovie ? (
            <>
              <Image
                src={heroMovie.poster}
                alt={heroMovie.title}
                fill
                className="object-cover opacity-35"
                unoptimized
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/40" />
              <div className="relative z-10 grid gap-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/90">
                    Phim moi thinh hanh
                  </p>
                  <h2 className="text-2xl font-bold leading-tight text-white sm:text-3xl">
                    {heroMovie.title}
                  </h2>
                  <p className="text-sm text-slate-200">
                    {heroMovie.year} • {heroMovie.isSeries ? "Phim bo" : "Phim le"} •{" "}
                    {heroMovie.quality}
                  </p>
                  <p className="line-clamp-2 max-w-2xl text-sm text-slate-300">
                    Cap nhat danh sach phim hot moi nhat, chon phim yeu thich va xem ngay tren mePhim.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Link
                      href={`/watch/${heroMovie.slug}`}
                      className="rounded-full bg-emerald-500 px-4 py-2 font-semibold text-black transition hover:bg-emerald-400"
                    >
                      Xem ngay
                    </Link>
                    <Link
                      href="/movies?list=phim-moi"
                      className="rounded-full bg-white/10 px-4 py-2 text-slate-100 ring-1 ring-white/20 transition hover:bg-white/20"
                    >
                      Xem phim moi
                    </Link>
                  </div>
                </div>

                <div className="rounded-xl bg-black/35 p-3 ring-1 ring-white/10 backdrop-blur">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-300">
                    Top moi cap nhat
                  </p>
                  <ol className="space-y-2 text-xs">
                    {trendingHeroMovies.slice(0, 4).map((movie, index) => (
                      <li key={`hero-${movie.slug}`}>
                        <Link
                          href={`/watch/${movie.slug}`}
                          className="flex items-center justify-between rounded-lg bg-white/10 px-2.5 py-2 transition hover:bg-emerald-500/20"
                        >
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-semibold text-emerald-300">
                              {index + 1}
                            </span>
                            <span className="line-clamp-1 text-slate-100">{movie.title}</span>
                          </div>
                          <span className="text-[10px] text-slate-300">{movie.year}</span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </>
          ) : (
            <div className="relative z-10 flex h-full items-center justify-center py-12 text-sm text-slate-300">
              Dang cap nhat phim moi thinh hanh...
            </div>
          )}
        </div>

        {/* Sidebar: Top IMDb */}
        <aside className="flex h-full flex-col rounded-2xl bg-[#070b18] p-4 ring-1 ring-white/5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-100">
              Bang xep hang IMDb
            </h3>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
              {topImdbFromApi.length > 0 ? "Live" : "Demo"}
            </span>
          </div>

          <ol className="space-y-2.5">
            {topImdbMovies.map((movie, index) => (
              <li key={`${movie.slug}-${index}`}>
                <Link
                  href={`/watch/${movie.slug}`}
                  className="group flex items-center gap-2.5 rounded-xl bg-white/5 p-2 transition hover:bg-emerald-500/15"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[11px] font-semibold text-emerald-300">
                    {index + 1}
                  </span>

                  {movie.poster ? (
                    <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded-md ring-1 ring-white/10">
                      <Image
                        src={movie.poster}
                        alt={movie.name}
                        fill
                        className="object-cover transition group-hover:scale-105"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="flex h-12 w-9 shrink-0 items-center justify-center rounded-md bg-white/10 text-[10px] text-slate-400 ring-1 ring-white/10">
                      IMDb
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-xs font-medium text-slate-100">{movie.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {movie.year ? `${movie.year} • ` : ""}
                      {movie.isSeries ? "Phim bo" : "Phim le"}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-md bg-amber-400/20 px-2 py-1 text-[11px] font-semibold text-amber-300">
                    {movie.score.toFixed(1)}
                  </span>
                </Link>
              </li>
            ))}
          </ol>

          <Link
            href="/movies"
            className="mt-3 rounded-lg bg-white/5 px-3 py-2 text-center text-xs text-slate-200 transition hover:bg-white/10 hover:text-emerald-300"
          >
            Xem bang xep hang
          </Link>
        </aside>
      </section>



      {/* Featured movies */}
      <section className="mb-6 space-y-3 rounded-2xl bg-[#070b18]/60 p-3 ring-1 ring-white/5 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
            Phim đề cử
          </h2>
          <Link
            href="/movies"
            className="text-xs text-emerald-300 hover:text-emerald-200"
          >
            Xem tất cả
          </Link>
        </div>
        {featuredMovies.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {featuredMovies.map((movie) => (
                <MovieCard key={movie.slug} movie={movie} />
              ))}
            </div>
            <SectionPagination
              state={safeState}
              sectionKey="hotPage"
              currentPage={hotResult.status === "fulfilled" ? hotResult.value.data.params?.pagination?.currentPage ?? requestedHotPage : requestedHotPage}
              totalPages={
                hotResult.status === "fulfilled"
                  ? Math.max(
                    1,
                    Math.ceil(
                      (hotResult.value.data.params?.pagination?.totalItems ?? featuredMovies.length) /
                      Math.max(1, hotResult.value.data.params?.pagination?.totalItemsPerPage ?? sectionPerPage),
                    ),
                  )
                  : 1
              }
              totalItems={hotResult.status === "fulfilled" ? hotResult.value.data.params?.pagination?.totalItems ?? featuredMovies.length : featuredMovies.length}
            />
          </>
        ) : (
          <div className="rounded-xl bg-[#0b1020] px-4 py-8 text-center">
            <p className="text-sm text-slate-400">
              Đang tải dữ liệu phim...
            </p>
          </div>
        )}
      </section>

      {/* Latest movies */}
      <section className="mb-6 space-y-3 rounded-2xl bg-[#070b18]/60 p-3 ring-1 ring-white/5 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
            Phim mới cập nhật
          </h2>
          <Link
            href="/movies"
            className="text-xs text-emerald-300 hover:text-emerald-200"
          >
            Xem tất cả
          </Link>
        </div>
        {latestMovies.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {latestMovies.map((movie) => (
                <MovieCard key={movie.slug} movie={movie} />
              ))}
            </div>
            <SectionPagination
              state={safeState}
              sectionKey="latestPage"
              currentPage={latestResult.status === "fulfilled" ? latestResult.value.data.params?.pagination?.currentPage ?? requestedLatestPage : requestedLatestPage}
              totalPages={
                latestResult.status === "fulfilled"
                  ? Math.max(
                    1,
                    Math.ceil(
                      (latestResult.value.data.params?.pagination?.totalItems ?? latestMovies.length) /
                      Math.max(1, latestResult.value.data.params?.pagination?.totalItemsPerPage ?? sectionPerPage),
                    ),
                  )
                  : 1
              }
              totalItems={latestResult.status === "fulfilled" ? latestResult.value.data.params?.pagination?.totalItems ?? latestMovies.length : latestMovies.length}
            />
          </>
        ) : (
          <div className="rounded-xl bg-[#0b1020] px-4 py-8 text-center">
            <p className="text-sm text-slate-400">Chua co du lieu phim moi.</p>
          </div>
        )}
      </section>

      {/* Single movies */}
      <section className="mb-6 space-y-3 rounded-2xl bg-[#070b18]/60 p-3 ring-1 ring-white/5 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
            Phim lẻ nổi bật
          </h2>
          <Link
            href="/movies?list=phim-le"
            className="text-xs text-emerald-300 hover:text-emerald-200"
          >
            Xem tất cả
          </Link>
        </div>
        {singleMovies.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {singleMovies.map((movie) => (
                <MovieCard key={movie.slug} movie={movie} />
              ))}
            </div>
            <SectionPagination
              state={safeState}
              sectionKey="singlePage"
              currentPage={singleResult.status === "fulfilled" ? singleResult.value.data.params?.pagination?.currentPage ?? requestedSinglePage : requestedSinglePage}
              totalPages={
                singleResult.status === "fulfilled"
                  ? Math.max(
                    1,
                    Math.ceil(
                      (singleResult.value.data.params?.pagination?.totalItems ?? singleMovies.length) /
                      Math.max(1, singleResult.value.data.params?.pagination?.totalItemsPerPage ?? sectionPerPage),
                    ),
                  )
                  : 1
              }
              totalItems={singleResult.status === "fulfilled" ? singleResult.value.data.params?.pagination?.totalItems ?? singleMovies.length : singleMovies.length}
            />
          </>
        ) : (
          <div className="rounded-xl bg-[#0b1020] px-4 py-8 text-center">
            <p className="text-sm text-slate-400">Chua co du lieu phim le.</p>
          </div>
        )}
      </section>

      {/* Series movies */}
      <section className="mb-6 space-y-3 rounded-2xl bg-[#070b18]/60 p-3 ring-1 ring-white/5 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
            Phim bộ nổi bật
          </h2>
          <Link
            href="/movies?list=phim-bo"
            className="text-xs text-emerald-300 hover:text-emerald-200"
          >
            Xem tất cả
          </Link>
        </div>
        {seriesMovies.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {seriesMovies.map((movie) => (
                <MovieCard key={movie.slug} movie={movie} />
              ))}
            </div>
            <SectionPagination
              state={safeState}
              sectionKey="seriesPage"
              currentPage={seriesResult.status === "fulfilled" ? seriesResult.value.data.params?.pagination?.currentPage ?? requestedSeriesPage : requestedSeriesPage}
              totalPages={
                seriesResult.status === "fulfilled"
                  ? Math.max(
                    1,
                    Math.ceil(
                      (seriesResult.value.data.params?.pagination?.totalItems ?? seriesMovies.length) /
                      Math.max(1, seriesResult.value.data.params?.pagination?.totalItemsPerPage ?? sectionPerPage),
                    ),
                  )
                  : 1
              }
              totalItems={seriesResult.status === "fulfilled" ? seriesResult.value.data.params?.pagination?.totalItems ?? seriesMovies.length : seriesMovies.length}
            />
          </>
        ) : (
          <div className="rounded-xl bg-[#0b1020] px-4 py-8 text-center">
            <p className="text-sm text-slate-400">Chua co du lieu phim bo.</p>
          </div>
        )}
      </section>

      {/* Browse movies with genre filter + pagination */}
      <section className="space-y-3 rounded-2xl bg-[#070b18]/60 p-3 ring-1 ring-white/5 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
            Kham pha phim
          </h2>
          <Link href="/movies" className="text-xs text-emerald-300 hover:text-emerald-200">
            Xem them
          </Link>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <Link
            key="all"
            href={buildHomeBrowseHref(safeState, "all", 1)}
            className={`rounded-full px-3 py-1 transition ${selectedGenreSlugs.length === 0
              ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/50"
              : "bg-white/5 text-slate-200 hover:bg-white/10"
              }`}
          >
            Tat ca
          </Link>
          {genreOptions
            .filter((g) => g.slug !== "all")
            .map((genre) => {
              const isActive = selectedGenreSlugs.includes(genre.slug);
              const nextGenre = toggleGenreInList(safeGenre, genre.slug);
              return (
                <Link
                  key={genre.slug}
                  href={buildHomeBrowseHref(safeState, nextGenre, 1)}
                  className={`rounded-full px-3 py-1 transition ${isActive
                    ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/50"
                    : "bg-white/5 text-slate-200 hover:bg-white/10"
                    }`}
                >
                  {genre.name}
                </Link>
              );
            })}
        </div>

        {selectedGenreSlugs.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500">Dang loc:</span>
            {selectedGenreSlugs.map((slug) => {
              const genre = genreOptions.find((g) => g.slug === slug);
              const nextGenre = toggleGenreInList(safeGenre, slug);
              return (
                <Link
                  key={slug}
                  href={buildHomeBrowseHref(safeState, nextGenre, 1)}
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300 ring-1 ring-emerald-500/30 transition hover:bg-red-500/15 hover:text-red-300 hover:ring-red-500/30"
                  title={`Bo chon ${genre?.name || slug}`}
                >
                  {genre?.name || slug}
                  <span className="text-[10px]">×</span>
                </Link>
              );
            })}
            <Link
              href={buildHomeBrowseHref(safeState, "all", 1)}
              className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-slate-400 transition hover:bg-red-500/10 hover:text-red-300"
            >
              Xoa tat ca
            </Link>
          </div>
        )}

        {browseMovies.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {browseMovies.map((movie) => (
                <MovieCard key={`browse-${movie.slug}`} movie={movie} />
              ))}
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[#070b18] px-3 py-2 text-xs text-slate-300 ring-1 ring-white/5">
              <div className="flex items-center gap-2 ml-auto">
                <Link
                  href={buildHomeBrowseHref(safeState, safeGenre, Math.max(1, currentBrowsePage - 1))}
                  className={`rounded px-3 py-1 ${currentBrowsePage <= 1
                    ? "pointer-events-none bg-white/5 text-slate-500"
                    : "bg-white/5 text-slate-200 hover:bg-white/10"
                    }`}
                >
                  Trang truoc
                </Link>
                <form action="/" method="get" className="flex items-center gap-2">
                  {toHomeQueryEntries(safeState)
                    .filter(([key]) => key !== "p")
                    .map(([key, value]) => (
                      <input key={key} type="hidden" name={key} value={value} />
                    ))}
                  <input
                    type="number"
                    name="p"
                    min={1}
                    max={totalBrowsePages}
                    defaultValue={currentBrowsePage}
                    className="h-7 w-20 rounded border border-white/10 bg-black/30 px-2 text-center text-xs text-slate-100 focus:border-emerald-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded bg-emerald-500/20 px-2 py-1 text-[11px] text-emerald-300 hover:bg-emerald-500/30"
                  >
                    Den trang
                  </button>
                </form>
                <Link
                  href={buildHomeBrowseHref(
                    safeState,
                    safeGenre,
                    Math.min(totalBrowsePages, currentBrowsePage + 1),
                  )}
                  className={`rounded px-3 py-1 ${currentBrowsePage >= totalBrowsePages
                    ? "pointer-events-none bg-white/5 text-slate-500"
                    : "bg-white/5 text-slate-200 hover:bg-white/10"
                    }`}
                >
                  Trang sau
                </Link>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-xl bg-[#0b1020] px-4 py-8 text-center">
            <p className="text-sm text-slate-400">Khong co phim cho the loai nay.</p>
          </div>
        )}
      </section>
    </div>
  );
}
