import type { MessageKey } from "@/i18n/messages";
import { STREAM_ROUTES } from "@/lib/stream/workKey";

/** The section's information architecture: product pages, then the explainers. */

interface StreamNavItem {
  readonly href: string;
  readonly label: MessageKey;
  /** Also active on these path prefixes. */
  readonly prefixes?: readonly string[];
}

export const STREAM_NAV: readonly StreamNavItem[] = [
  {
    href: STREAM_ROUTES.home,
    label: "stream.nav.home",
    prefixes: ["/stream/works"],
  },
  { href: STREAM_ROUTES.editions, label: "stream.nav.editions" },
  { href: STREAM_ROUTES.artists, label: "stream.nav.artists" },
  { href: STREAM_ROUTES.museum, label: "stream.nav.museum" },
  { href: STREAM_ROUTES.curation, label: "stream.nav.curation" },
  { href: STREAM_ROUTES.federated, label: "stream.nav.federated" },
  { href: STREAM_ROUTES.me, label: "stream.nav.me" },
  { href: STREAM_ROUTES.launch, label: "stream.nav.launch" },
  { href: STREAM_ROUTES.about, label: "stream.nav.about" },
];

/** The explainer pages, in reading order (PROPOSAL section 3, under /stream/about). */
export const STREAM_ABOUT_PAGES = [
  "overview",
  "artists",
  "collectors",
  "editions",
  "curation",
  "federated",
  "how-it-works",
  "developers",
] as const;

export type StreamAboutPage = (typeof STREAM_ABOUT_PAGES)[number];

/** Message-key segment per explainer page (`stream.about.<key>.*`). */
export const STREAM_ABOUT_KEYS = {
  overview: "overview",
  artists: "artists",
  collectors: "collectors",
  editions: "editions",
  curation: "curation",
  federated: "federated",
  "how-it-works": "howItWorks",
  developers: "developers",
} as const satisfies Record<StreamAboutPage, string>;

export function aboutHref(page: StreamAboutPage): string {
  return page === "overview"
    ? STREAM_ROUTES.about
    : STREAM_ROUTES.aboutPage(page);
}

export function isNavActive(item: StreamNavItem, pathname: string): boolean {
  if (item.href === STREAM_ROUTES.home) {
    return (
      pathname === item.href ||
      (item.prefixes ?? []).some((prefix) => pathname.startsWith(prefix))
    );
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/** Pages about 6529 Stream Federated get the federated status strip. */
export function isFederatedPath(pathname: string): boolean {
  return (
    pathname.startsWith(STREAM_ROUTES.federated) ||
    pathname.startsWith(STREAM_ROUTES.launch) ||
    pathname === STREAM_ROUTES.aboutPage("federated")
  );
}
