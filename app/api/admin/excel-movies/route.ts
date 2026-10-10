import { NextRequest, NextResponse } from "next/server";
import {
    saveExcelFile,
    parseExcelMovies,
    hasExcelFile,
    deleteExcelFile,
    generateSampleExcel,
    generateSampleCsv,
    loadHiddenMovies,
    toggleMovieVisibility,
} from "@/lib/api/excel-movies";

/**
 * GET  /api/admin/excel-movies
 * Returns the parsed movie list from the uploaded Excel file.
 * Query params:
 *   ?action=sample   → download sample Excel file
 *   ?page=1&limit=24 → paginated movie list
 */
export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;

    // Download sample file
    if (searchParams.get("action") === "sample") {
        const format = searchParams.get("format");
        if (format === "csv") {
            const csv = generateSampleCsv();
            return new NextResponse(csv, {
                status: 200,
                headers: {
                    "Content-Type": "text/csv; charset=utf-8",
                    "Content-Disposition": 'attachment; filename="movies_sample.csv"',
                },
            });
        }
        const buffer = generateSampleExcel();
        return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
                "Content-Type":
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": 'attachment; filename="movies_sample.xlsx"',
            },
        });
    }

    if (!hasExcelFile()) {
        return NextResponse.json({
            success: true,
            data: { items: [], totalItems: 0, page: 1, totalPages: 0 },
        });
    }

    try {
        const allMovies = parseExcelMovies();
        const hidden = loadHiddenMovies();
        const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
        const limit = Math.max(1, Number(searchParams.get("limit") ?? "24"));
        const keyword = (searchParams.get("keyword") ?? "").trim().toLowerCase();

        let filtered = allMovies;
        if (keyword) {
            filtered = allMovies.filter(
                (m) =>
                    m.name.toLowerCase().includes(keyword) ||
                    m.info.toLowerCase().includes(keyword),
            );
        }

        const totalItems = filtered.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / limit));
        const start = (page - 1) * limit;
        const items = filtered.slice(start, start + limit).map((m) => ({
            ...m,
            hidden: hidden.has(m.name),
        }));

        return NextResponse.json({
            success: true,
            data: { items, totalItems, page, totalPages },
        });
    } catch (e) {
        return NextResponse.json(
            {
                success: false,
                message: e instanceof Error ? e.message : "Lỗi đọc file Excel",
            },
            { status: 500 },
        );
    }
}

/**
 * POST /api/admin/excel-movies
 * Upload an Excel file (.xlsx / .xls)
 */
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { success: false, message: "Chưa chọn file" },
                { status: 400 },
            );
        }

        const validTypes = [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel",
            "text/csv",
        ];
        if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx?|csv)$/i)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Chỉ hỗ trợ file Excel (.xlsx, .xls) hoặc CSV (.csv)",
                },
                { status: 400 },
            );
        }

        const arrayBuffer = await file.arrayBuffer();
        saveExcelFile(Buffer.from(arrayBuffer), file.name);

        const movies = parseExcelMovies();
        return NextResponse.json({
            success: true,
            message: `Đã tải lên thành công ${movies.length} phim`,
            data: { totalItems: movies.length },
        });
    } catch (e) {
        return NextResponse.json(
            {
                success: false,
                message: e instanceof Error ? e.message : "Lỗi xử lý file",
            },
            { status: 500 },
        );
    }
}

/**
 * DELETE /api/admin/excel-movies
 * Remove the uploaded Excel file
 */
export async function DELETE() {
    try {
        deleteExcelFile();
        return NextResponse.json({
            success: true,
            message: "Đã xóa file Excel",
        });
    } catch (e) {
        return NextResponse.json(
            {
                success: false,
                message: e instanceof Error ? e.message : "Lỗi xóa file",
            },
            { status: 500 },
        );
    }
}

/**
 * PATCH /api/admin/excel-movies
 * Toggle hidden state for a specific movie
 * Body: { name: string }
 */
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const movieName = body?.name;

        if (!movieName || typeof movieName !== "string") {
            return NextResponse.json(
                { success: false, message: "Thiếu tên phim" },
                { status: 400 },
            );
        }

        const isNowHidden = toggleMovieVisibility(movieName);
        return NextResponse.json({
            success: true,
            hidden: isNowHidden,
            message: isNowHidden
                ? `Đã ẩn phim "${movieName}"`
                : `Đã hiện phim "${movieName}"`,
        });
    } catch (e) {
        return NextResponse.json(
            {
                success: false,
                message: e instanceof Error ? e.message : "Lỗi cập nhật trạng thái",
            },
            { status: 500 },
        );
    }
}
