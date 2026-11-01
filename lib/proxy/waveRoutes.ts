/**
 * Wave-id policy for `proxy.ts`.
 *
 * Wave routes stream an app shell (`app/waves/layout.tsx`, `loading.tsx`,
 * `app/messages/loading.tsx`) before their page can look the wave up, so the
 * status is already 200 by the time `notFound()` could run. Proxy cannot ask
 * the API either: server fetches go out anonymously once the wallet-auth
 * cookie expires, which would turn private waves and DMs into false 404s.
 *
 * What proxy can decide is syntax. The API mints wave ids with `randomUUID()`
 * (and the client already treats `/waves/<uuid>` as the concrete wave route),
 * so a value that is not UUID-shaped can never name a wave, public or private.
 * UUID-shaped ids are never judged here: they keep streaming the shell and
 * resolve client-side, whether or not the wave exists.
 */

/**
 * Internal route (`app/wave-not-found`) that proxy rewrites malformed wave
 * links to. Hyphens keep it clear of the `[user]` handle space (`\w{3,15}`).
 */
export const MALFORMED_WAVE_ROUTE = "/wave-not-found";

/** Any 8-4-4-4-12 hex id, matching the other UUID checks in the repo. */
const WAVE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** `/waves/<wave>` and `/messages/<wave>` (`app/{waves,messages}/[wave]`). */
const THREAD_ROUTE_PATTERN = /^\/(?:waves|messages)\/([^/]+)$/;

/** `/waves/<wave>/competitions` and `/waves/<wave>/competitions/<competition>`. */
const COMPETITION_ROUTE_PATTERNS: readonly RegExp[] = [
  /^\/waves\/([^/]+)\/competitions$/,
  /^\/waves\/([^/]+)\/competitions\/[^/]+$/,
];

/**
 * Static siblings of `[wave]`: `app/{waves,messages}/create`, and
 * `app/messages/encrypted` from the encrypted-messages work.
 */
const STATIC_THREAD_SEGMENTS: ReadonlySet<string> = new Set([
  "create",
  "encrypted",
]);

/**
 * Index routes whose page turns the legacy `?wave=<id>` link into the thread
 * route. That redirect streams after the shell, so it answers 200 with a
 * client-side refresh instead of a real redirect.
 */
const LEGACY_WAVE_QUERY_PATHS: ReadonlySet<string> = new Set([
  "/waves",
  "/messages",
]);

function isWaveId(segment: string): boolean {
  try {
    return WAVE_ID_PATTERN.test(decodeURIComponent(segment));
  } catch {
    // Malformed percent-encoding cannot decode to a UUID either.
    return false;
  }
}

function waveSegmentOf(pathname: string): string | undefined {
  const thread = THREAD_ROUTE_PATTERN.exec(pathname)?.[1];
  if (thread !== undefined) {
    return STATIC_THREAD_SEGMENTS.has(thread) ? undefined : thread;
  }
  for (const pattern of COMPETITION_ROUTE_PATTERNS) {
    const segment = pattern.exec(pathname)?.[1];
    if (segment !== undefined) {
      return segment;
    }
  }
  return undefined;
}

/**
 * True when the request names a wave through an id that cannot be a wave id:
 * the `[wave]` segment of a thread or competition route, or the legacy `?wave=`
 * value on `/waves` and `/messages`. `pathname` has no trailing slash.
 * `?drop=` and `?serialNo=` are not judged: they are read client-side on any
 * page, the API accepts a UUID or a serial number for a drop, and the wave
 * itself still exists.
 */
export function hasMalformedWaveId(
  pathname: string,
  searchParams: URLSearchParams
): boolean {
  const segment = waveSegmentOf(pathname);
  if (segment !== undefined) {
    return !isWaveId(segment);
  }

  if (!LEGACY_WAVE_QUERY_PATHS.has(pathname)) {
    return false;
  }
  const legacyWaveId = searchParams.get("wave");
  // An empty value is falsy for the page, which then renders the index.
  return (
    legacyWaveId !== null && legacyWaveId !== "" && !isWaveId(legacyWaveId)
  );
}
