import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  hasValidatorAccess,
  isValidatorPath,
  VALIDATOR_ACCESS_COOKIE,
  VALIDATOR_LOCKED_PATH,
  VALIDATOR_NEXT_PATH_HEADER,
  VALIDATOR_PUBLIC_PATHS,
  VALIDATOR_UNLOCK_PATH,
} from "./accessGate";

// SameSite=Strict cookies are left off a navigation that starts on another
// site, such as a link in a chat app or on the validator's own page in a
// browser. This page reloads itself once from 6529.io, which sends the
// cookie. Without a cookie the reload shows the password form, so it cannot
// loop. location.reload() keeps a link's section (/validator#send-feedback):
// a refresh to the same address with a fragment only scrolls, and never
// reaches the server. The refresh stays for a browser without scripts.
const SAME_SITE_RELOAD_HTML =
  '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
  "<script>location.reload()</script>" +
  '<meta http-equiv="refresh" content="0"><meta name="robots" content="noindex, nofollow">' +
  "<title>6529 Validator</title></head><body>" +
  '<p><a href="">Continue to 6529 Validator</a></p></body></html>';

function sameSiteReloadResponse(): Response {
  return new Response(SAME_SITE_RELOAD_HTML, {
    status: 200,
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

/**
 * The password gate for everything under /validator except the public
 * release feed and the form's own endpoint. A request without a valid cookie
 * gets the password form in place of the page it asked for. Returns
 * undefined when the request may go on.
 */
export function handleValidatorPageGate(
  req: NextRequest,
  pathname: string
): Response | undefined {
  if (
    !isValidatorPath(pathname) ||
    VALIDATOR_PUBLIC_PATHS.has(pathname) ||
    pathname === VALIDATOR_UNLOCK_PATH
  ) {
    return undefined;
  }
  if (hasValidatorAccess(req.cookies.get(VALIDATOR_ACCESS_COOKIE)?.value)) {
    return undefined;
  }
  if (
    req.method === "GET" &&
    req.headers.get("sec-fetch-site") === "cross-site" &&
    req.headers.get("sec-fetch-mode") === "navigate"
  ) {
    return sameSiteReloadResponse();
  }
  const lockedUrl = req.nextUrl.clone();
  lockedUrl.pathname = VALIDATOR_LOCKED_PATH;
  const headers = new Headers(req.headers);
  headers.set(VALIDATOR_NEXT_PATH_HEADER, pathname);
  return NextResponse.rewrite(lockedUrl, { request: { headers } });
}
