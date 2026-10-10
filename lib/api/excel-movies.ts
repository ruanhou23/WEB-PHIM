import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

export type ExcelMovie = {
    name: string;
    view: string | number;
    img: string;
    year: string | number;
    info: string;
    link: string;
};

const EXCEL_DATA_DIR = path.join(process.cwd(), "data", "excel");
const SUPPORTED_EXTENSIONS = [".xlsx", ".xls", ".csv"];
const HIDDEN_FILE_PATH = path.join(EXCEL_DATA_DIR, "hidden.json");

/**
 * Find the currently stored data file (could be .xlsx, .xls, or .csv)
 */
function getStoredFilePath(): string | null {
    for (const ext of SUPPORTED_EXTENSIONS) {
        const fp = path.join(EXCEL_DATA_DIR, `movies${ext}`);
        if (fs.existsSync(fp)) return fp;
    }
    return null;
}

/**
 * Ensure the data/excel directory exists
 */
function ensureDir() {
    if (!fs.existsSync(EXCEL_DATA_DIR)) {
        fs.mkdirSync(EXCEL_DATA_DIR, { recursive: true });
    }
}

/**
 * Save uploaded file buffer to disk, preserving the correct extension.
 * Cleans up any previously stored file with a different extension.
 */
export function saveExcelFile(buffer: Buffer, originalFileName?: string) {
    ensureDir();
    // Remove old files first
    for (const ext of SUPPORTED_EXTENSIONS) {
        const fp = path.join(EXCEL_DATA_DIR, `movies${ext}`);
        if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }
    // Determine extension from original filename
    const ext = originalFileName
        ? path.extname(originalFileName).toLowerCase()
        : ".xlsx";
    const finalExt = SUPPORTED_EXTENSIONS.includes(ext) ? ext : ".xlsx";
    fs.writeFileSync(path.join(EXCEL_DATA_DIR, `movies${finalExt}`), buffer);
}

/**
 * Check if an Excel file has been uploaded
 */
export function hasExcelFile(): boolean {
    return getStoredFilePath() !== null;
}

/**
 * Delete uploaded Excel file
 */
export function deleteExcelFile() {
    for (const ext of SUPPORTED_EXTENSIONS) {
        const fp = path.join(EXCEL_DATA_DIR, `movies${ext}`);
        if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }
}

/**
 * Parse the Excel file and return movie data
 */
export function parseExcelMovies(): ExcelMovie[] {
    const filePath = getStoredFilePath();
    if (!filePath) return [];

    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });

    // Read the first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return [];

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return [];

    // Convert to JSON – header row becomes keys
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
    });

    // Map columns (case-insensitive) to our ExcelMovie type
    const movies: ExcelMovie[] = rawRows.map((row) => {
        // Build a lowercased key map
        const lowerRow: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(row)) {
            lowerRow[k.toLowerCase().trim()] = v;
        }

        return {
            name: String(lowerRow["name"] ?? ""),
            view: typeof lowerRow["view"] === "number" ? lowerRow["view"] : String(lowerRow["view"] ?? 0),
            img: String(lowerRow["img"] ?? ""),
            year: typeof lowerRow["year"] === "number" ? lowerRow["year"] : String(lowerRow["year"] ?? ""),
            info: String(lowerRow["info"] ?? ""),
            link: String(lowerRow["link"] ?? ""),
        };
    });

    return movies.filter((m) => m.name.trim() !== "");
}

// ── Hidden movies management ──────────────────────────────────────────

/**
 * Load the set of hidden movie names from disk
 */
export function loadHiddenMovies(): Set<string> {
    try {
        if (fs.existsSync(HIDDEN_FILE_PATH)) {
            const raw = fs.readFileSync(HIDDEN_FILE_PATH, "utf-8");
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) return new Set(arr);
        }
    } catch { /* ignore corrupt file */ }
    return new Set();
}

/**
 * Save hidden movie names to disk
 */
function saveHiddenMovies(hidden: Set<string>) {
    ensureDir();
    fs.writeFileSync(HIDDEN_FILE_PATH, JSON.stringify([...hidden], null, 2), "utf-8");
}

/**
 * Toggle a movie's visibility. Returns the new hidden state (true = now hidden).
 */
export function toggleMovieVisibility(movieName: string): boolean {
    const hidden = loadHiddenMovies();
    if (hidden.has(movieName)) {
        hidden.delete(movieName);
        saveHiddenMovies(hidden);
        return false;
    } else {
        hidden.add(movieName);
        saveHiddenMovies(hidden);
        return true;
    }
}

/**
 * Check if a movie is hidden
 */
export function isMovieHidden(movieName: string): boolean {
    return loadHiddenMovies().has(movieName);
}

/**
 * Parse Excel/CSV and return only visible (non-hidden) movies
 */
export function parseVisibleExcelMovies(): ExcelMovie[] {
    const all = parseExcelMovies();
    const hidden = loadHiddenMovies();
    return all.filter((m) => !hidden.has(m.name));
}

/**
 * Generate a URL-friendly slug from a movie name
 */
export function movieNameToSlug(name: string): string {
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        || "untitled";
}

/**
 * Find a visible movie by its slug
 */
export function findVisibleMovieBySlug(slug: string): ExcelMovie | null {
    const movies = parseVisibleExcelMovies();
    return movies.find((m) => movieNameToSlug(m.name) === slug) ?? null;
}

/**
 * Get related visible movies (excluding the current one), limited
 */
export function getRelatedMovies(excludeName: string, limit = 8): ExcelMovie[] {
    const movies = parseVisibleExcelMovies();
    return movies.filter((m) => m.name !== excludeName).slice(0, limit);
}

// ── Series grouping ──────────────────────────────────────────────────

export type ExcelMovieSeries = {
    baseName: string;
    slug: string;
    episodes: ExcelMovie[];
    episodeCount: number;
    img: string;
    year: string | number;
    info: string;
    totalViews: number;
    isSeries: boolean; // true if more than 1 episode
};

/**
 * Extract the base name from a movie title by stripping trailing episode numbers.
 * Examples:
 *   "Imaria 1" -> "Imaria"
 *   "Fleur the animation 2" -> "Fleur the animation"
 *   "Shounen ga otona ni natta natsu 3" -> "Shounen ga otona ni natta natsu"
 *   "Ito o yoru" -> "Ito o yoru" (no trailing number, stays as-is)
 */
export function extractBaseName(name: string): { baseName: string; episodeNum: number } {
    const trimmed = name.trim();
    // Match trailing number, optionally preceded by space/dash/dot
    const match = trimmed.match(/^(.+?)[\s\-._]+(\d+)$/);
    if (match) {
        return { baseName: match[1].trim(), episodeNum: parseInt(match[2], 10) };
    }
    return { baseName: trimmed, episodeNum: 0 };
}

/**
 * Group visible movies into series. Movies sharing the same base name
 * (after stripping trailing episode number) are grouped together.
 * Single movies (no episode siblings) are returned as 1-episode series.
 */
export function groupMoviesIntoSeries(): ExcelMovieSeries[] {
    const movies = parseVisibleExcelMovies();
    const groupMap = new Map<string, { episodes: { movie: ExcelMovie; episodeNum: number }[] }>();

    for (const movie of movies) {
        const { baseName, episodeNum } = extractBaseName(movie.name);
        const key = baseName.toLowerCase();

        if (!groupMap.has(key)) {
            groupMap.set(key, { episodes: [] });
        }
        groupMap.get(key)!.episodes.push({ movie, episodeNum });
    }

    const seriesList: ExcelMovieSeries[] = [];

    for (const [, group] of groupMap) {
        // Sort episodes by episode number
        group.episodes.sort((a, b) => {
            if (a.episodeNum === 0 && b.episodeNum === 0) return 0;
            if (a.episodeNum === 0) return -1;
            if (b.episodeNum === 0) return -1;
            return a.episodeNum - b.episodeNum;
        });

        const firstEp = group.episodes[0].movie;
        const { baseName } = extractBaseName(firstEp.name);
        const totalViews = group.episodes.reduce(
            (sum, ep) => sum + (Number(ep.movie.view) || 0),
            0
        );

        // Use the first episode's image, or fall back through episodes to find one
        const imgEp = group.episodes.find((ep) => ep.movie.img) || group.episodes[0];
        // Use the first episode's info, or fall back
        const infoEp = group.episodes.find((ep) => ep.movie.info) || group.episodes[0];

        seriesList.push({
            baseName,
            slug: movieNameToSlug(baseName),
            episodes: group.episodes.map((ep) => ep.movie),
            episodeCount: group.episodes.length,
            img: imgEp.movie.img,
            year: firstEp.year,
            info: infoEp.movie.info,
            totalViews,
            isSeries: group.episodes.length > 1,
        });
    }

    // Sort by total views descending
    seriesList.sort((a, b) => b.totalViews - a.totalViews);

    return seriesList;
}

/**
 * Find a series by its base slug
 */
export function findSeriesBySlug(slug: string): ExcelMovieSeries | null {
    const allSeries = groupMoviesIntoSeries();
    return allSeries.find((s) => s.slug === slug) ?? null;
}

/**
 * Get related series for sidebar (excluding the current one)
 */
export function getRelatedSeriesList(excludeSlug: string, limit = 8): ExcelMovieSeries[] {
    const allSeries = groupMoviesIntoSeries();
    return allSeries.filter((s) => s.slug !== excludeSlug).slice(0, limit);
}

/**
 * Generate a sample Excel file for download
 */
export function generateSampleExcel(): Buffer {
    const sampleData = [
        {
            name: "Quá Nhanh Quá Nguy Hiểm 9",
            view: 15000,
            img: "https://img.ophim.live/uploads/movies/qua-nhanh-qua-nguy-hiem-9-poster.jpg",
            year: 2021,
            info: "Dom Toretto đối mặt với em trai thất lạc Jakob.",
            link: "https://example.com/fast-9",
        },
        {
            name: "Avengers: Endgame",
            view: 32000,
            img: "https://img.ophim.live/uploads/movies/avengers-endgame-poster.jpg",
            year: 2019,
            info: "Các Avengers tìm cách đảo ngược cú búng tay của Thanos.",
            link: "https://example.com/endgame",
        },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Movies");

    // Set column widths
    ws["!cols"] = [
        { wch: 30 }, // name
        { wch: 10 }, // view
        { wch: 60 }, // img
        { wch: 8 }, // year
        { wch: 50 }, // info
        { wch: 40 }, // link
    ];

    return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

/**
 * Generate a sample CSV string for download
 */
export function generateSampleCsv(): string {
    const header = "name,view,img,year,info,link";
    const rows = [
        '"Quá Nhanh Quá Nguy Hiểm 9",15000,"https://img.ophim.live/uploads/movies/qua-nhanh-qua-nguy-hiem-9-poster.jpg",2021,"Dom Toretto đối mặt với em trai thất lạc Jakob.","https://example.com/fast-9"',
        '"Avengers: Endgame",32000,"https://img.ophim.live/uploads/movies/avengers-endgame-poster.jpg",2019,"Các Avengers tìm cách đảo ngược cú búng tay của Thanos.","https://example.com/endgame"',
    ];
    return [header, ...rows].join("\n");
}
