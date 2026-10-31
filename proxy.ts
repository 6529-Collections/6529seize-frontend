import {
  getHomeRoute,
  getMessagesBaseRoute,
  getNotificationsRoute,
  getWaveRoute,
  getWavesBaseRoute,
} from "@/helpers/navigation.helpers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAccessVerdict, isStagingDeployment } from "@/lib/proxy/accessProbe";
import {
  plainNotFoundResponse,
  plainServiceUnavailableResponse,
} from "@/lib/proxy/plainResponses";
import {
  isRetiredReviewDataPath,
  isStaticAssetPath,
  isUnservableDotPath,
} from "@/lib/proxy/publicPaths";
import {
  createTdhListedDays,
  isImpossibleTdhVerificationDay,
  possibleTdhVerificationDay,
  tdhDayNotFoundTarget,
} from "@/lib/proxy/tdhVerificationDay";
import { getAppEnvironment } from "@/config/appEnvironment";
import { resolveVerificationSource } from "@/lib/tdh/verification/feedSource";
import {
  hasMalformedWaveId,
  MALFORMED_WAVE_ROUTE,
} from "@/lib/proxy/waveRoutes";
import { publicEnv } from "./config/env";
import { API_AUTH_COOKIE } from "./constants/constants";

const redirectMappings = [
  { url: "/6529-dubai/", target: "/" },
  { url: "/6529-puerto-rico/", target: "/" },
  { url: "/abc1/", target: "/" },
  { url: "/abc2/", target: "/" },
  { url: "/about/contact/", target: "/about/contact-us" },
  { url: "/about/jobs/", target: "/about/contact-us" },
  { url: "/about/news/", target: "/" },
  { url: "/bridge/", target: "/waves" },
  { url: "/collections/", target: "/the-memes" },
  { url: "/collections/6529gradient/", target: "/6529-gradient" },
  { url: "/collections/brand/", target: "/the-memes" },
  { url: "/collections/collections-form/", target: "/about/apply" },
  { url: "/collections/memelab/", target: "/meme-lab" },
  { url: "/collections/memelab/pepiano-allowlist/", target: "/meme-lab/8" },
  {
    url: "/collections/memelab/the-great-restoration/",
    target: "/meme-lab/12",
  },
  {
    url: "/collections/memelab/the-nftimes-issue-1-allowlist/",
    target: "/meme-lab/7",
  },
  { url: "/collections/memelab/wen-summer-allowlist/", target: "/meme-lab/10" },
  { url: "/collections/the-memes/", target: "/the-memes" },
  {
    url: "/collections/the-memes/evolution-allowlist/",
    target: "/the-memes/73",
  },
  {
    url: "/collections/the-memes/faces-of-freedom-allowlist/",
    target: "/the-memes/72",
  },
  {
    url: "/collections/the-memes/freedom-fighter-allowlist/",
    target: "/the-memes/77",
  },
  {
    url: "/collections/the-memes/meme4-season2-card6/gm-or-die-allowlist/",
    target: "/the-memes/71",
  },
  {
    url: "/collections/the-memes/metaverse-starter-pack-allowlist/",
    target: "/the-memes/78",
  },
  {
    url: "/collections/the-memes/no-meme-no-life-allowlist/",
    target: "/the-memes/75",
  },
  {
    url: "/collections/the-memes/staying-alive-allowlist/",
    target: "/the-memes/76",
  },
  {
    url: "/collections/the-memes/the-memes-season2/",
    target: "/the-memes?szn=2",
  },
  { url: "/education/something-else/", target: "/" },
  { url: "/privacy-policy/", target: "/about/privacy-policy" },
  { url: "/studio/", target: "/" },
  { url: "/the-hamily-wagmi-allowlist/", target: "/the-memes/74" },
  { url: "/om/om/", target: "/om" },
  { url: "/om/bug/report/", target: "/about/contact-us" },
];

// The access gate runs only on staging deployments, decided from the baked
// BASE_ENDPOINT so request headers such as Host cannot switch it off.
// Production and local development never call the API from proxy.
const ACCESS_GATE_ENABLED = isStagingDeployment(publicEnv.BASE_ENDPOINT);

/**
 * The TDH feed's index, for day permalinks inside the feed's range: a day
 * the index does not list gets the TDH not-found view with a real 404,
 * which the day page, streaming under `app/network/loading.tsx`, cannot
 * send. Same base URL as the pages' own loaders.
 */
const tdhListedDays = (() => {
  const source = resolveVerificationSource(
    publicEnv.NEXT_PUBLIC_TDH_VERIFICATION_BASE,
    getAppEnvironment(publicEnv.BASE_ENDPOINT).isProduction
  );
  return createTdhListedDays({
    indexUrl:
      source.kind === "remote"
        ? new URL("index.json", source.base).toString()
        : null,
  });
})();

/**
 * Proxy runs before Next serves `public/` and `_next/static`, so it cannot tell
 * whether a `/_next/*` file exists. Real `_next/static` and `_next/image`
 * requests skip proxy entirely; missing `/_next/*` files get a plain 404 from
 * the `afterFiles` rewrite in `next.config.ts`, which runs after real files.
 */
export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};

// The retired Stream review's files stay in `public/review-data` until the
// review is removed, but no host serves them: proxy runs before Next serves
// `public/`, so it answers them with a plain 404 on every deployment.
function isRetiredReviewDataRequest(req: NextRequest): boolean {
  return (
    isRetiredReviewDataPath(req.nextUrl.pathname) ||
    isRetiredReviewDataPath(new URL(req.url).pathname)
  );
}

function stripTrailingSlashes(value: string): string {
  let end = value.length;
  while (end > 0 && value[end - 1] === "/") {
    end--;
  }
  return end === value.length ? value : value.slice(0, end);
}

function removeSingleTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function isDesktopOSFromUserAgent(userAgent: string): boolean {
  const isAndroid = userAgent.includes("android");
  const isIOS =
    userAgent.includes("iphone") ||
    userAgent.includes("ipad") ||
    userAgent.includes("ipod");
  const isMacDesktop =
    userAgent.includes("macintosh") ||
    (userAgent.includes("mac os x") && !userAgent.includes("mobile"));
  const isLinuxDesktop =
    userAgent.includes("linux") && !isAndroid && !userAgent.includes("mobile");
  const hasDesktopSignal =
    userAgent.includes("windows") ||
    userAgent.includes("x11") ||
    userAgent.includes("cros");

  return (
    !isAndroid && !isIOS && (hasDesktopSignal || isMacDesktop || isLinuxDesktop)
  );
}

function normalizeDropParam(value: string | null): string | undefined {
  if (!value) {
    return undefined;
  }
  return stripTrailingSlashes(value);
}

function normalizeSerialParam(value: string | null): string | undefined {
  if (!value) {
    return undefined;
  }
  return removeSingleTrailingSlash(value);
}

function buildWaveHref({
  wave,
  drop,
  serialNo,
  isDirectMessage,
}: {
  wave?: string | undefined;
  drop?: string | undefined;
  serialNo?: string | undefined;
  isDirectMessage: boolean;
}): string {
  if (!wave) {
    return isDirectMessage
      ? getMessagesBaseRoute(false)
      : getWavesBaseRoute(false);
  }

  const extraParams = drop ? { drop } : undefined;
  return getWaveRoute({
    waveId: wave,
    serialNo,
    extraParams,
    isDirectMessage,
    isApp: false,
  });
}

function resolveMyStreamHomeRedirect({
  view,
  wave,
  drop,
  serialNo,
}: {
  view?: string | undefined;
  wave?: string | undefined;
  drop?: string | undefined;
  serialNo?: string | undefined;
}): string {
  if (view === "messages") {
    return buildWaveHref({
      wave,
      drop,
      serialNo,
      isDirectMessage: true,
    });
  }

  if (view === "waves" || wave) {
    return buildWaveHref({
      wave,
      drop,
      serialNo,
      isDirectMessage: false,
    });
  }

  if (drop) {
    const params = new URLSearchParams();
    params.set("drop", drop);
    return `${getWavesBaseRoute(false)}?${params.toString()}`;
  }

  return getHomeRoute();
}

function resolveMyStreamRedirect(
  req: NextRequest,
  normalizedPathname: string
): string | undefined {
  const userAgent = (req.headers.get("user-agent") || "").toLowerCase();
  if (!isDesktopOSFromUserAgent(userAgent)) {
    return undefined;
  }

  if (normalizedPathname === "/my-stream/notifications") {
    return getNotificationsRoute(false);
  }

  if (normalizedPathname !== "/my-stream") {
    return undefined;
  }

  const params = new URLSearchParams(req.nextUrl.searchParams);
  const view = params.get("view") ?? undefined;
  const wave = params.get("wave") ?? undefined;
  const drop = normalizeDropParam(params.get("drop"));
  const serialNo = normalizeSerialParam(params.get("serialNo"));

  const target = resolveMyStreamHomeRedirect({
    view,
    wave,
    drop,
    serialNo,
  });
  if (!wave) return target;
  const destination = new URL(target, req.url);
  // The helper owns normalized drop/serialNo targets; these are separate view keys.
  for (const key of [
    "tab",
    "competition",
    "default",
    "curation",
    "editPost",
    "entry",
    "edit",
  ]) {
    const value = params.get(key);
    if (value !== null) destination.searchParams.set(key, value);
  }
  return `${destination.pathname}${destination.search}`;
}

function handleRedirects(req: NextRequest): NextResponse | undefined {
  let { pathname } = req.nextUrl;

  if (!pathname.endsWith("/")) {
    pathname += "/";
  }

  for (const mapping of redirectMappings) {
    if (pathname.toLowerCase() === mapping.url.toLowerCase()) {
      const url = req.nextUrl.clone();
      url.pathname = mapping.target.split("?")[0]!;
      const queryString = mapping.target.split("?")[1];
      if (queryString) {
        url.search = `?${queryString}`;
      }
      return NextResponse.redirect(url, 301);
    }
  }
  return undefined;
}

async function enforceAccessControl(
  req: NextRequest,
  normalizedPathname: string
): Promise<Response> {
  return (await accessDenial(req, normalizedPathname)) ?? NextResponse.next();
}

/**
 * The access gate's answer when it turns a request away (a redirect to
 * /access or /restricted, or a 503 when it cannot decide), or null when the
 * request may go through.
 */
async function accessDenial(
  req: NextRequest,
  normalizedPathname: string
): Promise<Response | null> {
  if (
    !ACCESS_GATE_ENABLED ||
    normalizedPathname === "/access" ||
    normalizedPathname === "/restricted"
  ) {
    return null;
  }

  // Only the visitor's own access cookie decides the gate; no server-held
  // credential stands in for it.
  const authValue = req.cookies.get(API_AUTH_COOKIE)?.value ?? "";
  const verdict = await getAccessVerdict({
    apiEndpoint: publicEnv.API_ENDPOINT,
    authValue,
  });

  if (verdict === "unauthorized") {
    req.nextUrl.pathname = "/access";
    req.nextUrl.search = "";
    return NextResponse.redirect(req.nextUrl);
  }

  if (verdict === "restricted") {
    req.nextUrl.pathname = "/restricted";
    req.nextUrl.search = "";
    return NextResponse.redirect(req.nextUrl);
  }

  // Fail closed: without a definitive answer the gate must not let pages through.
  if (verdict === "unavailable") {
    return plainServiceUnavailableResponse();
  }

  return null;
}

export default async function proxy(req: NextRequest) {
  try {
    if (
      isUnservableDotPath(req.nextUrl.pathname) ||
      isRetiredReviewDataRequest(req)
    ) {
      return plainNotFoundResponse();
    }

    const redirectResponse = handleRedirects(req);
    if (redirectResponse) {
      return redirectResponse;
    }

    const { pathname } = req.nextUrl;
    const normalizedPathname =
      pathname.length > 1 && pathname.endsWith("/")
        ? pathname.slice(0, -1)
        : pathname;

    const now = Date.now();
    const possibleDay = possibleTdhVerificationDay(normalizedPathname, now);
    if (
      isImpossibleTdhVerificationDay(normalizedPathname, now) ||
      (possibleDay !== null && (await tdhListedDays.unlisted(possibleDay, now)))
    ) {
      // The TDH pages' own not-found view, with the site around it, sent
      // with a real 404 status, after the same access gate as any page: a
      // day that cannot exist, or one inside the range the feed's index
      // does not list.
      return (
        (await accessDenial(req, normalizedPathname)) ??
        NextResponse.rewrite(
          tdhDayNotFoundTarget(req.nextUrl, normalizedPathname),
          { status: 404 }
        )
      );
    }

    // Wave routes stream their shell with a 200 before a page can call
    // notFound(), so an id that cannot be a wave id is answered here: a
    // rewrite to a route outside those boundaries renders the branded
    // not-found page with a real 404 and keeps the visitor's URL. The query
    // stays on the rewritten URL so Next's `_rsc` cache-busting check still
    // matches on client navigations.
    if (hasMalformedWaveId(normalizedPathname, req.nextUrl.searchParams)) {
      const notFoundUrl = req.nextUrl.clone();
      notFoundUrl.pathname = MALFORMED_WAVE_ROUTE;
      return NextResponse.rewrite(notFoundUrl);
    }

    const redirectTarget = normalizedPathname.startsWith("/my-stream")
      ? resolveMyStreamRedirect(req, normalizedPathname)
      : undefined;

    if (redirectTarget) {
      const clone = req.nextUrl.clone();
      const [pathnamePart, searchPart] = redirectTarget.split("?");
      clone.pathname = pathnamePart || "/";
      clone.search = searchPart ? `?${searchPart}` : "";
      return NextResponse.redirect(clone, 301);
    }

    if (isStaticAssetPath(normalizedPathname)) {
      return NextResponse.next();
    }

    return await enforceAccessControl(req, normalizedPathname);
  } catch {
    return NextResponse.redirect(new URL("/error", req.url));
  }
}
