import { NextRequest, NextResponse } from "next/server";
import {
    hasExcelFile,
    parseVisibleExcelMovies,
} from "@/lib/api/excel-movies";

/**
 * GET /api/public/excel-movies
 * Returns only visible (non-hidden) movies from the uploaded Excel/CSV.
 * Query params: ?page=1&limit=12&keyword=...
 */
export async function GET(request: NextRequest) {
    if (!hasExcelFile()) {
        return NextResponse.json({
            success: true,
            data: { items: [], totalItems: 0, page: 1, totalPages: 0 },
        });
    }

    try {
        const { searchParams } = request.nextUrl;
        const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
        const limit = Math.max(1, Number(searchParams.get("limit") ?? "12"));
        const keyword = (searchParams.get("keyword") ?? "").trim().toLowerCase();

        let movies = parseVisibleExcelMovies();

        if (keyword) {
            movies = movies.filter(
                (m) =>
                    m.name.toLowerCase().includes(keyword) ||
                    m.info.toLowerCase().includes(keyword),
            );
        }

        const totalItems = movies.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / limit));
        const start = (page - 1) * limit;
        const items = movies.slice(start, start + limit);

        return NextResponse.json({
            success: true,
            data: { items, totalItems, page, totalPages },
        });
    } catch (e) {
        return NextResponse.json(
            {
                success: false,
                message: e instanceof Error ? e.message : "Lỗi đọc dữ liệu phim",
            },
            { status: 500 },
        );
    }
}
