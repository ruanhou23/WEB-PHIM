export type Movie = {
  id: number;
  title: string;
  slug: string;
  poster: string;
  quality: string;
  language: string;
  year: number;
  isSeries?: boolean;
  episode?: string;
  genres?: string[];
  country?: string;
  duration?: string;
  description?: string;
};

export const movies: Movie[] = [
  {
    id: 1,
    title: "Quá Nhanh Quá Nguy Hiểm 9",
    slug: "fast-and-furious-9",
    poster: "/posters/fast9.jpg",
    quality: "HD",
    language: "Vietsub + Thuyết minh",
    year: 2021,
    isSeries: false,
    genres: ["Hành động", "Tội phạm"],
    country: "Mỹ",
    duration: "145 phút",
    description:
      "Dom Toretto và gia đình đối mặt với mối đe dọa nguy hiểm nhất từ trước đến nay: em trai thất lạc của Dom, Jakob.",
  },
  {
    id: 2,
    title: "Avengers: Endgame",
    slug: "avengers-endgame",
    poster: "/posters/endgame.jpg",
    quality: "FullHD",
    language: "Vietsub",
    year: 2019,
    isSeries: false,
    genres: ["Hành động", "Viễn tưởng"],
    country: "Mỹ",
    duration: "181 phút",
    description:
      "Sau cú búng tay của Thanos, các Avengers còn lại phải tìm cách đảo ngược mọi thứ và mang lại sự cân bằng cho vũ trụ.",
  },
  {
    id: 3,
    title: "Vincenzo",
    slug: "vincenzo",
    poster: "/posters/vincenzo.jpg",
    quality: "HD",
    language: "Vietsub",
    year: 2021,
    isSeries: true,
    episode: "Tập 20/20",
    genres: ["Tâm lý", "Hài hước"],
    country: "Hàn Quốc",
    duration: "20 tập",
    description:
      "Vincenzo Cassano, luật sư mafia người Hàn được nuôi dưỡng tại Ý, trở về Hàn Quốc để thu hồi vàng và vướng vào cuộc chiến pháp lý.",
  },
  {
    id: 4,
    title: "Demon Slayer: Kimetsu No Yaiba",
    slug: "demon-slayer",
    poster: "/posters/demon-slayer.jpg",
    quality: "HD",
    language: "Vietsub",
    year: 2020,
    isSeries: true,
    episode: "Tập 26/26",
    genres: ["Anime", "Hành động"],
    country: "Nhật Bản",
    duration: "26 tập",
    description:
      "Câu chuyện về Tanjiro Kamado trên hành trình trở thành kiếm sĩ diệt quỷ để cứu em gái và trả thù gia đình.",
  },
];

export function getMovieBySlug(slug: string): Movie | undefined {
  return movies.find((m) => m.slug === slug);
}

