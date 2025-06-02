import { NextResponse } from "next/server";

export async function GET() {
  // Disable caching so the client always hits the edge/server
  const version = process.env.VERSION ?? "unknown";
  return NextResponse.json(
    { version },
    { headers: { "Cache-Control": "no-store, must-revalidate" } }
  );
}
