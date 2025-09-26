import { NextRequest, NextResponse } from "next/server";
import { publicEnv } from "./config/env";
import { API_AUTH_COOKIE } from "./constants";

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

function handleRedirects(req: NextRequest): NextResponse | undefined {
  let { pathname } = req.nextUrl;

  if (!pathname.endsWith("/")) {
    pathname += "/";
  }

  for (const mapping of redirectMappings) {
    if (pathname.toLowerCase() === mapping.url.toLowerCase()) {
      const url = req.nextUrl.clone();
      url.pathname = mapping.target.split("?")[0];
      const queryString = mapping.target.split("?")[1];
      if (queryString) {
        url.search = `?${queryString}`;
      }
      return NextResponse.redirect(url, 301);
    }
  }
  return undefined;
}

export async function middleware(req: NextRequest) {
  try {
    const redirectResponse = handleRedirects(req);
    if (redirectResponse) {
      return redirectResponse;
    }

    const { pathname } = req.nextUrl;

    if (
      pathname.startsWith("/api") ||
      pathname.startsWith("/_next") ||
      pathname.endsWith("favicon.ico") ||
      pathname.endsWith(".jpeg") ||
      pathname.endsWith(".png") ||
      pathname.endsWith(".gif") ||
      pathname.endsWith(".svg") ||
      pathname.endsWith(".webp") ||
      pathname.startsWith("/sitemap") ||
      pathname.startsWith("/robots.txt") ||
      pathname.startsWith("/error")
    ) {
      return NextResponse.next();
    }

    if (pathname != "/access" && pathname != "/restricted") {
      const apiAuth = req.cookies.get(API_AUTH_COOKIE) ?? {
        value: publicEnv.STAGING_API_KEY ?? "",
      };
      const r = await fetch(`${publicEnv.API_ENDPOINT}/api/`, {
        headers: apiAuth ? { "x-6529-auth": apiAuth.value } : {},
      });

      if (r.status === 401) {
        req.nextUrl.pathname = "/access";
        req.nextUrl.search = "";
        return NextResponse.redirect(req.nextUrl);
      } else if (r.status === 403) {
        req.nextUrl.pathname = "/restricted";
        req.nextUrl.search = "";
        return NextResponse.redirect(req.nextUrl);
      } else {
        return NextResponse.next();
      }
    }
  } catch (error) {
    return NextResponse.redirect(new URL("/error", req.url));
  }
}
