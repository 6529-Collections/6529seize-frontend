import { loadSanctionsSnapshot } from "@/lib/sanctions/sanctions-snapshot.server";

/** The exact canonical bytes behind the hash and CID shown on `/sanctions`. */
export const dynamic = "force-static";

export function GET(): Response {
  const { bytes } = loadSanctionsSnapshot();
  return new Response(bytes, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
    },
  });
}
