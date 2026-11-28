"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { MessageKey } from "@/i18n/messages/en-US.complete";
import "@/i18n/namespaces/stream-sepolia";

export const STREAM_BASE = "/stream/sepolia";

/** A work's page under the test pages. */
export function workHref(work: { readonly token: string; readonly tokenId: bigint }): string {
  return `${STREAM_BASE}/work/${work.token}/${work.tokenId.toString()}`;
}

const LINKS: readonly { href: string; key: MessageKey }[] = [
  { href: STREAM_BASE, key: "streamSepolia.nav.works" },
  { href: `${STREAM_BASE}/create`, key: "streamSepolia.nav.create" },
  { href: `${STREAM_BASE}/collection`, key: "streamSepolia.nav.collection" },
  { href: `${STREAM_BASE}/me`, key: "streamSepolia.nav.me" },
];

export function StreamNav() {
  const locale = useBrowserLocale();
  const pathname = usePathname();
  return (
    <nav aria-label={t(locale, "streamSepolia.nav.label")} className="tw-overflow-x-auto">
      <ul className="tw-m-0 tw-flex tw-flex-wrap tw-list-none tw-gap-x-6 tw-gap-y-2 tw-p-0">
        {LINKS.map((link) => {
          const active =
            link.href === STREAM_BASE
              ? pathname === STREAM_BASE || pathname.startsWith(`${STREAM_BASE}/work`)
              : pathname.startsWith(link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`tw-inline-block tw-whitespace-nowrap tw-border-0 tw-border-b-2 tw-border-solid tw-pb-2 tw-text-sm tw-font-semibold tw-no-underline tw-transition-colors ${
                  active
                    ? "tw-border-primary-400 tw-text-iron-50"
                    : "tw-border-transparent tw-text-iron-400 hover:tw-text-iron-100"
                }`}
              >
                {t(locale, link.key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
