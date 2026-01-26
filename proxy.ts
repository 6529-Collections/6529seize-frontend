import {
  getHomeFeedRoute,
  getMessagesBaseRoute,
  getNotificationsRoute,
  getWaveRoute,
  getWavesBaseRoute,
} from "@/helpers/navigation.helpers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { publicEnv } from "./config/env";
import { createContentSecurityPolicyValue } from "./config/securityHeaders";
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

const STATIC_PATH_PREFIXES = [
  "/api",
  "/_next",
  "/sitemap",
  "/robots.txt",
  "/error",
] as const;
const STATIC_PATH_SUFFIXES = [
  "favicon.ico",
  ".jpeg",
  ".png",
  ".gif",
  ".svg",
  ".webp",
] as const;

type CspContext = {
  readonly requestHeaders: Headers;
  readonly cspValue: string;
};

function base64Encode(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }
  return btoa(binary);
}

function createNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return base64Encode(bytes);
}

function nextResponse(req: NextRequest, ctx: CspContext | undefined) {
  const res = ctx
    ? NextResponse.next({ request: { headers: ctx.requestHeaders } })
    : NextResponse.next();
  if (ctx) {
    res.headers.set("Content-Security-Policy", ctx.cspValue);
  }
  return res;
}

function withCspHeader(
  res: NextResponse,
  ctx: CspContext | undefined
): NextResponse {
  if (ctx) {
    res.headers.set("Content-Security-Policy", ctx.cspValue);
  }
  return res;
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

  return getHomeFeedRoute();
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

  return resolveMyStreamHomeRedirect({
    view,
    wave,
    drop,
    serialNo,
  });
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
  normalizedPathname: string,
  ctx: CspContext | undefined
): Promise<NextResponse> {
  if (
    normalizedPathname === "/access" ||
    normalizedPathname === "/restricted"
  ) {
    return nextResponse(req, ctx);
  }

  const apiAuth = req.cookies.get(API_AUTH_COOKIE) ?? {
    value: publicEnv.STAGING_API_KEY ?? "",
  };
  const response = await fetch(`${publicEnv.API_ENDPOINT}/api/`, {
    headers: apiAuth ? { "x-6529-auth": apiAuth.value } : {},
  });

  if (response.status === 401) {
    req.nextUrl.pathname = "/access";
    req.nextUrl.search = "";
    return withCspHeader(NextResponse.redirect(req.nextUrl), ctx);
  }

  if (response.status === 403) {
    req.nextUrl.pathname = "/restricted";
    req.nextUrl.search = "";
    return withCspHeader(NextResponse.redirect(req.nextUrl), ctx);
  }

  return nextResponse(req, ctx);
}

export default async function proxy(req: NextRequest) {
  try {
    const { pathname } = req.nextUrl;
    const normalizedPathname =
      pathname.length > 1 && pathname.endsWith("/")
        ? pathname.slice(0, -1)
        : pathname;

    const bypassAccessControl =
      STATIC_PATH_PREFIXES.some((prefix) => normalizedPathname.startsWith(prefix)) ||
      STATIC_PATH_SUFFIXES.some((suffix) => normalizedPathname.endsWith(suffix));

    const skipCsp =
      normalizedPathname.startsWith("/_next") ||
      normalizedPathname.startsWith("/api") ||
      STATIC_PATH_SUFFIXES.some((suffix) => normalizedPathname.endsWith(suffix));

    const ctx: CspContext | undefined = skipCsp
      ? undefined
      : (() => {
          const nonce = createNonce();
          const requestHeaders = new Headers(req.headers);
          requestHeaders.set("x-nonce", nonce);

          return {
            requestHeaders,
            cspValue: createContentSecurityPolicyValue({ nonce, publicEnv }),
          };
        })();

    const redirectResponse = handleRedirects(req);
    if (redirectResponse) {
      return withCspHeader(redirectResponse, ctx);
    }

    const redirectTarget = normalizedPathname.startsWith("/my-stream")
      ? resolveMyStreamRedirect(req, normalizedPathname)
      : undefined;

    if (redirectTarget) {
      const clone = req.nextUrl.clone();
      const [pathnamePart, searchPart] = redirectTarget.split("?");
      clone.pathname = pathnamePart || "/";
      clone.search = searchPart ? `?${searchPart}` : "";
      return withCspHeader(NextResponse.redirect(clone, 301), ctx);
    }

    if (bypassAccessControl) {
      return nextResponse(req, ctx);
    }

    return enforceAccessControl(req, normalizedPathname, ctx);
  } catch (error) {
    const nonce = createNonce();
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-nonce", nonce);
    const fallbackCtx: CspContext = {
      requestHeaders,
      cspValue: createContentSecurityPolicyValue({ nonce, publicEnv }),
    };
    return withCspHeader(
      NextResponse.redirect(new URL("/error", req.url)),
      fallbackCtx
    );
  }
}
