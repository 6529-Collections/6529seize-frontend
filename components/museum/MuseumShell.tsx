import Link from "next/link";
import type { ReactNode } from "react";
import { formatDate, formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { MUSEUM_MANIFEST_URL, MUSEUM_REPOSITORY_URL } from "@/lib/museum/types";
import type { MuseumSourceState, MuseumView } from "@/lib/museum/types";

const NAV_ITEMS = [
  ["museum.network.nav.overview", "/museum/network"],
  ["museum.network.nav.collections", "/museum/network/collections"],
  ["museum.network.nav.accessions", "/museum/network/accessions"],
  ["museum.network.nav.programs", "/museum/network/programs"],
  ["museum.network.nav.governance", "/museum/network/governance"],
  ["museum.network.nav.methodology", "/museum/network/methodology"],
] as const;

function sourceLabelKey(
  sourceState: MuseumSourceState
):
  | "museum.network.source.fresh"
  | "museum.network.source.partial"
  | "museum.network.source.stale"
  | "museum.network.source.unavailable"
  | "museum.network.source.invalid" {
  switch (sourceState) {
    case "fresh":
      return "museum.network.source.fresh";
    case "partial":
      return "museum.network.source.partial";
    case "stale":
      return "museum.network.source.stale";
    case "unavailable":
      return "museum.network.source.unavailable";
    case "invalid":
      return "museum.network.source.invalid";
  }
}

function sourceTone(sourceState: MuseumSourceState): string {
  switch (sourceState) {
    case "fresh":
      return "tw-border-success/30 tw-bg-success/10 tw-text-green-100";
    case "partial":
      return "tw-border-yellow-400/30 tw-bg-yellow-400/10 tw-text-yellow-100";
    case "stale":
      return "tw-border-yellow-400/30 tw-bg-yellow-400/10 tw-text-yellow-100";
    case "invalid":
      return "tw-border-error/30 tw-bg-error/10 tw-text-red-100";
    case "unavailable":
      return "tw-border-white/10 tw-bg-iron-900 tw-text-iron-200";
  }
}

function MuseumSourceBanner({ view }: { readonly view: MuseumView }) {
  const release = view.release;
  return (
    <aside
      className={`tw-mb-8 tw-rounded-xl tw-border tw-p-4 ${sourceTone(view.sourceState)}`}
      aria-label={t(
        DEFAULT_LOCALE,
        "museum.network.accessibility.sourceStatus"
      )}
    >
      <div className="tw-flex tw-flex-col tw-gap-3 md:tw-flex-row md:tw-items-start md:tw-justify-between">
        <div>
          <p className="tw-m-0 tw-text-sm tw-font-semibold">
            {t(DEFAULT_LOCALE, sourceLabelKey(view.sourceState))}
          </p>
          {release && (
            <p className="tw-m-1 tw-text-xs tw-opacity-80">
              {t(DEFAULT_LOCALE, "museum.network.source.canonicalMain")} ·{" "}
              {t(DEFAULT_LOCALE, "museum.network.source.observed", {
                date: formatDate(DEFAULT_LOCALE, release.observedAt),
              })}{" "}
              ·{" "}
              {t(DEFAULT_LOCALE, "museum.network.source.entries", {
                count: formatInteger(DEFAULT_LOCALE, release.entries.length),
              })}
            </p>
          )}
        </div>
        <div className="tw-flex tw-flex-wrap tw-gap-x-4 tw-gap-y-2 tw-text-xs">
          <a
            href={MUSEUM_MANIFEST_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="tw-text-inherit tw-underline tw-underline-offset-4 focus-visible:tw-rounded-sm focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {t(DEFAULT_LOCALE, "museum.network.source.viewManifest")}
          </a>
          <a
            href={MUSEUM_REPOSITORY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="tw-text-inherit tw-underline tw-underline-offset-4 focus-visible:tw-rounded-sm focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {t(DEFAULT_LOCALE, "museum.network.legacy.github")}
          </a>
        </div>
      </div>
    </aside>
  );
}

export function MuseumShell({
  children,
  view,
}: {
  readonly children: ReactNode;
  readonly view: MuseumView;
}) {
  return (
    <main className="tailwind-scope tw-min-h-screen tw-bg-iron-950 tw-px-4 tw-py-6 sm:tw-px-6 lg:tw-px-10">
      <div className="tw-mx-auto tw-w-full tw-max-w-6xl">
        <header className="tw-mb-6 tw-border-b tw-border-white/10 tw-pb-6">
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.24em] tw-text-primary-300">
            {t(DEFAULT_LOCALE, "museum.network.eyebrow")}
          </p>
          <div className="tw-mt-3 tw-flex tw-flex-col tw-gap-4 lg:tw-flex-row lg:tw-items-end lg:tw-justify-between">
            <div className="tw-max-w-3xl">
              <h1 className="tw-m-0 tw-text-3xl tw-font-semibold tw-tracking-tight tw-text-white sm:tw-text-4xl">
                {t(DEFAULT_LOCALE, "museum.network.title")}
              </h1>
              <p className="tw-m-0 tw-mt-3 tw-max-w-2xl tw-text-base tw-leading-7 tw-text-iron-300">
                {t(DEFAULT_LOCALE, "museum.network.description")}
              </p>
            </div>
            <p className="tw-m-0 tw-max-w-xs tw-text-sm tw-leading-6 tw-text-iron-400">
              {t(DEFAULT_LOCALE, "museum.network.source.canonicalMain")}
            </p>
          </div>
        </header>

        <nav
          aria-label={t(
            DEFAULT_LOCALE,
            "museum.network.accessibility.sections"
          )}
          className="tw-mb-8 tw-overflow-x-auto"
        >
          <ul className="tw-flex tw-min-w-max tw-list-none tw-gap-2 tw-p-0">
            {NAV_ITEMS.map(([labelKey, href]) => (
              <li key={href}>
                <Link
                  href={href}
                  className="transition-colors tw-inline-flex tw-min-h-10 tw-items-center tw-rounded-lg tw-border tw-border-white/10 tw-bg-iron-900/60 tw-px-3 tw-text-sm tw-font-medium tw-text-iron-200 tw-no-underline hover:tw-border-primary-400/50 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                >
                  {t(DEFAULT_LOCALE, labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <MuseumSourceBanner view={view} />
        {children}

        <footer className="tw-mt-12 tw-border-t tw-border-white/10 tw-pt-5 tw-text-xs tw-leading-5 tw-text-iron-500">
          {t(DEFAULT_LOCALE, "museum.network.footer.disclaimer")}
        </footer>
      </div>
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
    <div className="tw-mb-6">
      <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.18em] tw-text-primary-300">
        {eyebrow}
      </p>
      <h2 className="tw-m-0 tw-mt-2 tw-text-2xl tw-font-semibold tw-text-white">
        {title}
      </h2>
      <p className="tw-m-0 tw-mt-2 tw-max-w-3xl tw-text-sm tw-leading-6 tw-text-iron-400">
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
    neutral: "tw-border-white/10 tw-bg-iron-900 tw-text-iron-300",
    success: "tw-border-success/30 tw-bg-success/10 tw-text-green-100",
    warning: "tw-border-yellow-400/30 tw-bg-yellow-400/10 tw-text-yellow-100",
    danger: "tw-border-error/30 tw-bg-error/10 tw-text-red-100",
  }[tone];

  return (
    <span
      className={`tw-inline-flex tw-items-center tw-rounded-full tw-border tw-px-2.5 tw-py-1 tw-text-xs tw-font-medium ${toneClass}`}
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
    <div className="tw-rounded-xl tw-border tw-border-white/10 tw-bg-iron-900/60 tw-p-4">
      <p className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-white">
        {value}
      </p>
      <p className="tw-m-0 tw-mt-1 tw-text-xs tw-leading-5 tw-text-iron-400">
        {label}
      </p>
    </div>
  );
}
