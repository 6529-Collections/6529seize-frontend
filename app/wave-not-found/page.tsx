import { notFound } from "next/navigation";
import { connection } from "next/server";

/**
 * Rewrite target for wave links whose id cannot be a wave id (`proxy.ts`,
 * `lib/proxy/waveRoutes.ts`). It sits outside `app/waves` and
 * `app/messages` so no `loading.tsx` or layout `Suspense` streams a shell
 * first: `notFound()` renders the root `app/not-found.tsx` with a real 404.
 * A test keeps streaming boundaries off this path.
 */
export default async function MalformedWaveRoute(): Promise<never> {
  await connection();
  notFound();
}
