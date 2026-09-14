import { NextResponse } from "next/server";

// Older clients receive a terminal error instead of calling the retired API.
export function GET() {
  return NextResponse.json(
    {
      error:
        "Collection name search is no longer available. Use a contract address.",
    },
    { status: 410, headers: { "Cache-Control": "no-store" } }
  );
}
