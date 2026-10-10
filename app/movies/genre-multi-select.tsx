"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

type Genre = {
  slug: string;
  name: string;
};

type GenreMultiSelectProps = {
  genres: Genre[];
  selected: string[];
  inputName?: string;
};

export default function GenreMultiSelect({
  genres,
  selected: initialSelected,
  inputName = "category",
}: GenreMultiSelectProps) {
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggle = (slug: string) => {
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  const remove = (slug: string) => {
    setSelected((prev) => prev.filter((s) => s !== slug));
  };

  const clearAll = () => {
    setSelected([]);
    setSearch("");
  };

  const filtered = search
    ? genres.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))
    : genres;

  const selectedGenres = selected
    .map((slug) => genres.find((g) => g.slug === slug))
    .filter(Boolean) as Genre[];

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name={inputName} value={selected.join(",")} />

      <div
        onClick={() => setOpen(!open)}
        className="flex min-h-[36px] w-full items-center gap-1 rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-left text-xs text-slate-100 outline-none transition focus:border-emerald-400 hover:border-white/20 cursor-pointer"
      >
        <div className="flex flex-1 flex-wrap items-center gap-1">
          {selectedGenres.length === 0 && (
            <span className="text-slate-500">Tat ca the loai</span>
          )}
          {selectedGenres.map((genre) => (
            <span
              key={genre.slug}
              className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300 ring-1 ring-emerald-500/30"
            >
              {genre.name}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(genre.slug);
                }}
                className="rounded-full p-0.5 hover:bg-emerald-500/30"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition ${open ? "rotate-180" : ""}`}
        />
      </div>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[280px] rounded-xl border border-white/10 bg-[#0d1225] p-2 shadow-2xl shadow-black/60">
          <div className="mb-2 flex items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tim the loai..."
              className="h-7 flex-1 rounded-lg border border-white/10 bg-black/40 px-2 text-[11px] text-slate-100 placeholder:text-slate-500 outline-none focus:border-emerald-400"
              autoFocus
            />
            {selected.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="rounded-lg px-2 py-1 text-[10px] text-red-400 hover:bg-red-500/10"
              >
                Xoa tat ca
              </button>
            )}
          </div>

          <div className="custom-scrollbar max-h-[240px] space-y-0.5 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="px-2 py-3 text-center text-[11px] text-slate-500">
                Khong tim thay the loai
              </p>
            )}
            {filtered.map((genre) => {
              const isSelected = selected.includes(genre.slug);
              return (
                <button
                  key={genre.slug}
                  type="button"
                  onClick={() => toggle(genre.slug)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition ${isSelected
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "text-slate-300 hover:bg-white/5 hover:text-slate-100"
                    }`}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] transition ${isSelected
                        ? "border-emerald-500 bg-emerald-500/30 text-emerald-200"
                        : "border-white/20 bg-black/20"
                      }`}
                  >
                    {isSelected && "✓"}
                  </span>
                  {genre.name}
                </button>
              );
            })}
          </div>

          {selected.length > 0 && (
            <div className="mt-2 border-t border-white/5 pt-2 text-[10px] text-slate-500">
              Da chon {selected.length} the loai
            </div>
          )}
        </div>
      )}
    </div>
  );
}
