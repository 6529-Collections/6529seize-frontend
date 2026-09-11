import Link from "next/link";
import type { ReactNode } from "react";
import { MuseumNavigation } from "@/components/museum/MuseumNavigation";
import { MuseumSourceContribution } from "@/components/museum/MuseumSourceContribution";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  MuseumPageSourceCatalog,
  MuseumPublicationIdentity,
} from "@/lib/museum/publication";
import type { MuseumSourceState } from "@/lib/museum/types";

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
  readonly view: {
    readonly sourceState: MuseumSourceState;
    readonly publicationIdentity: MuseumPublicationIdentity | null;
    readonly pageSources: MuseumPageSourceCatalog;
  };
}) {
  return (
    <main
      className="tailwind-scope tw-min-h-screen tw-min-w-0 tw-overflow-x-clip tw-bg-black tw-text-iron-100"
      style={{
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      }}
    >
      <header className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800">
        <div className="tw-mx-auto tw-flex tw-w-full tw-max-w-[1324px] tw-flex-col tw-gap-4 tw-px-4 tw-py-5 sm:tw-px-6 lg:tw-flex-row lg:tw-items-center lg:tw-justify-between lg:tw-px-8">
          <Link
            href="/museum/network"
            prefetch={false}
            className="tw-flex tw-min-h-11 tw-items-center tw-text-base tw-font-medium tw-text-iron-50 tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            6529 Network Museum
          </Link>
          <MuseumNavigation />
        </div>
      </header>

      <MuseumSourceNotice view={view} />

      <div className="tw-mx-auto tw-w-full tw-min-w-0 tw-max-w-[1324px] tw-px-4 tw-py-8 sm:tw-px-6 sm:tw-py-12 lg:tw-px-8 lg:tw-py-16">
        {children}
      </div>

      <MuseumSourceContribution
        identity={view.publicationIdentity}
        pageSources={view.pageSources}
        sourceState={view.sourceState}
      />
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
