import Cookies from "js-cookie";
import { NextRequest, NextResponse } from "next/server";
import { API_AUTH_COOKIE } from "./constants";

export function middleware(req: NextRequest) {
  if (
    req.nextUrl.pathname.startsWith("/_next") ||
    req.nextUrl.pathname.endsWith("favicon.ico") ||
    req.nextUrl.pathname.endsWith(".jpeg") ||
    req.nextUrl.pathname.endsWith(".png")
  ) {
    return NextResponse.next();
  }

  const apiAuth = req.cookies.get(API_AUTH_COOKIE);

  if (
    process.env.ACTIVATE_API_PASSWORD &&
    !apiAuth &&
    req.nextUrl.pathname != "/access"
  ) {
    return NextResponse.redirect(new URL("/access", req.url));
  }
  if (apiAuth) {
    fetch(`${process.env.API_ENDPOINT}/api/`, {
      headers: apiAuth ? { "x-6529-auth": apiAuth } : {},
    }).then((r) => {
      if (r.status == 401) {
        return NextResponse.redirect(new URL("/access", req.url));
      }
    });
  }
  return NextResponse.next();
}
