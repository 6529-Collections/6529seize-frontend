/**
 * Static-path policy for `proxy.ts`.
 *
 * Proxy runs before Next serves `public/` and `_next/static`, so it cannot ask
 * the filesystem whether a path exists. These lists mirror `public/` instead;
 * `__tests__/lib/proxy/publicPaths.test.ts` fails when they drift.
 */

// Relative import, like other modules reachable from next.config.
import { VERSION_RELOAD_IMAGE_SRC } from "../../components/version-update/versionReloadImage";

/** Every committed root-level file in `public/`. */
export const ROOT_PUBLIC_FILES: ReadonlySet<string> = new Set([
  "/6529-black.svg",
  "/6529.png",
  "/6529.svg",
  "/6529Core.png",
  "/6529bgwhite.svg",
  "/6529io-banner.png",
  "/6529io.png",
  "/Art-Blocks-icon.jpg",
  "/Deca-art-icon.jpg",
  "/KnownOrigin-icon.jpg",
  "/Makersplace-icon.jpg",
  "/OnCyber-Icon.jpg",
  "/Seize_Logo.png",
  "/Seize_Logo_2.png",
  "/Seize_Logo_Glasses-nobeta.png",
  "/Seize_Logo_Glasses.png",
  "/Seize_Logo_Glasses_2-nobeta.png",
  "/Seize_Logo_Glasses_2.png",
  "/Seize_Logo_Glasses_2_old.png",
  "/Seize_Logo_Glasses_3.png",
  "/Seize_Logo_Glasses_old.png",
  "/SummerGlasses.svg",
  "/SuperRare-icon.jpg",
  "/add-image.png",
  "/add-image_w.png",
  "/app-store.png",
  "/barcode-scanner.png",
  "/bell.png",
  "/bell.svg",
  "/blur.png",
  "/calendar-google.png",
  "/calendar-ics.png",
  "/chat-bubble-bottom-center-text.png",
  "/chat-bubble-bottom-center-text.svg",
  "/chat-bubble-left-ellipsis.png",
  "/consolidation-icon.png",
  "/consolidation-icon_b.png",
  "/delegation-icon.png",
  "/discord.png",
  "/ens.html",
  "/ethereum-history.png",
  "/etherscan.png",
  "/etherscan_w.png",
  "/faq-profile.jpg",
  "/faq-waves-view.jpg",
  "/favicon-alt.png",
  "/favicon-alt.svg",
  "/favicon-staging.png",
  "/favicon-staging.svg",
  "/favicon.png",
  "/favicon.svg",
  "/foundation-icon.jpg",
  "/foundation.png",
  "/gammaio.jpg",
  "/github.png",
  "/github_w.png",
  "/glossary.json",
  "/goodvibes.webp",
  "/gradient-0.svg",
  "/gradient-100.svg",
  "/gradients-preview.png",
  "/help-index.json",
  "/home.png",
  "/home.svg",
  "/icon-192.png",
  "/icon-512-maskable.png",
  "/icon-512.png",
  "/intern-no-bg.png",
  "/intern.png",
  "/jump.svg",
  "/linktree-logo-icon.svg",
  "/linux.png",
  "/llms.txt",
  "/looksrare.png",
  "/macos.png",
  "/magiceden.png",
  "/magiceden.svg",
  "/manager-icon.png",
  "/manifold.png",
  "/manifold.svg",
  "/meme-lab.jpg",
  "/memelab.png",
  "/memes-preview.png",
  "/museum.png",
  "/nakamoto-card-og.png",
  "/nextgen-logo.png",
  "/nextgen-placeholder.png",
  "/nextgen.png",
  "/nftdelegation.jpg",
  "/opensea.png",
  "/pebbles-loading.jpeg",
  "/pepe-smile.png",
  "/pepe-xglasses.png",
  "/pepewtf.png",
  "/play-store.png",
  "/primary_address.csv",
  "/question.png",
  "/rarible.svg",
  "/re-memes-b.jpeg",
  "/re-memes-w.jpeg",
  "/re-memes.png",
  "/robots.txt",
  "/rocket-refresh-small.png",
  "/rocket-refresh.png",
  "/sgt_grimacing.webp",
  "/superrare-icon.png",
  "/test-wave-icon.png",
  "/the-memes-4.jpeg",
  "/timezones.png",
  "/transient.avif",
  "/transient.png",
  "/twitter.png",
  "/twitter2.png",
  "/watermark.png",
  "/windows.png",
  "/x_black.png",
  // Content-hashed reload cover artwork; the generator renames it, so the
  // entry follows its constant instead of a hand-copied file name.
  VERSION_RELOAD_IMAGE_SRC,
]);

/**
 * The only dot-prefixed paths a route serves (`app/.well-known/*`). They skip
 * the staging gate because Apple's CDN fetches them without cookies. Add
 * `/.well-known/assetlinks.json` here with its route once Android App Links
 * have the app's signing-certificate fingerprint.
 */
export const SERVED_WELL_KNOWN_PATHS: ReadonlySet<string> = new Set([
  "/.well-known/apple-app-site-association",
]);

/**
 * Root-level paths kept ungated although no committed `public/` file backs
 * them: the generated favicon and Next's `app/apple-icon.png` and
 * `app/manifest.ts` metadata routes. All three carry public branding only.
 */
const GENERATED_ROOT_STATIC_PATHS: ReadonlySet<string> = new Set([
  "/apple-icon.png",
  "/favicon.ico",
  "/manifest.webmanifest",
]);

const SITEMAP_PREFIX = "/sitemap";
const SITEMAP_EXTENSION = ".xml";
const SITEMAP_SUFFIX_PATTERN = /^-[\w-]+$/;

/**
 * Top-level `public/` directories whose images pass the staging gate. Next's
 * image optimizer fetches local images internally without the visitor's
 * cookies, so gating them would break `next/image` on staging.
 */
export const PUBLIC_IMAGE_DIRECTORIES: ReadonlySet<string> = new Set([
  "artwork",
  "artwork-documentation",
  "delegation-content",
  "emojis",
  "home",
  "museum",
  "nextgen",
  "pebbles",
  "profile-cms",
]);

const PUBLIC_IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".svg",
  ".webp",
] as const;

/**
 * Route families that bypass the staging gate as a whole segment. `/e2ee`
 * holds the content-hashed OpenMLS WebAssembly module of encrypted chats
 * (built by `6529 run build:mls-wasm`); it is public code the loader checks
 * against a bundled SHA-256 before use.
 */
const STATIC_SEGMENT_PREFIXES = [
  "/api",
  "/_next",
  "/pdfjs",
  "/e2ee",
  "/error",
] as const;

/** `next-sitemap` writes `/sitemap.xml` and `/sitemap-<n>.xml` after builds. */
function isGeneratedSitemapPath(pathname: string): boolean {
  if (
    !pathname.startsWith(SITEMAP_PREFIX) ||
    !pathname.endsWith(SITEMAP_EXTENSION)
  ) {
    return false;
  }
  const suffix = pathname.slice(
    SITEMAP_PREFIX.length,
    -SITEMAP_EXTENSION.length
  );
  return suffix === "" || SITEMAP_SUFFIX_PATTERN.test(suffix);
}

function hasSegmentPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function isPublicDirectoryImage(pathname: string): boolean {
  const separator = pathname.indexOf("/", 1);
  if (separator === -1) {
    return false;
  }

  const directory = pathname.slice(1, separator);
  const lowerPathname = pathname.toLowerCase();
  return (
    PUBLIC_IMAGE_DIRECTORIES.has(directory) &&
    PUBLIC_IMAGE_EXTENSIONS.some((extension) =>
      lowerPathname.endsWith(extension)
    )
  );
}

function isDotPrefixedSegment(segment: string): boolean {
  return segment.startsWith(".") || segment.toLowerCase().startsWith("%2e");
}

/**
 * True for paths no route or public file can serve: any dot-prefixed segment
 * such as `/.git/HEAD`, `/.env` or `/.well-known/security.txt`, except the
 * exact `SERVED_WELL_KNOWN_PATHS`. The contract test checks that `public/` and
 * `app/` have no other dot-prefixed entries.
 */
export function isUnservableDotPath(pathname: string): boolean {
  return (
    !SERVED_WELL_KNOWN_PATHS.has(pathname) &&
    pathname.split("/").some(isDotPrefixedSegment)
  );
}

const RETIRED_REVIEW_DATA_SEGMENT = "/review-data";

function decodePathname(pathname: string): string {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
}

/**
 * True for `/review-data`, the namespace of the removed public contract
 * review's generated files. The path is decoded, lower-cased and stripped of
 * repeated slashes first, so every spelling of an old link gets the same 404.
 */
export function isRetiredReviewDataPath(pathname: string): boolean {
  const normalized = decodePathname(pathname)
    .toLowerCase()
    .replaceAll(/\/{2,}/g, "/");
  return hasSegmentPrefix(normalized, RETIRED_REVIEW_DATA_SEGMENT);
}

/**
 * True for real static responses that skip the staging access gate. Matching
 * is anchored to known files, `public/` image directories and whole route
 * segments, so an app route ending in `.png` stays gated.
 */
export function isStaticAssetPath(pathname: string): boolean {
  return (
    ROOT_PUBLIC_FILES.has(pathname) ||
    GENERATED_ROOT_STATIC_PATHS.has(pathname) ||
    SERVED_WELL_KNOWN_PATHS.has(pathname) ||
    isGeneratedSitemapPath(pathname) ||
    STATIC_SEGMENT_PREFIXES.some((prefix) =>
      hasSegmentPrefix(pathname, prefix)
    ) ||
    isPublicDirectoryImage(pathname)
  );
}
