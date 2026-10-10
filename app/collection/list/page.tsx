import Image from "next/image";
import Link from "next/link";
import { groupMoviesIntoSeries, type ExcelMovieSeries } from "@/lib/api/excel-movies";

function SeriesCard({ series }: { series: ExcelMovieSeries }) {
    return (
        <Link href={`/collection/${series.slug}`} className="block h-full">
            <article className="group relative flex h-full flex-col overflow-hidden rounded-xl bg-[#0b1020] shadow-md shadow-black/40 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/30 cursor-pointer">
                <div className="relative aspect-[2/3] w-full overflow-hidden">
                    {series.img ? (
                        <Image
                            src={series.img}
                            alt={series.baseName}
                            fill
                            className="object-cover transition duration-500 group-hover:scale-110"
                            unoptimized
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                            <span className="text-3xl text-slate-600">🎬</span>
                        </div>
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    <div className="absolute left-2 top-2 flex flex-col gap-1">
                        <span className="inline-flex rounded bg-purple-500/80 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur">
                            Sưu tầm
                        </span>
                        {series.isSeries && (
                            <span className="inline-flex rounded bg-sky-500/80 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur">
                                {series.episodeCount} tập
                            </span>
                        )}
                    </div>

                    {series.totalViews > 0 && (
                        <span className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-0.5 text-xs font-medium text-emerald-300 backdrop-blur">
                            {series.totalViews.toLocaleString("vi-VN")} lượt xem
                        </span>
                    )}
                </div>

                <div className="flex flex-1 flex-col space-y-1 px-3 pb-3 pt-2">
                    <h3 className="line-clamp-2 text-sm font-semibold text-slate-50 group-hover:text-purple-400">
                        {series.baseName}
                    </h3>
                    <p className="text-xs text-slate-400">
                        {series.year || "N/A"}
                    </p>
                    {series.info && (
                        <p className="line-clamp-2 text-[11px] text-slate-500">
                            {series.info}
                        </p>
                    )}
                </div>
            </article>
        </Link>
    );
}

export default async function CollectionListingPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; keyword?: string }>;
}) {
    const resolvedParams = await searchParams;
    const page = Math.max(1, parseInt(resolvedParams.page || "1", 10));
    const keyword = (resolvedParams.keyword || "").trim().toLowerCase();
    const perPage = 30;

    let allSeries = groupMoviesIntoSeries();

    if (keyword) {
        allSeries = allSeries.filter(
            (s) =>
                s.baseName.toLowerCase().includes(keyword) ||
                s.info.toLowerCase().includes(keyword)
        );
    }

    const totalItems = allSeries.length;
    const totalPages = Math.ceil(totalItems / perPage);
    const safePage = Math.min(page, Math.max(1, totalPages));
    const start = (safePage - 1) * perPage;
    const currentSeries = allSeries.slice(start, start + perPage);

    return (
        <div className="mx-auto max-w-7xl px-4 py-8">
            <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Phim Sưu Tầm</h1>
                    <p className="mt-1 text-slate-400">Khám phá bộ sưu tập phim được tuyển chọn đặc biệt ({totalItems} bộ)</p>
                </div>

                <div className="flex flex-1 max-w-md items-center gap-3">
                    <form action="/collection/list" method="get" className="relative flex-1">
                        <input
                            name="keyword"
                            defaultValue={keyword}
                            placeholder="Tìm tên phim trong bộ sưu tập..."
                            className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-slate-200 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
                    </form>
                    <span className="hidden sm:inline-flex rounded-full bg-purple-500/20 px-4 py-1.5 text-xs font-semibold text-purple-300 ring-1 ring-purple-500/30 whitespace-nowrap">
                        {totalItems} bộ phim
                    </span>
                </div>
            </div>

            {currentSeries.length > 0 ? (
                <>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                        {currentSeries.map((series) => (
                            <SeriesCard key={series.slug} series={series} />
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="mt-12 flex flex-col items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Link
                                    href={`/collection/list?page=${Math.max(1, safePage - 1)}${keyword ? `&keyword=${keyword}` : ""}`}
                                    className={`rounded-lg bg-white/5 px-6 py-2.5 text-sm font-medium transition ${safePage <= 1 ? "pointer-events-none opacity-50 text-slate-600" : "text-slate-200 hover:bg-white/10 hover:text-emerald-400"
                                        }`}
                                >
                                    ← Trang trước
                                </Link>

                                <div className="flex items-center gap-1">
                                    {/* Simple page numbers for quick jump */}
                                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                        let pageNum = safePage - 2 + i;
                                        if (safePage <= 2) pageNum = i + 1;
                                        if (safePage >= totalPages - 1) pageNum = totalPages - 4 + i;
                                        if (pageNum < 1 || pageNum > totalPages) return null;

                                        return (
                                            <Link
                                                key={pageNum}
                                                href={`/collection/list?page=${pageNum}${keyword ? `&keyword=${keyword}` : ""}`}
                                                className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition ${safePage === pageNum
                                                        ? "bg-purple-500 text-white"
                                                        : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                                                    }`}
                                            >
                                                {pageNum}
                                            </Link>
                                        );
                                    })}
                                </div>

                                <Link
                                    href={`/collection/list?page=${Math.min(totalPages, safePage + 1)}${keyword ? `&keyword=${keyword}` : ""}`}
                                    className={`rounded-lg bg-white/5 px-6 py-2.5 text-sm font-medium transition ${safePage >= totalPages ? "pointer-events-none opacity-50 text-slate-600" : "text-slate-200 hover:bg-white/10 hover:text-emerald-400"
                                        }`}
                                >
                                    Trang sau →
                                </Link>
                            </div>
                            <div className="text-xs text-slate-500">
                                Hiển thị {start + 1} - {Math.min(start + perPage, totalItems)} trong tổng số {totalItems} bộ phim
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="mb-4 text-6xl opacity-50">🎬</div>
                    <h2 className="text-xl font-semibold text-white">Không tìm thấy phim nào</h2>
                    <p className="mt-2 text-slate-400">"{keyword}" không khớp với bất kỳ phim nào trong bộ sưu tập.</p>
                    <Link href="/collection/list" className="mt-8 rounded-full bg-white/10 px-8 py-3 text-sm font-medium text-emerald-400 hover:bg-white/20 transition">
                        Xem tất cả phim sưu tầm
                    </Link>
                </div>
            )}
        </div>
    );
}
