import Link from "next/link";
import type { ReactNode } from "react";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { MUSEUM_REPOSITORY_URL } from "@/lib/museum/types";
import type { MuseumSourceState } from "@/lib/museum/types";

const NAV_ITEMS = [
  ["museum.network.nav.collection", "/museum/network/collection"],
  ["museum.network.nav.artists", "/museum/network/artists"],
  ["museum.network.nav.programsExhibitions", "/museum/network/programs"],
  ["museum.network.nav.stories", "/museum/network/stories"],
  ["museum.network.nav.about", "/museum/network/about"],
] as const;

function MuseumSourceNotice({
  view,
}: {
  readonly view: { readonly sourceState: MuseumSourceState };
}) {
  if (view.sourceState === "fresh") {
    return null;
  }

  const copy =
    view.sourceState === "stale"
      ? t(DEFAULT_LOCALE, "museum.network.source.stale")
      : t(DEFAULT_LOCALE, "museum.network.source.unavailable");

  return (
    <aside
      className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-yellow-400/30 tw-bg-yellow-400/10 tw-px-4 tw-py-3 tw-text-sm tw-leading-6 tw-text-yellow-100 sm:tw-px-6 lg:tw-px-8"
      aria-label={t(
        DEFAULT_LOCALE,
        "museum.network.accessibility.sourceStatus"
      )}
    >
      <div className="tw-mx-auto tw-w-full tw-max-w-[1400px]">{copy}</div>
    </aside>
  );
}

export function MuseumShell({
  children,
  view,
}: {
  readonly children: ReactNode;
  readonly view: { readonly sourceState: MuseumSourceState };
}) {
  return (
    <main className="tailwind-scope tw-min-h-screen tw-min-w-0 tw-overflow-x-clip tw-bg-black tw-text-iron-100">
      <header className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800">
        <div className="tw-mx-auto tw-flex tw-w-full tw-max-w-[1324px] tw-flex-col tw-gap-4 tw-px-4 tw-py-5 sm:tw-px-6 lg:tw-flex-row lg:tw-items-center lg:tw-justify-between lg:tw-px-8">
          <Link
            href="/museum/network"
            className="tw-flex tw-min-h-11 tw-items-center tw-text-base tw-font-semibold tw-text-iron-50 tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            6529 Network Museum
          </Link>
          <nav
            aria-label={t(
              DEFAULT_LOCALE,
              "museum.network.accessibility.sections"
            )}
            className="tw-min-w-0"
          >
            <ul className="tw-m-0 tw-flex tw-list-none tw-flex-wrap tw-gap-x-5 tw-gap-y-1 tw-p-0">
              {NAV_ITEMS.map(([labelKey, href]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-medium tw-text-iron-300 tw-no-underline tw-transition-colors tw-duration-150 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                  >
                    {t(DEFAULT_LOCALE, labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <MuseumSourceNotice view={view} />

      <div className="tw-mx-auto tw-w-full tw-min-w-0 tw-max-w-[1324px] tw-px-4 tw-py-8 sm:tw-px-6 sm:tw-py-12 lg:tw-px-8 lg:tw-py-16">
        {children}
      </div>

      <footer className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800">
        <div className="tw-mx-auto tw-flex tw-w-full tw-max-w-[1324px] tw-flex-col tw-gap-3 tw-px-4 tw-py-8 tw-text-xs tw-leading-5 tw-text-iron-500 sm:tw-px-6 lg:tw-flex-row lg:tw-items-center lg:tw-justify-between lg:tw-px-8">
          <p className="tw-m-0 tw-max-w-3xl">
            {t(DEFAULT_LOCALE, "museum.network.footer.disclaimer")}
          </p>
          <a
            href={MUSEUM_REPOSITORY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="tw-min-h-11 tw-shrink-0 tw-content-center tw-text-iron-400 tw-underline tw-underline-offset-4 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {t(DEFAULT_LOCALE, "museum.network.source.github")}
          </a>
        </div>
      </footer>
    </main>
  );
}

export function MuseumSectionHeading({
  eyebrow,
  title,
  description,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
}) {
  return (
    <div className="tw-mb-8 tw-max-w-4xl">
      <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
        {eyebrow}
      </p>
      <h1 className="tw-m-0 tw-mt-3 tw-text-3xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-4xl">
        {title}
      </h1>
      <p className="tw-m-0 tw-mt-4 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-300">
        {description}
      </p>
    </div>
  );
}

export function MuseumStatusBadge({
  label,
  tone = "neutral",
}: {
  readonly label: string;
  readonly tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const toneClass = {
    neutral: "tw-border-iron-700 tw-bg-iron-900 tw-text-iron-300",
    success: "tw-border-success/40 tw-bg-iron-900 tw-text-green-200",
    warning: "tw-border-yellow-400/40 tw-bg-iron-900 tw-text-yellow-100",
    danger: "tw-border-error/40 tw-bg-iron-900 tw-text-red-100",
  }[tone];

  return (
    <span
      className={`tw-inline-flex tw-items-center tw-rounded-md tw-border tw-border-solid tw-px-2.5 tw-py-1 tw-text-xs tw-font-medium ${toneClass}`}
    >
      {label}
    </span>
  );
}

export function MuseumMetric({
  value,
  label,
}: {
  readonly value: string;
  readonly label: string;
}) {
  return (
    <div className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-4">
      <p className="tw-m-0 tw-text-xl tw-font-semibold tw-text-iron-50">
        {value}
      </p>
      <p className="tw-m-0 tw-mt-1 tw-text-xs tw-leading-5 tw-text-iron-400">
        {label}
      </p>
    </div>
  );
}
