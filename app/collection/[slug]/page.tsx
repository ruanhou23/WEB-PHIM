import Link from "next/link";
import Image from "next/image";
import {
    findSeriesBySlug,
    getRelatedSeriesList,
    extractBaseName,
    type ExcelMovieSeries,
} from "@/lib/api/excel-movies";

type CollectionWatchProps = {
    params:
    | { slug?: string }
    | Promise<{ slug?: string }>;
    searchParams?:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>;
};

export default async function CollectionWatchPage(props: CollectionWatchProps) {
    const resolvedParams = await Promise.resolve(props.params);
    const resolvedSearch = props.searchParams ? await Promise.resolve(props.searchParams) : {};
    const slug = typeof resolvedParams?.slug === "string" ? resolvedParams.slug : "";

    const series = slug ? findSeriesBySlug(slug) : null;

    if (!series) {
        return (
            <div className="mx-auto max-w-6xl px-3 pb-8 pt-4 sm:px-4 lg:px-6">
                {/* Header */}
                <header className="mb-4 flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-purple-500/15 via-transparent to-sky-500/10 px-4 py-3 ring-1 ring-white/5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/40">
                            <span className="text-lg font-extrabold text-black">M</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">mePhim</h1>
                            <p className="text-xs text-slate-400">Xem phim online miễn phí</p>
                        </div>
                    </Link>
                </header>

                <div className="flex flex-col items-center justify-center rounded-2xl bg-[#070b18] py-24 ring-1 ring-white/5">
                    <span className="mb-4 text-5xl">🎬</span>
                    <h2 className="text-xl font-bold text-white">Không tìm thấy phim</h2>
                    <p className="mt-2 text-sm text-slate-400">
                        Phim này không tồn tại hoặc đã bị ẩn bởi quản trị viên.
                    </p>
                    <Link
                        href="/"
                        className="mt-6 rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-400"
                    >
                        Về trang chủ
                    </Link>
                </div>
            </div>
        );
    }

    // Determine which episode to show
    const epParam = typeof resolvedSearch?.ep === "string" ? parseInt(resolvedSearch.ep, 10) : 1;
    const episodeIndex = Math.max(0, Math.min(epParam - 1, series.episodes.length - 1));
    const currentEp = series.episodes[episodeIndex];

    const relatedSeries = getRelatedSeriesList(series.slug, 8);
    const viewCount = Number(currentEp.view) || 0;
    const totalViews = series.totalViews;

    return (
        <div className="mx-auto max-w-6xl px-3 pb-8 pt-4 sm:px-4 lg:px-6">
            {/* Header */}
            <header className="mb-4 flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-purple-500/15 via-transparent to-sky-500/10 px-4 py-3 ring-1 ring-white/5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                <Link href="/" className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/40">
                        <span className="text-lg font-extrabold text-black">M</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight sm:text-xl">mePhim</h1>
                        <p className="text-xs text-slate-400">Xem phim online miễn phí</p>
                    </div>
                </Link>

                <div className="flex flex-1 flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
                    <nav className="flex flex-wrap items-center gap-1 text-xs font-medium text-slate-300 sm:justify-end">
                        <Link href="/" className="rounded-full px-3 py-1.5 hover:bg-white/5">
                            Trang chủ
                        </Link>
                        <Link href="/movies" className="rounded-full px-3 py-1.5 hover:bg-white/5">
                            Phim
                        </Link>
                    </nav>
                    <form action="/movies" method="get" className="relative">
                        <input
                            name="keyword"
                            className="h-9 w-full rounded-full border border-white/10 bg-black/40 px-3 pr-9 text-xs text-slate-100 placeholder:text-slate-500 shadow-inner shadow-black/60 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                            placeholder="Tìm kiếm phim..."
                        />
                        <button
                            type="submit"
                            className="absolute inset-y-0 right-0 px-3 text-[11px] text-slate-400 hover:text-emerald-300"
                            aria-label="Tìm kiếm phim"
                        >
                            ⌕
                        </button>
                    </form>
                </div>
            </header>

            {/* Breadcrumb */}
            <nav className="mb-3 text-xs text-slate-400">
                <Link href="/" className="hover:text-emerald-300">Trang chủ</Link>
                <span className="mx-1">/</span>
                <span className="text-purple-300">Phim sưu tầm</span>
                <span className="mx-1">/</span>
                <span className="text-slate-200">{series.baseName}</span>
                {series.isSeries && (
                    <>
                        <span className="mx-1">/</span>
                        <span className="text-sky-300">Tập {episodeIndex + 1}</span>
                    </>
                )}
            </nav>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,1.4fr)]">
                {/* Player chính */}
                <main className="space-y-3">
                    {/* Video Player */}
                    <section className="overflow-hidden rounded-2xl bg-black ring-1 ring-purple-500/20">
                        <div className="relative aspect-video bg-slate-950">
                            {currentEp.link ? (
                                <iframe
                                    src={currentEp.link}
                                    title={`Xem phim: ${series.baseName}${series.isSeries ? ` - Tập ${episodeIndex + 1}` : ""}`}
                                    className="h-full w-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                    allowFullScreen
                                    referrerPolicy="strict-origin-when-cross-origin"
                                />
                            ) : (
                                <div className="relative z-10 flex h-full flex-col items-center justify-center gap-3 px-3 text-center">
                                    <span className="text-5xl">🎬</span>
                                    <p className="text-sm font-semibold text-slate-100">
                                        Chưa có nguồn phát cho tập này
                                    </p>
                                    <p className="max-w-md text-xs text-slate-400">
                                        Tập phim chưa được cập nhật link xem. Vui lòng quay lại sau.
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Movie title bar */}
                    <section className="rounded-2xl bg-[#070b18] p-4 ring-1 ring-white/5">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-purple-500/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-purple-300">
                                Sưu tầm
                            </span>
                            {series.isSeries && (
                                <span className="rounded-full bg-sky-500/20 px-3 py-1 text-[11px] font-semibold text-sky-300">
                                    Tập {episodeIndex + 1}/{series.episodeCount}
                                </span>
                            )}
                            {series.year && (
                                <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] text-slate-200">
                                    Năm: {series.year}
                                </span>
                            )}
                            {viewCount > 0 && (
                                <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] text-slate-200">
                                    👁 {viewCount.toLocaleString("vi-VN")} lượt xem (tập này)
                                </span>
                            )}
                            {totalViews > 0 && series.isSeries && (
                                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-300">
                                    Tổng: {totalViews.toLocaleString("vi-VN")} lượt xem
                                </span>
                            )}
                        </div>
                        <h2 className="mt-3 text-xl font-bold text-white sm:text-2xl">
                            {series.baseName}
                        </h2>
                        {currentEp.info && (
                            <p className="mt-3 text-sm leading-7 tracking-wide text-slate-300/90" style={{ wordBreak: 'break-word' }}>
                                {currentEp.info}
                            </p>
                        )}
                    </section>

                    {/* Episode selector */}
                    {series.isSeries && (
                        <section className="rounded-2xl bg-[#070b18] p-4 ring-1 ring-white/5">
                            <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
                                <span>📋</span> Danh sách tập ({series.episodeCount} tập)
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {series.episodes.map((ep, idx) => {
                                    const epNum = idx + 1;
                                    const isActive = idx === episodeIndex;
                                    const { episodeNum } = extractBaseName(ep.name);
                                    const displayNum = episodeNum > 0 ? episodeNum : epNum;

                                    return (
                                        <Link
                                            key={`ep-${idx}`}
                                            href={`/collection/${series.slug}?ep=${epNum}`}
                                            className={`flex min-w-[48px] items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold transition ${isActive
                                                ? "bg-purple-500 text-white shadow-lg shadow-purple-500/40"
                                                : "bg-white/5 text-slate-300 hover:bg-purple-500/20 hover:text-purple-200"
                                                }`}
                                        >
                                            Tập {displayNum}
                                        </Link>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* External link notice */}
                    {currentEp.link && (
                        <section className="rounded-2xl bg-[#070b18] p-4 ring-1 ring-white/5">
                            <p className="text-xs text-slate-400">
                                💡 Nếu video không hiển thị, bạn có thể thử{" "}
                                <a
                                    href={currentEp.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-semibold text-purple-300 underline underline-offset-2 hover:text-purple-200"
                                >
                                    mở link gốc tại đây
                                </a>
                                .
                            </p>
                        </section>
                    )}
                </main>

                {/* Sidebar */}
                <aside className="space-y-3">
                    {/* Movie poster & info */}
                    <div className="rounded-2xl bg-[#070b18] p-4 ring-1 ring-white/5">
                        {series.img && (
                            <div className="relative mb-4 aspect-[2/3] w-full overflow-hidden rounded-xl ring-1 ring-white/10">
                                <Image
                                    src={series.img}
                                    alt={series.baseName}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            </div>
                        )}

                        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-200">
                            Thông tin phim
                        </h2>
                        <div className="space-y-2 text-xs text-slate-300">
                            <div className="flex justify-between rounded-lg bg-white/5 px-3 py-2">
                                <span className="text-slate-500">Tên phim</span>
                                <span className="font-medium text-slate-100">{series.baseName}</span>
                            </div>
                            <div className="flex justify-between rounded-lg bg-white/5 px-3 py-2">
                                <span className="text-slate-500">Năm</span>
                                <span className="font-medium text-slate-100">{series.year || "N/A"}</span>
                            </div>
                            <div className="flex justify-between rounded-lg bg-white/5 px-3 py-2">
                                <span className="text-slate-500">Số tập</span>
                                <span className="font-medium text-sky-300">{series.episodeCount}</span>
                            </div>
                            <div className="flex justify-between rounded-lg bg-white/5 px-3 py-2">
                                <span className="text-slate-500">Tổng lượt xem</span>
                                <span className="font-medium text-emerald-400">
                                    {totalViews > 0 ? totalViews.toLocaleString("vi-VN") : "—"}
                                </span>
                            </div>
                            <div className="flex justify-between rounded-lg bg-white/5 px-3 py-2">
                                <span className="text-slate-500">Nguồn</span>
                                <span className="rounded bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                                    Sưu tầm
                                </span>
                            </div>
                        </div>

                        {currentEp.info && (
                            <div className="mt-4 rounded-xl border border-purple-500/10 bg-gradient-to-br from-purple-500/5 to-transparent p-4">
                                <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-purple-300/80">
                                    <span>📝</span> Mô tả
                                </h3>
                                <p className="text-[13px] leading-7 tracking-wide text-slate-200/90" style={{ wordBreak: 'break-word' }}>
                                    {currentEp.info}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Related series */}
                    {relatedSeries.length > 0 && (
                        <div className="rounded-2xl bg-[#070b18] p-4 ring-1 ring-white/5">
                            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-300">
                                Phim sưu tầm khác
                            </h3>
                            <div className="space-y-2">
                                {relatedSeries.map((rSeries, index) => (
                                    <Link
                                        key={`${rSeries.slug}-${index}`}
                                        href={`/collection/${rSeries.slug}`}
                                        className="group flex items-center gap-3 rounded-xl bg-white/5 p-2 transition hover:bg-purple-500/15"
                                    >
                                        {rSeries.img ? (
                                            <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/10">
                                                <Image
                                                    src={rSeries.img}
                                                    alt={rSeries.baseName}
                                                    fill
                                                    className="object-cover transition group-hover:scale-105"
                                                    unoptimized
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex h-14 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-lg ring-1 ring-white/10">
                                                🎬
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <p className="line-clamp-1 text-xs font-medium text-slate-100 group-hover:text-purple-300">
                                                {rSeries.baseName}
                                            </p>
                                            <p className="text-[10px] text-slate-400">
                                                {rSeries.year || "N/A"}
                                                {rSeries.isSeries && ` • ${rSeries.episodeCount} tập`}
                                                {rSeries.totalViews > 0 && ` • ${rSeries.totalViews.toLocaleString("vi-VN")} views`}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}
