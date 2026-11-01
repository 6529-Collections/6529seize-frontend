"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { StreamProvider } from "@/components/stream/data/StreamProvider";
import StreamDevPanel from "@/components/stream/layout/StreamDevPanel";
import {
  isFederatedPath,
  isNavActive,
  STREAM_NAV,
} from "@/components/stream/layout/streamNavigation";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import { STREAM_FOCUS, STREAM_LABEL } from "@/components/stream/ui/styles";
import { STREAM_ROUTES } from "@/lib/stream/workKey";

/**
 * The status strip on every page. While the data comes from the mock it says
 * so; federated pages say Federated is a v1.1 design.
 */
function StreamStatusStrip({
  locale,
  federated,
}: {
  readonly locale: SupportedLocale;
  readonly federated: boolean;
}) {
  return (
    <p className="tw-m-0 tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1 tw-rounded-lg tw-border tw-border-solid tw-border-amber-400/20 tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-xs tw-font-medium tw-text-amber-200">
      <span>
        {federated
          ? t(locale, "stream.status.federated")
          : t(locale, "stream.status.core")}
      </span>
      <Link
        href={`${STREAM_ROUTES.aboutPage("developers")}#status`}
        className={`tw-rounded-md tw-text-iron-300 tw-underline tw-underline-offset-2 hover:tw-text-iron-50 ${STREAM_FOCUS}`}
      >
        {t(locale, "stream.status.more")}
      </Link>
    </p>
  );
}

function StreamSectionNav({
  locale,
  pathname,
}: {
  readonly locale: SupportedLocale;
  readonly pathname: string;
}) {
  return (
    <nav aria-label={t(locale, "stream.nav.label")} className="tw-min-w-0">
      <ul className="tw-m-0 tw-flex tw-list-none tw-gap-1 tw-overflow-x-auto tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.07] tw-p-0 tw-pb-2 [scrollbar-width:thin]">
        {STREAM_NAV.map((item) => {
          const active = isNavActive(item, pathname);
          return (
            <li key={item.href} className="tw-flex-none">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`tw-inline-flex tw-rounded-lg tw-px-3 tw-py-1.5 tw-text-sm tw-no-underline tw-transition-colors ${STREAM_FOCUS} ${
                  active
                    ? "tw-bg-iron-800 tw-font-medium tw-text-iron-50"
                    : "tw-text-iron-400 hover:tw-bg-iron-900 hover:tw-text-iron-50"
                }`}
              >
                {t(locale, item.label)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * The /stream section shell: data provider, section navigation, status strip
 * and, on the mock, the dev panel. Rendered only when the feature flag is on.
 * `tailwind-scope` opts the whole section out of the app's global heading and
 * form-control rules (`styles/globals.css`), so the section's own classes win.
 */
export default function StreamShell({
  children,
}: {
  readonly children: ReactNode;
}) {
  const locale = useBrowserLocale();
  const pathname = usePathname();
  return (
    <StreamProvider>
      <div className="tailwind-scope tw-mx-auto tw-w-full tw-max-w-6xl tw-px-4 tw-pb-16 tw-pt-5 sm:tw-px-6">
        <div className="tw-flex tw-flex-col tw-gap-3">
          <p className={STREAM_LABEL}>{t(locale, "stream.section.name")}</p>
          <StreamSectionNav locale={locale} pathname={pathname} />
          <StreamStatusStrip
            locale={locale}
            federated={isFederatedPath(pathname)}
          />
        </div>
        <div className="tw-mt-6">{children}</div>
      </div>
      <StreamDevPanel locale={locale} />
    </StreamProvider>
  );
}
