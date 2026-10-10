"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, X, Search, Check } from "lucide-react";

type GenreItem = {
  slug: string;
  name: string;
};

type HeaderGenreDropdownProps = {
  genres: GenreItem[];
  selectedSlugs: string[];
  buildHref: (slugs: string[]) => string;
  label?: string;
  allLabel?: string;
};

export default function HeaderGenreDropdown({
  genres,
  selectedSlugs,
  buildHref,
  label = "The loai",
  allLabel = "Tat ca the loai",
}: HeaderGenreDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const close = useCallback(() => {
    setOpen(false);
    setSearch("");
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [close]);

  const toggle = (slug: string) => {
    const next = selectedSlugs.includes(slug)
      ? selectedSlugs.filter((s) => s !== slug)
      : [...selectedSlugs, slug];
    router.push(buildHref(next));
  };

  const clearAll = () => {
    router.push(buildHref([]));
    close();
  };

  const filtered = search
    ? genres.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))
    : genres;

  const selectedGenres = selectedSlugs
    .map((slug) => genres.find((g) => g.slug === slug))
    .filter(Boolean) as GenreItem[];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="group flex items-center gap-1.5 transition-colors hover:text-emerald-300"
      >
        <span className={selectedSlugs.length > 0 ? "text-emerald-300" : "text-orange-300"}>
          {label}
        </span>
        {selectedSlugs.length > 0 && (
          <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-500/30 px-1 text-[9px] font-bold text-emerald-300">
            {selectedSlugs.length}
          </span>
        )}
        <ChevronDown
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""} ${
            selectedSlugs.length > 0 ? "text-emerald-400" : "text-orange-400"
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-1/2 top-full z-50 mt-3 w-[min(94vw,720px)] -translate-x-1/2 rounded-2xl border border-white/10 bg-[#0d1225]/98 p-0 shadow-2xl shadow-black/70 backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-100">{label}</h3>
              {selectedSlugs.length > 0 && (
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                  {selectedSlugs.length} da chon
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {selectedSlugs.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="rounded-lg px-2 py-1 text-[11px] text-red-400 transition hover:bg-red-500/10"
                >
                  Xoa tat ca
                </button>
              )}
              <button
                type="button"
                onClick={close}
                className="rounded-lg p-1 text-slate-500 transition hover:bg-white/5 hover:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Selected tags */}
          {selectedGenres.length > 0 && (
            <div className="flex flex-wrap gap-1.5 border-b border-white/5 px-4 py-2.5">
              {selectedGenres.map((genre) => (
                <button
                  key={genre.slug}
                  type="button"
                  onClick={() => toggle(genre.slug)}
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-medium text-emerald-300 ring-1 ring-emerald-500/30 transition hover:bg-red-500/15 hover:text-red-300 hover:ring-red-500/30"
                >
                  {genre.name}
                  <X className="h-2.5 w-2.5" />
                </button>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="border-b border-white/5 px-4 py-2.5">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tim the loai..."
                className="h-8 w-full rounded-lg border border-white/10 bg-black/30 pl-8 pr-3 text-xs text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
                autoFocus
              />
            </div>
          </div>

          {/* Genre grid */}
          <div className="custom-scrollbar max-h-[300px] overflow-y-auto px-4 py-3">
            {filtered.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-500">
                Khong tim thay the loai nao
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4">
                {filtered.map((genre) => {
                  const isSelected = selectedSlugs.includes(genre.slug);
                  return (
                    <button
                      key={genre.slug}
                      type="button"
                      onClick={() => toggle(genre.slug)}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] transition ${
                        isSelected
                          ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/20"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-500/40"
                            : "border-white/15 bg-white/5"
                        }`}
                      >
                        {isSelected && <Check className="h-2.5 w-2.5 text-emerald-200" />}
                      </span>
                      {genre.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {selectedSlugs.length === 0 && (
            <div className="border-t border-white/5 px-4 py-2.5">
              <p className="text-center text-[11px] text-slate-500">
                Chon mot hoac nhieu the loai de loc phim
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
