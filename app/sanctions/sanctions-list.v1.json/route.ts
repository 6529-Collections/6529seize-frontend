import { loadSanctionsSnapshot } from "@/lib/sanctions/sanctions-snapshot.server";

/**
 * The exact canonical bytes behind the hash and CID shown on `/sanctions`.
 * They change only with a deploy, so the route is prerendered once.
 */
export const dynamic = "force-static";

export function GET(): Response {
  const { json } = loadSanctionsSnapshot();
  return new Response(json, {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
