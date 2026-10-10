import type { OPhimMovie } from "../types/api";
import type { Movie } from "@/data/movies";

const DEFAULT_OPHIM_CDN = "https://phimimg.com";
const PLACEHOLDER_POSTER = "/posters/placeholder.jpg";

function rewriteLikelyBrokenAbsoluteUrl(urlString: string): string {
  try {
    const url = new URL(urlString);
    const isOphimHost = /(^|\.)(img\.)?ophim\.(live|com|cc)$/i.test(url.hostname);
    if (isOphimHost) {
      return urlString.replace(/^https?:\/\/(?:img\.)?ophim\.(?:live|com|cc)/i, DEFAULT_OPHIM_CDN);
    }
  } catch {
    return urlString;
  }
  return urlString;
}

function resolveOPhimPosterUrl(
  imagePath: string | undefined,
  cdnDomain: string = DEFAULT_OPHIM_CDN,
): string {
  if (!imagePath) return PLACEHOLDER_POSTER;
  const normalized = imagePath.trim();
  if (!normalized) return PLACEHOLDER_POSTER;
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return rewriteLikelyBrokenAbsoluteUrl(normalized);
  }
  const cleanPath = normalized.replace(/^\/+/, "");
  if (!cleanPath) return PLACEHOLDER_POSTER;

  const baseDomain = (cdnDomain || DEFAULT_OPHIM_CDN).trim().replace(/\/+$/, "");
  let origin = baseDomain;
  try {
    origin = new URL(baseDomain).origin;
  } catch {
    origin = DEFAULT_OPHIM_CDN;
  }

  if (cleanPath.startsWith("uploads/")) {
    return `${origin}/${cleanPath}`;
  }
  return `${origin}/uploads/movies/${cleanPath}`;
}

/**
 * Transform OPhim API movie data to app Movie format
 */
export function transformOPhimMovieToMovie(
  ophimMovie: OPhimMovie,
  cdnDomain?: string,
): Movie {
  // Generate a numeric ID from the _id string
  const numericId = ophimMovie._id
    ? parseInt(ophimMovie._id.replace(/[^0-9]/g, "").slice(-8)) || 0
    : 0;

  return {
    id: numericId,
    title: ophimMovie.name || ophimMovie.origin_name || "",
    slug: ophimMovie.slug || "",
    poster: resolveOPhimPosterUrl(
      ophimMovie.poster_url || ophimMovie.thumb_url,
      cdnDomain,
    ),
    quality: ophimMovie.quality || "HD",
    language: ophimMovie.lang || "Vietsub",
    year: ophimMovie.year || new Date().getFullYear(),
    isSeries:
      ophimMovie.type === "series" ||
      ophimMovie.type === "tvshows" ||
      ophimMovie.type === "hoathinh",
    episode:
      ophimMovie.episode_current && ophimMovie.episode_total
        ? `Tập ${ophimMovie.episode_current}/${ophimMovie.episode_total}`
        : ophimMovie.episode_current
          ? `Tập ${ophimMovie.episode_current}`
          : undefined,
    genres: ophimMovie.category?.map((cat) => cat.name) || [],
    country: ophimMovie.country?.map((c) => c.name).join(", ") || undefined,
    duration: ophimMovie.time || undefined,
    description: ophimMovie.content || undefined,
  };
}

/**
 * Transform array of OPhim movies to app Movie format
 */
export function transformOPhimMoviesToMovies(
  ophimMovies: OPhimMovie[],
  cdnDomain?: string,
): Movie[] {
  return ophimMovies.map((movie) => transformOPhimMovieToMovie(movie, cdnDomain));
}
