import Link from "next/link";
import AdBlockOverlay from "@/app/components/adblock-overlay";
import WatchLoginGuard from "@/app/components/watch-login-guard";
import { getListBySlug, getMovieDetail } from "@/lib/api/ophim";
import type {
  OPhimEpisodeItem,
  OPhimEpisodeServer,
  OPhimMovie,
} from "@/lib/types/api";

type WatchPageProps = {
  params:
    | {
        slug?: string;
      }
    | Promise<{
        slug?: string;
      }>;
  searchParams?:
    | {
        sv?: string;
        ep?: string;
      }
    | Promise<{
        sv?: string;
        ep?: string;
      }>;
};

type ResolvedWatchRouteInput = {
  params: {
    slug: string;
  };
  searchParams: {
    sv?: string;
    ep?: string;
  };
};

async function resolveWatchRouteInput(
  props: WatchPageProps,
): Promise<ResolvedWatchRouteInput> {
  const resolvedParams = await Promise.resolve(props.params);
  const resolvedSearchParams = await Promise.resolve(props.searchParams ?? {});
  return {
    params: {
      slug: typeof resolvedParams?.slug === "string" ? resolvedParams.slug : "",
    },
    searchParams: {
      sv:
        typeof resolvedSearchParams?.sv === "string"
          ? resolvedSearchParams.sv
          : undefined,
      ep:
        typeof resolvedSearchParams?.ep === "string"
          ? resolvedSearchParams.ep
          : undefined,
    },
  };
}

function parseIndex(value: string | undefined, max: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(parsed) || parsed < 0 || parsed >= max) {
    return 0;
  }
  return parsed;
}

function getFirstPlayableEpisode(servers: OPhimEpisodeServer[]): {
  serverIndex: number;
  episodeIndex: number;
  episode: OPhimEpisodeItem | null;
} {
  for (let s = 0; s < servers.length; s += 1) {
    const episodes = servers[s]?.server_data ?? [];
    for (let e = 0; e < episodes.length; e += 1) {
      const item = episodes[e];
      const embed = item?.link_embed?.trim();
      const m3u8 = item?.link_m3u8?.trim();
      if (embed || m3u8) {
        return { serverIndex: s, episodeIndex: e, episode: item };
      }
    }
  }
  return { serverIndex: 0, episodeIndex: 0, episode: null };
}

function slugToTitle(slug: string | undefined | null): string {
  if (!slug) return "Unknown Movie";
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function WatchPage(props: WatchPageProps) {
  const { params, searchParams } = await resolveWatchRouteInput(props);
  const slugParam = params.slug;
  const safeSlug = slugParam || "unknown-movie";
  let detail: Awaited<ReturnType<typeof getMovieDetail>> | null = null;
  let apiErrorMessage: string | null = null;

  try {
    detail = await getMovieDetail(safeSlug);
  } catch (error) {
    apiErrorMessage =
      error instanceof Error ? error.message : "Khong the lay du lieu phim";
    detail = null;
  }

  const fallbackMovie: OPhimMovie = {
    _id: `fallback-${safeSlug}`,
    name: slugToTitle(safeSlug),
    slug: safeSlug,
    origin_name: slugToTitle(safeSlug),
    type: "single",
    thumb_url: "",
    poster_url: "",
    year: new Date().getFullYear(),
    category: [],
    country: [],
    content:
      "Khong tim thay du lieu phim tren API voi slug nay. Vui long thu slug khac.",
    quality: "HD",
    lang: "Vietsub",
  };

  const isMovieValid = Boolean(detail && (detail.status === "success" || (detail.status as any) === true));
  const isFallbackMovie = !isMovieValid;
  const movie = isMovieValid && detail ? detail.data.item : fallbackMovie;
  const episodesData: OPhimEpisodeServer[] =
    isMovieValid && detail
      ? detail.data.item.episodes ?? detail.data.episodes ?? []
      : [];

  const fallbackPlayable = getFirstPlayableEpisode(episodesData);
  const requestedServerIndex = parseIndex(searchParams?.sv, episodesData.length);
  const requestedServer = episodesData[requestedServerIndex];
  const requestedEpisodes = requestedServer?.server_data ?? [];
  const requestedEpisodeIndex = parseIndex(
    searchParams?.ep,
    requestedEpisodes.length,
  );
  const requestedEpisode = requestedEpisodes[requestedEpisodeIndex];
  const requestedEmbed = requestedEpisode?.link_embed?.trim();
  const requestedM3u8 = requestedEpisode?.link_m3u8?.trim();

  const currentServerIndex =
    requestedEmbed || requestedM3u8
      ? requestedServerIndex
      : fallbackPlayable.serverIndex;
  const currentEpisodeIndex =
    requestedEmbed || requestedM3u8
      ? requestedEpisodeIndex
      : fallbackPlayable.episodeIndex;
  const currentServer = episodesData[currentServerIndex] ?? null;
  const currentEpisode =
    currentServer?.server_data?.[currentEpisodeIndex] ?? fallbackPlayable.episode;
  const playerEmbedUrl = currentEpisode?.link_embed?.trim() ?? "";
  const playerM3u8Url = currentEpisode?.link_m3u8?.trim() ?? "";
  const hasPlayableSource = Boolean(playerEmbedUrl || playerM3u8Url);
  let trendingMovies: OPhimMovie[] = [];
  try {
    const trendingData = await getListBySlug("phim-hot", { page: 1, limit: 8 });
    trendingMovies = (trendingData.data.items || [])
      .filter((m) => m.slug !== movie.slug)
      .slice(0, 6);
  } catch {
    trendingMovies = [];
  }

  const demoComments = [
    {
      author: "MovieFan_93",
      text: "Phim nay cuon that, nhac nen va nhiep anh rat on!",
      time: "2 gio truoc",
    },
    {
      author: "anonym_user",
      text: "Ai xem den doan cuoi cho minh xin giai thich voi.",
      time: "5 gio truoc",
    },
    {
      author: "admin_mod",
      text: "Lich su tap se duoc cap nhat them trong ban tiep theo.",
      time: "hom qua",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-3 pb-8 pt-4 sm:px-4 lg:px-6">
      <header className="mb-4 flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-transparent to-sky-500/10 px-4 py-3 ring-1 ring-white/5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/40">
            <span className="text-lg font-extrabold text-black">M</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
              mePhim
            </h1>
            <p className="text-xs text-slate-400">
              Xem phim online mien phi, toc do cao
            </p>
          </div>
        </Link>

        <div className="flex flex-1 flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
          <nav className="flex flex-wrap items-center gap-1 text-xs font-medium text-slate-300 sm:justify-end">
            <Link href="/" className="rounded-full px-3 py-1.5 hover:bg-white/5">
              Trang chu
            </Link>
            <Link
              href="/movies?filter=single"
              className="rounded-full px-3 py-1.5 hover:bg-white/5"
            >
              Phim le
            </Link>
            <Link
              href="/movies?filter=series"
              className="rounded-full px-3 py-1.5 hover:bg-white/5"
            >
              Phim bo
            </Link>
            <Link
              href="/movies?filter=anime"
              className="rounded-full px-3 py-1.5 hover:bg-white/5"
            >
              Hoat hinh
            </Link>
          </nav>

          <form action="/movies" method="get" className="relative">
            <input
              name="keyword"
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

      <nav className="mb-3 text-xs text-slate-400">
        <Link href="/" className="hover:text-emerald-300">
          Trang chủ
        </Link>
        <span className="mx-1">/</span>
        <Link href="/movies" className="hover:text-emerald-300">
          Phim
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-200">Xem phim</span>
      </nav>

      {isFallbackMovie && (
        <div className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          <p>
            Khong tim thay phim tren API voi slug <b>{safeSlug}</b>.
          </p>
          {apiErrorMessage && (
            <p className="mt-1 text-amber-200/90">
              API: <span className="font-semibold">{apiErrorMessage}</span>
            </p>
          )}
          <p className="mt-1">
            Hay thu slug hop le, vi du: <b>tro-choi-con-muc</b>
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,1.4fr)]">
        {/* Player chính */}
        <main className="space-y-3">
          <section className="overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
            <div className="relative w-full bg-slate-950" id="player-wrapper">
              <WatchLoginGuard
                slug={safeSlug}
                sv={String(currentServerIndex)}
                ep={String(currentEpisodeIndex)}
                title={`${movie.name} - ${currentEpisode?.name ?? "Phát phim"}`}
                movieName={movie.name}
                episodeName={currentEpisode?.name}
                playerEmbedUrl={playerEmbedUrl}
                playerM3u8Url={playerM3u8Url}
                hasPlayableSource={hasPlayableSource}
                posterUrl={movie.poster_url || movie.thumb_url}
              />

              {/* AdBlock overlay — Client Component */}
              <AdBlockOverlay />
            </div>
          </section>

          {hasPlayableSource && (
            <section className="rounded-2xl bg-[#070b18] p-3 text-xs text-slate-200 ring-1 ring-white/5 sm:p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-black/50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
                  {movie.type === "series" ? "Xem phim bo" : "Xem phim le"}
                </span>
                {currentServer?.server_name && (
                  <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] text-slate-200">
                    Server: {currentServer.server_name}
                  </span>
                )}
                {currentEpisode?.name && (
                  <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] text-slate-200">
                    Tap: {currentEpisode.name}
                  </span>
                )}
              </div>
            </section>
          )}

          {/* Chọn tập (đối với phim bộ) */}
          {episodesData.length > 0 && (
            <section className="rounded-2xl bg-[#070b18] p-3 text-xs text-slate-200 ring-1 ring-white/5 sm:p-4">
              <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Danh sach tap / server
              </h2>
              {episodesData.map((server, serverIndex) => (
                <div key={`${server.server_name}-${serverIndex}`} className="mb-3 last:mb-0">
                  <p className="mb-2 text-[11px] text-slate-400">
                    Server {server.server_name || serverIndex + 1}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {server.server_data?.map((ep, epIndex) => {
                      const isActive =
                        serverIndex === currentServerIndex &&
                        epIndex === currentEpisodeIndex;
                      return (
                        <Link
                          key={`${ep.slug ?? ep.name ?? "ep"}-${epIndex}`}
                          href={`/watch/${movie.slug}?sv=${serverIndex}&ep=${epIndex}`}
                          className={`rounded-full px-3 py-1 text-[11px] transition ${
                            isActive
                              ? "bg-emerald-500/30 text-emerald-100 ring-1 ring-emerald-400/50"
                              : "bg-white/5 text-slate-100 hover:bg-emerald-500/20"
                          }`}
                        >
                          {ep.name ?? `Tap ${epIndex + 1}`}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>
          )}
        </main>

        {/* Sidebar thông tin phim + đề xuất đơn giản */}
        <aside className="space-y-3 rounded-2xl bg-[#070b18] p-3 ring-1 ring-white/5 sm:p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-200">
            Thông tin phim
          </h2>
          <div className="space-y-1 text-xs text-slate-300">
            <p>
              <span className="text-slate-500">Tên phim:</span>{" "}
              <span className="text-slate-100">{movie.name}</span>
            </p>
            {movie.origin_name && (
              <p>
                <span className="text-slate-500">Tên gốc:</span>{" "}
                <span className="text-slate-100">{movie.origin_name}</span>
              </p>
            )}
            <p>
              <span className="text-slate-500">Năm phát hành:</span>{" "}
              <span className="text-slate-100">{movie.year}</span>
            </p>
            <p>
              <span className="text-slate-500">Chất lượng:</span>{" "}
              <span className="text-slate-100">{movie.quality ?? "HD"}</span>
            </p>
            <p>
              <span className="text-slate-500">Ngôn ngữ:</span>{" "}
              <span className="text-slate-100">{movie.lang ?? "Vietsub"}</span>
            </p>
            {movie.category?.length > 0 && (
              <p>
                <span className="text-slate-500">Thể loại:</span>{" "}
                <span className="text-slate-100">
                  {movie.category.map((c) => c.name).join(", ")}
                </span>
              </p>
            )}
            {movie.country?.length > 0 && (
              <p>
                <span className="text-slate-500">Quốc gia:</span>{" "}
                <span className="text-slate-100">
                  {movie.country.map((c) => c.name).join(", ")}
                </span>
              </p>
            )}
          </div>

          {movie.content && (
            <div className="mt-3 rounded-2xl bg-black/30 p-3 text-xs text-slate-200">
              <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Nội dung tóm tắt
              </h3>
              <p className="line-clamp-[8] whitespace-pre-line">
                {movie.content}
              </p>
            </div>
          )}

          <section className="mt-3 rounded-2xl bg-black/30 p-3 text-xs ring-1 ring-white/5">
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-300">
              Thinh hanh
            </h3>
            {trendingMovies.length === 0 ? (
              <p className="text-slate-500">Chua co du lieu phim thinh hanh.</p>
            ) : (
              <div className="space-y-2">
                {trendingMovies.map((tMovie, index) => (
                  <Link
                    key={tMovie._id || tMovie.slug || index}
                    href={`/watch/${tMovie.slug}`}
                    className="block rounded-lg bg-white/5 px-3 py-2 text-slate-200 transition hover:bg-emerald-500/20"
                  >
                    <p className="line-clamp-1 text-[12px] font-semibold">{tMovie.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {tMovie.year || "N/A"} • {tMovie.quality || "HD"} •{" "}
                      {tMovie.lang || "Vietsub"}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>

      <section className="mt-4 rounded-2xl bg-[#070b18] p-3 text-xs ring-1 ring-white/5 sm:p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
            Comment
          </h2>
          <span className="text-[11px] text-slate-500">{demoComments.length} binh luan</span>
        </div>

        <form className="mb-4 grid gap-2 sm:grid-cols-[180px_minmax(0,1fr)_auto]">
          <input
            placeholder="Ten hien thi"
            className="h-9 rounded-lg border border-white/10 bg-black/40 px-3 text-xs text-slate-100 outline-none focus:border-emerald-400"
          />
          <input
            placeholder="Viet binh luan cua ban..."
            className="h-9 rounded-lg border border-white/10 bg-black/40 px-3 text-xs text-slate-100 outline-none focus:border-emerald-400"
          />
          <button
            type="button"
            className="h-9 rounded-lg bg-emerald-500 px-4 text-xs font-semibold text-black hover:bg-emerald-400"
          >
            Gui
          </button>
        </form>

        <div className="space-y-2">
          {demoComments.map((comment, index) => (
            <article
              key={`${comment.author}-${index}`}
              className="rounded-lg bg-black/30 px-3 py-2"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[12px] font-semibold text-slate-100">
                  {comment.author}
                </span>
                <span className="text-[11px] text-slate-500">{comment.time}</span>
              </div>
              <p className="text-slate-300">{comment.text}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

