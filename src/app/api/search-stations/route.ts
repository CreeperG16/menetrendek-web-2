import { searchStations } from "menetrendek-api";
import { NextRequest, NextResponse } from "next/server";

// TODO: date selection, error handling
export async function GET(req: NextRequest) {
  //if (!req.nextUrl.searchParams.get("q")) return NextResponse;
  const result = await searchStations(req.nextUrl.searchParams.get("q") as string, { maxResults: 10 });
  const json = result.map((s) => s.json());
  return NextResponse.json({ status: 200, result: json });
}
