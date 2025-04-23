import { NextResponse } from "next/server";

export async function GET() {
  // Disable caching so the client always hits the edge/server
  return NextResponse.json(
    { version: process.env.VERSION },
    { headers: { "Cache-Control": "no-store, must-revalidate" } }
  );
}
