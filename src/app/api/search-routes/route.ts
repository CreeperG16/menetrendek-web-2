import { Station, searchRoutes } from "menetrendek-api";
import { NextRequest, NextResponse } from "next/server";

// TODO: date selection, error handling
export async function POST(req: NextRequest) {
  //if (!req.nextUrl.searchParams.get("q")) return NextResponse;

  const data = await req.json();

  const from = Station.fromJson(data.from);
  const to = Station.fromJson(data.to);

  const result = await searchRoutes(from, to, {});
  const json = result.map((s) => s.json());
  return NextResponse.json({ status: 200, result: json });
}
