export type TikTokLinkKind = "video" | "profile" | "short";

export interface TikTokLinkInfo {
  readonly href: string;
  readonly kind: TikTokLinkKind;
}

const TIKTOK_PRIMARY_DOMAINS = new Set([
  "tiktok.com",
  "www.tiktok.com",
  "m.tiktok.com",
]);

const TIKTOK_SHORT_DOMAINS = new Set(["vm.tiktok.com", "vt.tiktok.com"]);

const USERNAME_PATTERN = /^@[A-Za-z0-9._-]+$/;

const VIDEO_ID_PATTERN = /^\d+$/;

export const parseTikTokLink = (href: string): TikTokLinkInfo | null => {
  try {
    const url = new URL(href);
    const hostname = url.hostname.toLowerCase();

    if (TIKTOK_SHORT_DOMAINS.has(hostname)) {
      return { href, kind: "short" };
    }

    if (!TIKTOK_PRIMARY_DOMAINS.has(hostname)) {
      return null;
    }

    const segments = url.pathname.split("/").filter((segment) => segment.length > 0);
    if (segments.length === 0) {
      return null;
    }

    const first = segments[0];
    if (first.startsWith("@")) {
      if (!USERNAME_PATTERN.test(first)) {
        return null;
      }

      if (segments.length === 1) {
        return { href, kind: "profile" };
      }

      if (segments[1] === "video" && VIDEO_ID_PATTERN.test(segments[2] ?? "")) {
        return { href, kind: "video" };
      }

      return null;
    }

    if (first === "video" && VIDEO_ID_PATTERN.test(segments[1] ?? "")) {
      return { href, kind: "video" };
    }

    return null;
  } catch {
    return null;
  }
};
