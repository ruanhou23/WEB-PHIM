"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";
import HeaderGenreDropdown from "./header-genre-dropdown";

type GenreItem = { slug: string; name: string };
type CountryItem = { slug: string; name: string };

type CountryMenuEntry = {
  flag: string;
  name: string;
  slug: string;
};

type CountryRegion = {
  label: string;
  items: CountryMenuEntry[];
};

const COUNTRY_REGIONS: CountryRegion[] = [
  {
    label: "Chau A",
    items: [
      { flag: "🇰🇷", name: "Han Quoc", slug: "han-quoc" },
      { flag: "🇯🇵", name: "Nhat Ban", slug: "nhat-ban" },
      { flag: "🇨🇳", name: "Trung Quoc", slug: "trung-quoc" },
      { flag: "🇹🇭", name: "Thai Lan", slug: "thai-lan" },
      { flag: "🇮🇳", name: "An Do", slug: "an-do" },
      { flag: "🇻🇳", name: "Viet Nam", slug: "viet-nam" },
      { flag: "🇭🇰", name: "Hong Kong", slug: "hong-kong" },
      { flag: "🇹🇼", name: "Dai Loan", slug: "dai-loan" },
      { flag: "🇵🇭", name: "Philippines", slug: "philippines" },
    ],
  },
  {
    label: "Chau My",
    items: [
      { flag: "🇺🇸", name: "Au My", slug: "au-my" },
      { flag: "🇨🇦", name: "Canada", slug: "canada" },
      { flag: "🇲🇽", name: "Mexico", slug: "mexico" },
      { flag: "🇧🇷", name: "Brazil", slug: "brazil" },
      { flag: "🇦🇷", name: "Argentina", slug: "argentina" },
    ],
  },
  {
    label: "Chau Au",
    items: [
      { flag: "🇬🇧", name: "Anh", slug: "anh" },
      { flag: "🇫🇷", name: "Phap", slug: "phap" },
      { flag: "🇩🇪", name: "Duc", slug: "duc" },
      { flag: "🇪🇸", name: "Tay Ban Nha", slug: "tay-ban-nha" },
      { flag: "🇮🇹", name: "Y", slug: "y" },
      { flag: "🇷🇺", name: "Nga", slug: "nga" },
    ],
  },
];

const PRIORITY_GENRES: GenreItem[] = [
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
  { slug: "phim-18", name: "Phim 18+" },
];

function mergeGenres(apiGenres: GenreItem[]): GenreItem[] {
  const merged = [...PRIORITY_GENRES];
  for (const g of apiGenres) {
    if (!merged.some((m) => m.slug === g.slug)) {
      merged.push(g);
    }
  }
  return merged;
}

type HeaderNavProps = {
  genres: GenreItem[];
  countries: CountryItem[];
  selectedGenreSlugs: string[];
  mode?: "home" | "movies";
  extraParams?: Array<[string, string]>;
};

export default function HeaderNav({
  genres: rawGenres,
  selectedGenreSlugs,
  mode = "home",
  extraParams = [],
}: HeaderNavProps) {
  const genres = mergeGenres(rawGenres);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [countryOpen, setCountryOpen] = useState(false);
  const countryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setCountryOpen(false);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setCountryOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  const buildGenreHref = useCallback(
    (slugs: string[]) => {
      const params = new URLSearchParams();
      for (const [key, value] of extraParams) {
        if (mode === "home" && key === "genre") continue;
        if (mode === "movies" && key === "category") continue;
        if (key === "page" || key === "p") continue;
        params.set(key, value);
      }
      if (slugs.length > 0) {
        params.set(mode === "home" ? "genre" : "category", slugs.join(","));
      }
      const q = params.toString();
      if (mode === "home") return q ? `/?${q}` : "/";
      return q ? `/movies?${q}` : "/movies";
    },
    [mode, extraParams],
  );

  return (
    <nav className="flex flex-wrap items-center gap-4 text-sm font-semibold uppercase tracking-wide text-slate-100 sm:justify-end">
      <Link
        href="/"
        className={isHome ? "text-emerald-300" : "hover:text-emerald-300"}
      >
        Trang chu
      </Link>

      <HeaderGenreDropdown
        genres={genres}
        selectedSlugs={selectedGenreSlugs}
        buildHref={buildGenreHref}
        label="The loai"
      />

      {/* Country mega-menu */}
      <div ref={countryRef} className="relative">
        <button
          type="button"
          onClick={() => setCountryOpen(!countryOpen)}
          className="flex items-center gap-1.5 transition-colors hover:text-emerald-300"
        >
          <span className="text-orange-300">Quoc gia</span>
          <ChevronDown
            className={`h-3 w-3 text-orange-400 transition-transform ${countryOpen ? "rotate-180" : ""}`}
          />
        </button>

        {countryOpen && (
          <div className="absolute left-1/2 top-full z-50 mt-3 w-[min(94vw,620px)] -translate-x-1/2 rounded-2xl border border-white/10 bg-[#0d1225]/98 shadow-2xl shadow-black/70 backdrop-blur-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
              <h3 className="text-sm font-semibold normal-case tracking-normal text-slate-100">
                Chon quoc gia
              </h3>
              <button
                type="button"
                onClick={() => setCountryOpen(false)}
                className="rounded-lg p-1 text-slate-500 transition hover:bg-white/5 hover:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Regions */}
            <div className="custom-scrollbar max-h-[60vh] space-y-4 overflow-y-auto px-5 py-4">
              {COUNTRY_REGIONS.map((region) => (
                <div key={region.label}>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    {region.label}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {region.items.map((country) => (
                      <Link
                        key={country.slug}
                        href={`/movies?country=${country.slug}`}
                        onClick={() => setCountryOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium normal-case tracking-normal text-slate-300 transition hover:bg-white/5 hover:text-emerald-300"
                      >
                        <span className="text-base">{country.flag}</span>
                        {country.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Link href="/movies?list=phim-chieu-rap" className="hover:text-emerald-300">
        Phim chieu rap
      </Link>
      <Link href="/movies?list=phim-bo" className="hover:text-emerald-300">
        Phim bo
      </Link>
      <Link href="/movies?list=phim-le" className="hover:text-emerald-300">
        Phim le
      </Link>
      <Link href="/anime" className="hover:text-emerald-300">
        Anime
      </Link>
    </nav>
  );
}
