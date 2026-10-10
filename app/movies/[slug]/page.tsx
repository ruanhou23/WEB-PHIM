import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMovieBySlug } from "@/data/movies";

type MovieDetailPageProps = {
  params: {
    slug: string;
  };
};

export default function MovieDetailPage({ params }: MovieDetailPageProps) {
  const movie = getMovieBySlug(params.slug);

  if (!movie) {
    return notFound();
  }

  return (
    <div className="mx-auto max-w-5xl px-3 pb-8 pt-4 sm:px-4 lg:px-6">
      <nav className="mb-4 text-xs text-slate-400">
        <Link href="/" className="hover:text-emerald-300">
          Trang chủ
        </Link>
        <span className="mx-1">/</span>
        <Link href="/movies" className="hover:text-emerald-300">
          Phim
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-200">{movie.title}</span>
      </nav>

      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* Poster + info ngắn */}
        <aside className="space-y-3 rounded-2xl bg-[#070b18] p-3 ring-1 ring-white/5 sm:p-4">
          <div className="relative mx-auto aspect-[2/3] w-40 overflow-hidden rounded-xl sm:w-48">
            <Image
              src={movie.poster}
              alt={movie.title}
              fill
              className="object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <span className="absolute left-2 top-2 inline-flex rounded bg-black/70 px-2 py-0.5 text-xs font-semibold text-emerald-300 backdrop-blur">
              {movie.quality}
            </span>
            {movie.isSeries && movie.episode && (
              <span className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-0.5 text-xs font-medium text-amber-300 backdrop-blur">
                {movie.episode}
              </span>
            )}
          </div>

          <div className="space-y-1 text-xs text-slate-300">
            <p>
              <span className="text-slate-500">Năm phát hành:</span>{" "}
              <span className="text-slate-100">{movie.year}</span>
            </p>
            {movie.country && (
              <p>
                <span className="text-slate-500">Quốc gia:</span>{" "}
                <span className="text-slate-100">{movie.country}</span>
              </p>
            )}
            {movie.genres && (
              <p>
                <span className="text-slate-500">Thể loại:</span>{" "}
                <span className="text-slate-100">
                  {movie.genres.join(", ")}
                </span>
              </p>
            )}
            {movie.duration && (
              <p>
                <span className="text-slate-500">
                  {movie.isSeries ? "Số tập" : "Thời lượng"}:
                </span>{" "}
                <span className="text-slate-100">{movie.duration}</span>
              </p>
            )}
            <p>
              <span className="text-slate-500">Ngôn ngữ:</span>{" "}
              <span className="text-slate-100">{movie.language}</span>
            </p>
          </div>

          <Link
            href={`/watch/${movie.slug}`}
            className="inline-flex w-full items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-black shadow-lg shadow-emerald-500/40 hover:bg-emerald-400"
          >
            ▶ Xem phim
          </Link>
        </aside>

        {/* Nội dung chính */}
        <main className="space-y-4">
          <header>
            <h1 className="text-xl font-semibold tracking-tight text-slate-50 sm:text-2xl">
              {movie.title}
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Giao diện chi tiết phim tham khảo theo phong cach mePhim, code lai bang
              Next.js.
            </p>
          </header>

          <section className="rounded-2xl bg-[#070b18] p-3 text-sm text-slate-200 ring-1 ring-white/5 sm:p-4">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Nội dung phim
            </h2>
            <p className="leading-relaxed text-slate-200">
              {movie.description ??
                "Chưa có nội dung mô tả. Đây là dữ liệu giả lập để minh họa giao diện."}
            </p>
          </section>

          <section className="rounded-2xl bg-[#070b18] p-3 text-xs ring-1 ring-white/5 sm:p-4">
            <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Thông tin thêm (demo)
            </h2>
            <ul className="space-y-1 text-slate-300">
              <li>• Đạo diễn: (demo)</li>
              <li>• Diễn viên: (demo)</li>
              <li>• Điểm IMDb: 8.x (giả lập)</li>
            </ul>
          </section>
        </main>
      </div>
    </div>
  );
}

