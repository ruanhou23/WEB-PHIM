import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const SECRET = process.env.PLAYER_SECRET ?? "mephim_secret_2025_xK9#pQ";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const slug = searchParams.get("slug") ?? "";
  const sv   = searchParams.get("sv")   ?? "0";
  const ep   = searchParams.get("ep")   ?? "0";
  const ts   = searchParams.get("ts")  ?? "0";

  const sig = crypto
    .createHmac("sha256", SECRET)
    .update(`${slug}:${sv}:${ep}:${ts}`)
    .digest("hex");

  return NextResponse.json({ sig }, {
    headers: { "Cache-Control": "no-store" },
  });
}
