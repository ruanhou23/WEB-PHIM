// Types for ophim1.com API responses

export interface OPhimCategory {
  id: string;
  name: string;
  slug: string;
}

export interface OPhimCountry {
  id: string;
  name: string;
  slug: string;
}

export interface OPhimMovie {
  _id: string;
  name: string;
  slug: string;
  origin_name: string;
  alternative_names?: string[];
  type: string;
  thumb_url: string;
  poster_url: string;
  year: number;
  category: OPhimCategory[];
  country: OPhimCountry[];
  // Optional fields that may exist
  content?: string;
  status?: string;
  is_copyright?: boolean;
  sub_docquyen?: boolean;
  chieurap?: boolean;
  trailer_url?: string;
  time?: string;
  episode_current?: string;
  episode_total?: string;
  quality?: string;
  lang?: string;
  lang_key?: string[];
  notify?: string;
  showtimes?: string;
  view?: number;
  actor?: string[];
  director?: string[];
  tmdb?: {
    type?: string;
    id?: string | number;
    vote_average?: number;
    vote_count?: number;
    [key: string]: unknown;
  };
  imdb?: {
    id?: string;
    vote_average?: number;
    vote_count?: number;
    [key: string]: unknown;
  };
  updatedAt?: string;
  createdAt?: string;
}

export interface OPhimPagination {
  currentPage: number;
  totalItems: number;
  totalItemsPerPage: number;
}

export interface OPhimSeoOnPage {
  titleHead: string;
  descriptionHead: string;
}

export interface OPhimHomeData {
  seoOnPage: OPhimSeoOnPage;
  items: OPhimMovie[];
  params: {
    pagination: OPhimPagination;
  };
  APP_DOMAIN_CDN_IMAGE: string;
  APP_DOMAIN_FRONTEND: string;
}

export interface OPhimHomeResponse {
  status: "success" | "error" | boolean;
  message?: string;
  msg?: string;
  data: OPhimHomeData;
}

export interface OPhimGenre {
  _id: string;
  slug: string;
  name: string;
}

export interface OPhimGenreResponse {
  status: "success" | "error" | boolean;
  message?: string;
  msg?: string;
  data: OPhimGenre[];
}

// Generic list response (danh-sach, the-loai/[slug], quoc-gia/[slug], nam-phat-hanh/[year], tim-kiem)
export interface OPhimListData<T = OPhimMovie> {
  items: T[];
  params?: {
    pagination?: OPhimPagination;
    slug?: string;
    keyword?: string;
    [key: string]: unknown;
  };
}

export interface OPhimListResponse<T = OPhimMovie> {
  status: "success" | "error" | boolean;
  message?: string;
  msg?: string;
  data: OPhimListData<T>;
}

export interface OPhimCountryResponse {
  status: "success" | "error" | boolean;
  message?: string;
  msg?: string;
  data: OPhimCountry[];
}

export interface OPhimYearResponse {
  status: "success" | "error" | boolean;
  message?: string;
  msg?: string;
  data: Array<number | string>;
}

export interface OPhimMovieDetailResponse {
  status: "success" | "error" | boolean;
  message?: string;
  msg?: string;
  data: {
    item: OPhimMovie & {
      episodes?: OPhimEpisodeServer[];
    };
    // Backward compatibility: some responses may still return `movie`
    movie?: OPhimMovie;
    // Backward compatibility: some responses may still return episodes at root
    episodes?: OPhimEpisodeServer[];
    seoOnPage?: OPhimSeoOnPage & Record<string, unknown>;
    breadCrumb?: OPhimBreadCrumbItem[];
    [key: string]: unknown;
  };
}

export interface OPhimEpisodeItem {
  name: string;
  slug: string;
  filename?: string;
  link_embed?: string;
  link_m3u8?: string;
  [key: string]: unknown;
}

export interface OPhimEpisodeServer {
  server_name: string;
  is_ai?: boolean;
  server_data: OPhimEpisodeItem[];
  [key: string]: unknown;
}

export interface OPhimBreadCrumbItem {
  name: string;
  slug?: string;
  isCurrent?: boolean;
  position?: number;
  [key: string]: unknown;
}

export interface OPhimImageSizeMap {
  original?: string;
  w1280?: string;
  w780?: string;
  w342?: string;
  w300?: string;
  w185?: string;
  [key: string]: string | undefined;
}

export interface OPhimImageSizes {
  backdrop?: OPhimImageSizeMap;
  poster?: OPhimImageSizeMap;
  [key: string]: OPhimImageSizeMap | undefined;
}

export interface OPhimMovieImage {
  width: number;
  height: number;
  aspect_ratio: number;
  type: "backdrop" | "poster" | string;
  file_path: string;
}

export interface OPhimMovieImagesData {
  tmdb_id?: number | string;
  tmdb_type?: string;
  ophim_id?: string;
  slug?: string;
  imdb_id?: string;
  image_sizes?: OPhimImageSizes;
  images: OPhimMovieImage[];
  [key: string]: unknown;
}

export interface OPhimMovieImagesResponse {
  success: boolean;
  message: string;
  data: OPhimMovieImagesData;
}

export interface OPhimProfileSizes {
  h632?: string;
  original?: string;
  w185?: string;
  w45?: string;
  [key: string]: string | undefined;
}

export interface OPhimPeopleItem {
  tmdb_people_id?: number;
  adult?: boolean;
  gender?: number;
  gender_name?: string;
  name?: string;
  original_name?: string;
  character?: string;
  known_for_department?: string;
  profile_path?: string;
  [key: string]: unknown;
}

export interface OPhimMoviePeoplesData {
  tmdb_id?: number | string;
  tmdb_type?: string;
  ophim_id?: string;
  slug?: string;
  imdb_id?: string;
  profile_sizes?: OPhimProfileSizes;
  peoples: OPhimPeopleItem[];
  [key: string]: unknown;
}

export interface OPhimMoviePeoplesResponse {
  success?: boolean;
  status?: "success" | "error" | boolean;
  message?: string;
  msg?: string;
  data?: OPhimMoviePeoplesData;
}

export interface OPhimMovieKeywordsResponse {
  status?: "success" | "error" | boolean;
  success?: boolean;
  message?: string;
  msg?: string;
  data: unknown;
}
