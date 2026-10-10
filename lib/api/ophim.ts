import type {
  OPhimHomeResponse,
  OPhimMovie,
  OPhimMovieImage,
  OPhimGenreResponse,
  OPhimGenre,
  OPhimListResponse,
  OPhimCountryResponse,
  OPhimCountry,
  OPhimYearResponse,
  OPhimMovieDetailResponse,
  OPhimMovieImagesResponse,
  OPhimMoviePeoplesResponse,
  OPhimMovieKeywordsResponse,
} from "../types/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_MOVIE_API_BASE_URL || "https://phimapi.com/v1/api";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

type QueryParams = Record<string, string | number | boolean | undefined>;
type TmdbImageSize =
  | "original"
  | "w1280"
  | "w780"
  | "w342"
  | "w300"
  | "w185"
  | string;

function buildQuery(params?: QueryParams): string {
  if (!params) return "";
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.append(key, String(value));
    }
  });
  const q = search.toString();
  return q ? `?${q}` : "";
}

export function isApiSuccess(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  if (obj.status === "success" || obj.status === true || obj.status === "true" || obj.status === 1) {
    return true;
  }
  if (obj.success === true || obj.success === "true") {
    return true;
  }
  if (obj.status !== "error" && obj.status !== false && obj.data !== undefined) {
    return true;
  }
  return false;
}

export function getApiErrorMessage(data: unknown, fallback = "Unknown error"): string {
  if (!data || typeof data !== "object") return fallback;
  const obj = data as Record<string, unknown>;
  if (typeof obj.message === "string" && obj.message.trim()) {
    return obj.message.trim();
  }
  if (typeof obj.msg === "string" && obj.msg.trim() && obj.msg !== "done") {
    if (obj.msg === "hmmm!") return "Không tìm thấy dữ liệu phù hợp";
    return obj.msg.trim();
  }
  return fallback;
}

/**
 * Fetch home page data from ophim1.com API
 * @returns Promise with home page data containing movies list
 */
export async function getHomeData(): Promise<OPhimHomeResponse> {
  const url = `${API_BASE_URL}/home`;
  const options: RequestInit = {
    method: "GET",
    headers: {
      accept: "application/json",
    },
    // Add cache revalidation for Next.js
    next: {
      revalidate: 3600, // Revalidate every hour
    },
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`
      );
    }

    const data: OPhimHomeResponse = await response.json();

    if (!isApiSuccess(data)) {
      throw new Error(
        `API returned error: ${getApiErrorMessage(data)}`
      );
    }

    (data as any).status = "success";
    return data;
  } catch (error) {
    console.error("Error fetching home data:", error);
    throw error;
  }
}

/**
 * Get movies from home data
 * @returns Array of movies from home page
 */
export async function getHomeMovies(): Promise<OPhimMovie[]> {
  try {
    const homeData = await getHomeData();
    return homeData.data.items || [];
  } catch (error) {
    console.error("Error fetching home movies:", error);
    return [];
  }
}

/**
 * Client-side fetch function (for use in React components)
 * Use this when fetching from client components
 */
export async function fetchHomeDataClient(): Promise<OPhimHomeResponse> {
  const url = `${API_BASE_URL}/home`;
  const options: RequestInit = {
    method: "GET",
    headers: {
      accept: "application/json",
    },
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`
      );
    }

    const data: OPhimHomeResponse = await response.json();

    if (!isApiSuccess(data)) {
      throw new Error(
        `API returned error: ${getApiErrorMessage(data)}`
      );
    }

    (data as any).status = "success";
    return data;
  } catch (error) {
    console.error("Error fetching home data:", error);
    throw error;
  }
}

/**
 * Fetch all genres (thể loại) from ophim1.com API
 * @returns Array of genres with slug & name
 */
export async function getGenres(): Promise<OPhimGenre[]> {
  const url = `${API_BASE_URL}/the-loai`;
  const options: RequestInit = {
    method: "GET",
    headers: {
      accept: "application/json",
    },
    next: {
      revalidate: 3600,
    },
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`,
      );
    }

    const data: OPhimGenreResponse = await response.json();

    if (!isApiSuccess(data)) {
      throw new Error(
        `API returned error: ${getApiErrorMessage(data)}`,
      );
    }

    const rawData = data.data as any;
    return Array.isArray(rawData) ? rawData : rawData?.items || [];
  } catch (error) {
    console.error("Error fetching genres:", error);
    throw error;
  }
}

/**
 * Client-side fetch for genres
 */
export async function fetchGenresClient(): Promise<OPhimGenre[]> {
  const url = `${API_BASE_URL}/the-loai`;
  const options: RequestInit = {
    method: "GET",
    headers: {
      accept: "application/json",
    },
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`,
      );
    }

    const data: OPhimGenreResponse = await response.json();

    if (!isApiSuccess(data)) {
      throw new Error(
        `API returned error: ${getApiErrorMessage(data)}`,
      );
    }

    const rawData = data.data as any;
    return Array.isArray(rawData) ? rawData : rawData?.items || [];
  } catch (error) {
    console.error("Error fetching genres:", error);
    throw error;
  }
}

/**
 * Fetch movie lists by slug (danh-sach/[slug])
 * Ví dụ: phim-le, phim-bo, phim-moi, phim-hot,...
 */
export async function getListBySlug(
  slug: string,
  params?: QueryParams,
): Promise<OPhimListResponse> {
  const normalizedSlug = slug === "phim-hot" ? "phim-moi-cap-nhat" : slug;
  const url = `${API_BASE_URL}/danh-sach/${encodeURIComponent(
    normalizedSlug,
  )}${buildQuery(params)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { accept: "application/json" },
    next: { revalidate: 600 },
  });

  if (!res.ok) {
    throw new Error(`API request failed: ${res.status} ${res.statusText}`);
  }

  const data: OPhimListResponse = await res.json();
  if (!isApiSuccess(data)) {
    throw new Error(getApiErrorMessage(data));
  }
  (data as any).status = "success";
  return data;
}

/**
 * Search movies by keyword: tim-kiem?keyword=[keyword]
 */
export async function searchMovies(
  keyword: string,
  params?: QueryParams,
): Promise<OPhimListResponse> {
  const query = buildQuery({ keyword, ...params });
  const url = `${API_BASE_URL}/tim-kiem${query}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { accept: "application/json" },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`API request failed: ${res.status} ${res.statusText}`);
  }

  const data: OPhimListResponse = await res.json();
  if (!isApiSuccess(data)) {
    throw new Error(getApiErrorMessage(data));
  }
  (data as any).status = "success";
  return data;
}

/**
 * Fetch all countries (quoc-gia)
 */
export async function getCountries(): Promise<OPhimCountry[]> {
  const url = `${API_BASE_URL}/quoc-gia`;
  const res = await fetch(url, {
    method: "GET",
    headers: { accept: "application/json" },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`API request failed: ${res.status} ${res.statusText}`);
  }

  const data: OPhimCountryResponse = await res.json();
  if (!isApiSuccess(data)) {
    throw new Error(getApiErrorMessage(data));
  }
  const rawData = data.data as any;
  return Array.isArray(rawData) ? rawData : rawData?.items || [];
}

export async function fetchCountriesClient(): Promise<OPhimCountry[]> {
  const url = `${API_BASE_URL}/quoc-gia`;
  const res = await fetch(url, {
    method: "GET",
    headers: { accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`API request failed: ${res.status} ${res.statusText}`);
  }

  const data: OPhimCountryResponse = await res.json();
  if (!isApiSuccess(data)) {
    throw new Error(getApiErrorMessage(data));
  }
  const rawData = data.data as any;
  return Array.isArray(rawData) ? rawData : rawData?.items || [];
}

/**
 * Movies by genre: the-loai/[slug]
 */
export async function getMoviesByGenre(
  slug: string,
  params?: QueryParams,
): Promise<OPhimListResponse> {
  const url = `${API_BASE_URL}/the-loai/${encodeURIComponent(
    slug,
  )}${buildQuery(params)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { accept: "application/json" },
    next: { revalidate: 600 },
  });

  if (!res.ok) {
    throw new Error(`API request failed: ${res.status} ${res.statusText}`);
  }

  const data: OPhimListResponse = await res.json();
  if (!isApiSuccess(data)) {
    throw new Error(getApiErrorMessage(data));
  }
  (data as any).status = "success";
  return data;
}

/**
 * Movies by country: quoc-gia/[slug]
 */
export async function getMoviesByCountry(
  slug: string,
  params?: QueryParams,
): Promise<OPhimListResponse> {
  const url = `${API_BASE_URL}/quoc-gia/${encodeURIComponent(
    slug,
  )}${buildQuery(params)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { accept: "application/json" },
    next: { revalidate: 600 },
  });

  if (!res.ok) {
    throw new Error(`API request failed: ${res.status} ${res.statusText}`);
  }

  const data: OPhimListResponse = await res.json();
  if (!isApiSuccess(data)) {
    throw new Error(getApiErrorMessage(data));
  }
  (data as any).status = "success";
  return data;
}

/**
 * All years: nam-phat-hanh
 */
export async function getYears(): Promise<Array<number | string>> {
  const url = `${API_BASE_URL}/nam-phat-hanh`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const data: OPhimYearResponse = await res.json();
      if (isApiSuccess(data) && Array.isArray(data.data) && data.data.length > 0) {
        return data.data;
      }
    }
  } catch {
    // Fallback below
  }

  const currentYear = new Date().getFullYear();
  return Array.from({ length: 25 }, (_, i) => currentYear - i);
}

/**
 * Movies by year: nam-phat-hanh/[year]
 */
export async function getMoviesByYear(
  year: number | string,
  params?: QueryParams,
): Promise<OPhimListResponse> {
  const url = `${API_BASE_URL}/nam-phat-hanh/${encodeURIComponent(
    String(year),
  )}${buildQuery(params)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { accept: "application/json" },
    next: { revalidate: 600 },
  });

  if (!res.ok) {
    throw new Error(`API request failed: ${res.status} ${res.statusText}`);
  }

  const data: OPhimListResponse = await res.json();
  if (!isApiSuccess(data)) {
    throw new Error(getApiErrorMessage(data));
  }
  (data as any).status = "success";
  return data;
}

/**
 * Movie detail: phim/[slug]
 */
export async function getMovieDetail(
  slug: string,
): Promise<OPhimMovieDetailResponse> {
  const url = `${API_BASE_URL}/phim/${encodeURIComponent(slug)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { accept: "application/json" },
    next: { revalidate: 600 },
  });

  let data: OPhimMovieDetailResponse | null = null;
  try {
    data = (await res.json()) as OPhimMovieDetailResponse;
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new Error(
      getApiErrorMessage(data, `API request failed: ${res.status} ${res.statusText}`)
    );
  }

  if (!data) {
    throw new Error("Invalid movie detail response");
  }

  if (!isApiSuccess(data)) {
    throw new Error(getApiErrorMessage(data));
  }

  (data as any).status = "success";

  // Normalize payload so UI can always read from `data.item`.
  if (!data.data.item && data.data.movie) {
    data.data.item = data.data.movie;
  }

  if (data.data.item) {
    if (
      Array.isArray((data.data as any).episodes) &&
      (!Array.isArray(data.data.item.episodes) || data.data.item.episodes.length === 0)
    ) {
      data.data.item.episodes = (data.data as any).episodes;
    }
  }

  if (!data.data.item) {
    throw new Error("Movie detail is missing item");
  }

  return data;
}

export async function getMovieImages(
  slug: string,
): Promise<OPhimMovieImagesResponse> {
  const url = `${API_BASE_URL}/phim/${encodeURIComponent(slug)}/images`;
  const res = await fetch(url, {
    method: "GET",
    headers: { accept: "application/json" },
    next: { revalidate: 3600 },
  });

  let rawData: unknown = null;
  try {
    rawData = await res.json();
  } catch {
    rawData = null;
  }

  if (!res.ok) {
    const message = getApiErrorMessage(
      rawData,
      `API request failed: ${res.status} ${res.statusText}`,
    );
    throw new Error(message);
  }

  const dataObj = (rawData ?? {}) as Record<string, unknown>;
  const success = isApiSuccess(dataObj);
  const message = getApiErrorMessage(dataObj);
  const payload =
    dataObj.data && typeof dataObj.data === "object"
      ? (dataObj.data as Record<string, unknown>)
      : {};

  if (!success) {
    throw new Error(message);
  }

  const images = Array.isArray(payload.images) ? payload.images : [];
  const normalized: OPhimMovieImagesResponse = {
    success: true,
    message,
    data: {
      tmdb_id: payload.tmdb_id as number | string | undefined,
      tmdb_type: payload.tmdb_type as string | undefined,
      ophim_id: payload.ophim_id as string | undefined,
      slug: payload.slug as string | undefined,
      imdb_id: payload.imdb_id as string | undefined,
      image_sizes: payload.image_sizes as
        | OPhimMovieImagesResponse["data"]["image_sizes"]
        | undefined,
      images: images as OPhimMovieImagesResponse["data"]["images"],
    },
  };

  return normalized;
}

/**
 * Alias for /v1/api/phim/[slug]/images endpoint.
 * This matches common naming in REST client examples.
 */
export async function getMovieImagesBySlug(
  slug: string,
): Promise<OPhimMovieImagesResponse> {
  return getMovieImages(slug);
}

/**
 * Build TMDB image URL from file_path and size.
 */
export function buildTmdbImageUrl(
  filePath: string,
  size: TmdbImageSize = "original",
): string {
  if (!filePath) return "";
  const normalizedPath = filePath.startsWith("/") ? filePath : `/${filePath}`;
  return `${TMDB_IMAGE_BASE_URL}/${size}${normalizedPath}`;
}

/**
 * Helper for getting URL directly from OPhim movie image object.
 */
export function getTmdbImageUrlFromItem(
  image: Pick<OPhimMovieImage, "file_path"> | null | undefined,
  size: TmdbImageSize = "w780",
): string {
  if (!image?.file_path) return "";
  return buildTmdbImageUrl(image.file_path, size);
}

export async function getMoviePeoples(
  slug: string,
): Promise<OPhimMoviePeoplesResponse> {
  const url = `${API_BASE_URL}/phim/${encodeURIComponent(slug)}/peoples`;
  const res = await fetch(url, {
    method: "GET",
    headers: { accept: "application/json" },
    next: { revalidate: 3600 },
  });

  let data: OPhimMoviePeoplesResponse | null = null;
  try {
    data = (await res.json()) as OPhimMoviePeoplesResponse;
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new Error(
      getApiErrorMessage(data, `API request failed: ${res.status} ${res.statusText}`),
    );
  }

  if (!data) {
    data = {};
  }

  const isError = !isApiSuccess(data);
  if (isError) {
    throw new Error(getApiErrorMessage(data));
  }

  const normalizedData = data.data ?? { peoples: [] };
  normalizedData.peoples = Array.isArray(normalizedData.peoples)
    ? normalizedData.peoples
    : [];

  data.success = true;
  (data as any).status = "success";
  data.data = normalizedData;
  return data;
}

export async function getMovieKeywords(
  slug: string,
): Promise<OPhimMovieKeywordsResponse> {
  const url = `${API_BASE_URL}/phim/${encodeURIComponent(slug)}/keywords`;
  const res = await fetch(url, {
    method: "GET",
    headers: { accept: "application/json" },
    next: { revalidate: 3600 },
  });

  let data: OPhimMovieKeywordsResponse | null = null;
  try {
    data = (await res.json()) as OPhimMovieKeywordsResponse;
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new Error(
      getApiErrorMessage(data, `API request failed: ${res.status} ${res.statusText}`),
    );
  }

  if (!data || !isApiSuccess(data)) {
    throw new Error(getApiErrorMessage(data));
  }
  (data as any).status = "success";
  return data;
}
