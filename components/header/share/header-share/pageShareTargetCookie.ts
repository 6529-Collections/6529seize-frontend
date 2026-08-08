import { PageShareTarget } from "./constants";

const PAGE_SHARE_TARGET_COOKIE_NAME = "page-share-qr-target";
const PAGE_SHARE_TARGET_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function getSavedPageShareTarget(): PageShareTarget {
  if (typeof document === "undefined") {
    return PageShareTarget.BROWSER;
  }

  const savedTarget = document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${PAGE_SHARE_TARGET_COOKIE_NAME}=`))
    ?.split("=")[1];

  return savedTarget === PageShareTarget.APP
    ? PageShareTarget.APP
    : PageShareTarget.BROWSER;
}

export function savePageShareTarget(target: PageShareTarget): void {
  document.cookie = `${PAGE_SHARE_TARGET_COOKIE_NAME}=${target}; Max-Age=${PAGE_SHARE_TARGET_COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`;
}
