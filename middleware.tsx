import { NextRequest, NextResponse } from "next/server";
import { API_AUTH_COOKIE } from "./constants";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.endsWith("favicon.ico") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".png")
  ) {
    return NextResponse.next();
  }

  if (pathname != "/access" && pathname != "/restricted") {
    const apiAuth = req.cookies.get(API_AUTH_COOKIE);
    const r = await fetch(`${process.env.API_ENDPOINT}/api/`, {
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
}
