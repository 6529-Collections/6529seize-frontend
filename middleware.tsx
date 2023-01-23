import Cookies from "js-cookie";
import { NextRequest, NextResponse } from "next/server";
import { API_AUTH_COOKIE } from "./constants";

export function middleware(req: NextRequest) {
  if (
    req.nextUrl.pathname.startsWith("/_next") ||
    req.nextUrl.pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  const apiAuth = req.cookies.get(API_AUTH_COOKIE);
  if (
    process.env.ACTIVATE_PASSWORD &&
    !apiAuth &&
    req.nextUrl.pathname != "/access" &&
    !req.nextUrl.pathname.endsWith(".png") &&
    !req.nextUrl.pathname.endsWith(".jepg") &&
    !req.nextUrl.pathname.endsWith(".ico")
  ) {
    return NextResponse.redirect(new URL("/access", req.url));
  }
  return NextResponse.next();
}
