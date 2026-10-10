"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import MoviePosterImage from "./MoviePosterImage";
import {
    LucideUploadCloud,
    LucideDownload,
    LucideTrash2,
    LucideSearch,
    LucideChevronLeft,
    LucideChevronRight,
    LucideFileSpreadsheet,
    LucideExternalLink,
    LucideEye,
    LucideEyeOff,
    LucideInfo,
    LucideLoader2,
    LucideCheckCircle2,
    LucideAlertTriangle,
} from "lucide-react";

type ExcelMovie = {
    name: string;
    view: string | number;
    img: string;
    year: string | number;
    info: string;
    link: string;
    hidden?: boolean;
};

type ApiResponse = {
    success: boolean;
    message?: string;
    data?: {
        items?: ExcelMovie[];
        totalItems: number;
        page?: number;
        totalPages?: number;
    };
};

export default function ExcelMoviesTab() {
    const [movies, setMovies] = useState<ExcelMovie[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [keyword, setKeyword] = useState("");
    const [searchInput, setSearchInput] = useState("");

    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const PER_PAGE = 24;

    // Fetch movies from API
    const fetchMovies = useCallback(
        async (page: number, kw: string) => {
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    page: String(page),
                    limit: String(PER_PAGE),
                });
                if (kw) params.set("keyword", kw);

                const res = await fetch(`/api/admin/excel-movies?${params}`);
                const json: ApiResponse = await res.json();

                if (json.success && json.data) {
                    setMovies(json.data.items ?? []);
                    setTotalItems(json.data.totalItems);
                    setCurrentPage(json.data.page ?? page);
                    setTotalPages(json.data.totalPages ?? 0);
                } else {
                    showToast("error", json.message ?? "Lỗi tải dữ liệu");
                }
            } catch {
                showToast("error", "Không thể kết nối API");
            } finally {
                setLoading(false);
            }
        },
        [],
    );

    useEffect(() => {
        fetchMovies(1, "");
    }, [fetchMovies]);

    function showToast(type: "success" | "error", msg: string) {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 4000);
    }

    // Upload handler
    async function handleUpload(file: File) {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch("/api/admin/excel-movies", {
                method: "POST",
                body: formData,
            });
            const json: ApiResponse = await res.json();
            if (json.success) {
                showToast("success", json.message ?? "Upload thành công!");
                setKeyword("");
                setSearchInput("");
                await fetchMovies(1, "");
            } else {
                showToast("error", json.message ?? "Lỗi upload");
            }
        } catch {
            showToast("error", "Không thể upload file");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }

    // Delete handler
    async function handleDelete() {
        if (!confirm("Bạn có chắc muốn xóa file đã tải lên?")) return;
        try {
            const res = await fetch("/api/admin/excel-movies", { method: "DELETE" });
            const json = await res.json();
            if (json.success) {
                showToast("success", "Đã xóa file");
                setMovies([]);
                setTotalItems(0);
                setTotalPages(0);
                setCurrentPage(1);
            } else {
                showToast("error", json.message ?? "Lỗi xóa file");
            }
        } catch {
            showToast("error", "Không thể xóa file");
        }
    }

    // Toggle visibility handler
    async function handleToggleVisibility(movieName: string) {
        try {
            const res = await fetch("/api/admin/excel-movies", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: movieName }),
            });
            const json = await res.json();
            if (json.success) {
                // Update local state immediately
                setMovies((prev) =>
                    prev.map((m) =>
                        m.name === movieName ? { ...m, hidden: json.hidden } : m,
                    ),
                );
                showToast("success", json.message);
            } else {
                showToast("error", json.message ?? "Lỗi cập nhật");
            }
        } catch {
            showToast("error", "Không thể cập nhật trạng thái");
        }
    }

    // Drag & Drop
    function handleDragOver(e: React.DragEvent) {
        e.preventDefault();
        setDragOver(true);
    }
    function handleDragLeave() {
        setDragOver(false);
    }
    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleUpload(file);
    }

    // Search
    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        setKeyword(searchInput);
        fetchMovies(1, searchInput);
    }

    function goToPage(page: number) {
        if (page < 1 || page > totalPages) return;
        fetchMovies(page, keyword);
    }

    function formatViews(v: string | number): string {
        const num = Number(v);
        if (isNaN(num)) return String(v);
        return num.toLocaleString("vi-VN");
    }

    const hasData = totalItems > 0;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Toast notification */}
            {toast && (
                <div
                    className={`fixed top-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-semibold shadow-2xl backdrop-blur-xl transition-all animate-in slide-in-from-right-8 duration-300 ${toast.type === "success"
                        ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                        : "border border-rose-500/30 bg-rose-500/15 text-rose-300"
                        }`}
                >
                    {toast.type === "success" ? (
                        <LucideCheckCircle2 className="h-5 w-5" />
                    ) : (
                        <LucideAlertTriangle className="h-5 w-5" />
                    )}
                    {toast.msg}
                </div>
            )}

            {/* Upload Zone */}
            <section className="rounded-3xl border border-white/5 bg-[#070b18] p-6 shadow-xl">
                <div className="flex flex-col gap-5">
                    {/* Title row */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                                <LucideFileSpreadsheet className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white">Import từ Excel / CSV</h3>
                                <p className="text-xs text-slate-500">
                                    Cột: <code className="text-emerald-400/80">name</code>,{" "}
                                    <code className="text-emerald-400/80">view</code>,{" "}
                                    <code className="text-emerald-400/80">img</code>,{" "}
                                    <code className="text-emerald-400/80">year</code>,{" "}
                                    <code className="text-emerald-400/80">info</code>,{" "}
                                    <code className="text-emerald-400/80">link</code>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <a
                                href="/api/admin/excel-movies?action=sample"
                                className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
                            >
                                <LucideDownload className="h-4 w-4" /> Mẫu .xlsx
                            </a>
                            <a
                                href="/api/admin/excel-movies?action=sample&format=csv"
                                className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
                            >
                                <LucideDownload className="h-4 w-4" /> Mẫu .csv
                            </a>
                            {hasData && (
                                <button
                                    onClick={handleDelete}
                                    className="flex items-center gap-2 rounded-xl bg-rose-500/10 px-4 py-2.5 text-xs font-bold text-rose-400 transition hover:bg-rose-500/20"
                                >
                                    <LucideTrash2 className="h-4 w-4" /> Xóa file
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Drop zone */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`group relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 ${dragOver
                            ? "border-emerald-500 bg-emerald-500/5 shadow-[0_0_40px_rgba(16,185,129,0.1)]"
                            : "border-white/10 bg-white/[0.02] hover:border-emerald-500/30 hover:bg-white/[0.04]"
                            }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            className="hidden"
                            onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleUpload(f);
                            }}
                        />
                        {uploading ? (
                            <div className="flex flex-col items-center gap-3">
                                <LucideLoader2 className="h-10 w-10 animate-spin text-emerald-400" />
                                <p className="text-sm font-semibold text-emerald-400">
                                    Đang xử lý file...
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <div
                                    className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 ${dragOver
                                        ? "bg-emerald-500/20 scale-110"
                                        : "bg-white/5 group-hover:bg-emerald-500/10 group-hover:scale-105"
                                        }`}
                                >
                                    <LucideUploadCloud
                                        className={`h-7 w-7 transition-colors ${dragOver
                                            ? "text-emerald-400"
                                            : "text-slate-500 group-hover:text-emerald-400"
                                            }`}
                                    />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-300">
                                        Kéo thả file Excel/CSV vào đây hoặc{" "}
                                        <span className="text-emerald-400 underline underline-offset-2">
                                            chọn file
                                        </span>
                                    </p>
                                    <p className="mt-1 text-[11px] text-slate-500">
                                        Hỗ trợ .xlsx, .xls, .csv • Dòng đầu tiên là tiêu đề cột
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Search bar (only if data exists) */}
            {hasData && (
                <section className="rounded-3xl border border-white/5 bg-[#070b18] p-6 shadow-xl">
                    <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
                        <div className="relative flex-1">
                            <LucideSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                            <input
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Tìm phim theo tên hoặc thông tin..."
                                className="h-11 w-full rounded-xl border border-white/10 bg-black/40 pl-10 pr-4 text-sm text-slate-100 outline-none transition focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10"
                            />
                        </div>
                        <button
                            type="submit"
                            className="h-11 rounded-xl bg-emerald-500 px-6 text-sm font-bold text-black transition hover:bg-emerald-400 active:scale-95"
                        >
                            Tìm kiếm
                        </button>
                        {keyword && (
                            <button
                                type="button"
                                onClick={() => {
                                    setKeyword("");
                                    setSearchInput("");
                                    fetchMovies(1, "");
                                }}
                                className="h-11 rounded-xl bg-white/5 px-4 text-sm font-bold text-slate-300 transition hover:bg-white/10"
                            >
                                Bỏ lọc
                            </button>
                        )}
                    </form>
                </section>
            )}

            {/* Movie Table */}
            {loading ? (
                <section className="flex items-center justify-center rounded-3xl border border-white/5 bg-[#070b18] py-20 shadow-2xl">
                    <div className="flex flex-col items-center gap-3">
                        <LucideLoader2 className="h-10 w-10 animate-spin text-emerald-400/60" />
                        <p className="text-sm font-medium text-slate-500">
                            Đang tải danh sách phim...
                        </p>
                    </div>
                </section>
            ) : !hasData ? (
                <section className="flex items-center justify-center rounded-3xl border border-white/5 bg-[#070b18] py-20 shadow-2xl">
                    <div className="flex flex-col items-center gap-3 text-slate-500">
                        <LucideFileSpreadsheet className="h-12 w-12 opacity-20" />
                        <p className="text-lg font-medium opacity-60">
                            Chưa có dữ liệu Excel
                        </p>
                        <p className="text-xs">
                            Tải lên file Excel (.xlsx) hoặc CSV (.csv) để bắt đầu
                        </p>
                    </div>
                </section>
            ) : (
                <section className="overflow-hidden rounded-3xl border border-white/5 bg-[#070b18] shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02] text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    <th className="px-6 py-4">Thông tin phim</th>
                                    <th className="px-6 py-4">Năm</th>
                                    <th className="px-6 py-4">Lượt xem</th>
                                    <th className="px-6 py-4">Mô tả</th>
                                    <th className="px-6 py-4 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {movies.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-2 text-slate-500">
                                                <LucideSearch className="h-10 w-10 opacity-20" />
                                                <p className="text-lg font-medium opacity-50">
                                                    Không tìm thấy phim nào
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    movies.map((movie, idx) => (
                                        <tr
                                            key={`${movie.name}-${idx}`}
                                            className={`group transition hover:bg-white/[0.02] ${movie.hidden ? "opacity-40" : ""}`}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <MoviePosterImage
                                                        src={movie.img || "data:image/svg+xml,"}
                                                        alt={movie.name}
                                                    />
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="truncate font-bold text-white group-hover:text-emerald-400">
                                                                {movie.name}
                                                            </p>
                                                            {movie.hidden && (
                                                                <span className="shrink-0 rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-bold text-rose-400 ring-1 ring-rose-500/30">
                                                                    Đã ẩn
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 font-medium">
                                                {movie.year || "—"}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <LucideEye className="h-3.5 w-3.5 text-slate-500" />
                                                    <span className="font-bold text-emerald-500/80">
                                                        {formatViews(movie.view)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="max-w-xs px-6 py-4">
                                                <p className="truncate text-xs text-slate-400">
                                                    {movie.info || "—"}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        title={movie.hidden ? "Hiện phim" : "Ẩn phim"}
                                                        onClick={() => handleToggleVisibility(movie.name)}
                                                        className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${movie.hidden
                                                            ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-black"
                                                            : "bg-white/5 text-slate-400 hover:bg-amber-500 hover:text-black"
                                                            }`}
                                                    >
                                                        {movie.hidden ? (
                                                            <LucideEye className="h-4 w-4" />
                                                        ) : (
                                                            <LucideEyeOff className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                    {movie.link && (
                                                        <a
                                                            href={movie.link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            title="Mở link"
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-400 transition hover:bg-sky-500 hover:text-black"
                                                        >
                                                            <LucideExternalLink className="h-4 w-4" />
                                                        </a>
                                                    )}
                                                    {movie.info && (
                                                        <button
                                                            title="Xem info"
                                                            onClick={() => alert(movie.info)}
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-400 transition hover:bg-emerald-500 hover:text-black"
                                                        >
                                                            <LucideInfo className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/5 bg-white/[0.01] px-6 py-4 sm:flex-row">
                            <p className="text-xs font-medium text-slate-500">
                                Trang{" "}
                                <span className="text-white">{currentPage}</span> /{" "}
                                <span className="text-white">{totalPages}</span>
                                <span className="mx-2">•</span>
                                Tổng{" "}
                                <span className="text-white">
                                    {totalItems.toLocaleString()}
                                </span>{" "}
                                phim
                            </p>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage <= 1}
                                    className={`flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold transition-all ${currentPage > 1
                                        ? "bg-white/5 text-slate-200 hover:bg-emerald-500 hover:text-black"
                                        : "pointer-events-none opacity-20"
                                        }`}
                                >
                                    <LucideChevronLeft className="h-4 w-4" /> Trước
                                </button>
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-[11px] font-bold text-emerald-400 ring-1 ring-emerald-500/20">
                                    {currentPage}
                                </div>
                                <button
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage >= totalPages}
                                    className={`flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold transition-all ${currentPage < totalPages
                                        ? "bg-white/5 text-slate-200 hover:bg-emerald-500 hover:text-black"
                                        : "pointer-events-none opacity-20"
                                        }`}
                                >
                                    Sau <LucideChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}
