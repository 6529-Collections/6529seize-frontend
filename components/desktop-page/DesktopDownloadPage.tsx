import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ReactNode } from "react";

import { ABOUT_CARD_CLASS_NAME } from "@/components/about/AboutLayout";
import ReleaseSectionEmpty from "@/components/release-section/ReleaseSectionEmpty";
import {
  BODY,
  LINK,
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
  SECTION_HEADING,
} from "@/components/validator-page/validatorStyles";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { formatDate } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, tRich, type MessageKey } from "@/i18n/messages";
import "@/i18n/namespaces/desktop-download";
import {
  DESKTOP_FEEDBACK_WAVE_ID,
  DESKTOP_WINDOWS_PUBLISHER,
} from "@/lib/desktop-releases/content";
import {
  getDesktopDownloadPath,
  getDesktopInstallers,
  type DesktopInstaller,
  type DesktopInstallerKind,
} from "@/lib/desktop-releases/releaseFiles";
import {
  getNewestDesktopRelease,
  type DesktopRelease,
  type DesktopReleases,
} from "@/lib/desktop-releases/releases";
import type { VisitorPlatform } from "@/lib/validator-page/detectSystem";
import DesktopAllFiles, { DesktopCheckDownload } from "./DesktopAllFiles";
import DesktopPageFrame from "./DesktopPageFrame";
import { formatDesktopFileSize } from "./desktopFileWords";

// Rendered on the server, in the locale the server renders.
const LOCALE = DEFAULT_LOCALE;
// The list's day, as a calendar date: the same day in every time zone.
const PUBLISHED_DATE: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
  day: "numeric",
};

const KIND_TEXT: Readonly<
  Record<
    DesktopInstallerKind,
    { readonly button: MessageKey; readonly summary: MessageKey }
  >
> = {
  windows: {
    button: "desktopPage.download.button.windows",
    summary: "desktopPage.download.summary.windows",
  },
  macos: {
    button: "desktopPage.download.button.macos",
    summary: "desktopPage.download.summary.macos",
  },
};

const FEEDBACK_HREF = getWaveRoute({
  waveId: DESKTOP_FEEDBACK_WAVE_ID,
  isDirectMessage: false,
  isApp: false,
});

// What 6529 Desktop is, as facts in the style of the download card's.
const ABOUT_FACTS: readonly {
  readonly label: MessageKey;
  readonly value: MessageKey;
}[] = [
  {
    label: "desktopPage.about.facts.runsOn.label",
    value: "desktopPage.about.facts.runsOn.value",
  },
  {
    label: "desktopPage.about.facts.shows.label",
    value: "desktopPage.about.facts.shows.value",
  },
  {
    label: "desktopPage.about.facts.signIn.label",
    value: "desktopPage.about.facts.signIn.value",
  },
  {
    label: "desktopPage.about.facts.updates.label",
    value: "desktopPage.about.facts.updates.value",
  },
  {
    label: "desktopPage.about.facts.replaces.label",
    value: "desktopPage.about.facts.replaces.value",
  },
];

/** The installers for this computer: one, or both when the system is unknown. */
function kindsFor(platform: VisitorPlatform): DesktopInstallerKind[] {
  switch (platform.system) {
    case "mac":
      return ["macos"];
    case "windows":
      return ["windows"];
    case "linux":
    case "other":
      return ["windows", "macos"];
  }
}

function summaryOf(installer: DesktopInstaller): string {
  const summary = t(LOCALE, KIND_TEXT[installer.kind].summary);
  const size = formatDesktopFileSize(installer.file.size);
  return size
    ? t(LOCALE, "desktopPage.download.summaryWithSize", { summary, size })
    : summary;
}

function buttonLabel(installer: DesktopInstaller): string {
  return t(LOCALE, "desktopPage.download.button.ariaLabel", {
    button: t(LOCALE, KIND_TEXT[installer.kind].button),
    file: installer.file.name,
  });
}

function Fact({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="tw-min-w-0">
      <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
        {label}
      </dt>
      <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-100">
        {children}
      </dd>
    </div>
  );
}

/**
 * One big button for this computer, chosen from the User-Agent header, the
 * other installer one click away, and the release's facts under them.
 */
function DownloadPanel({
  release,
  platform,
}: {
  readonly release: DesktopRelease;
  readonly platform: VisitorPlatform;
}) {
  const installers = getDesktopInstallers(release);
  const kinds = kindsFor(platform);
  const primary = installers.filter((entry) => kinds.includes(entry.kind));
  const others = installers.filter((entry) => !kinds.includes(entry.kind));
  return (
    <div className={`${ABOUT_CARD_CLASS_NAME} tw-p-5 sm:tw-p-6`}>
      {installers.length === 0 ? (
        <p className={`tw-m-0 ${BODY}`}>
          {t(LOCALE, "desktopPage.download.noInstallers")}
        </p>
      ) : (
        <div
          className={`tw-grid tw-gap-4 ${primary.length > 1 ? "sm:tw-grid-cols-2" : "sm:tw-max-w-md"}`}
        >
          {primary.map((installer) => (
            <div key={installer.kind} className="tw-flex tw-flex-col tw-gap-2">
              <a
                href={getDesktopDownloadPath(release, installer.file)}
                className={PRIMARY_BUTTON}
                aria-label={buttonLabel(installer)}
              >
                <ArrowDownTrayIcon aria-hidden="true" className="tw-size-6" />
                {t(LOCALE, KIND_TEXT[installer.kind].button)}
              </a>
              <p className="tw-m-0 tw-text-center tw-text-sm tw-leading-6 tw-text-iron-400">
                {summaryOf(installer)}
              </p>
            </div>
          ))}
        </div>
      )}
      {others.length > 0 && (
        <div className="tw-mt-4 tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-2">
          <span className="tw-text-sm tw-leading-6 tw-text-iron-300">
            {t(LOCALE, "desktopPage.download.alsoFor")}
          </span>
          {others.map((installer) => (
            <a
              key={installer.kind}
              href={getDesktopDownloadPath(release, installer.file)}
              className={SECONDARY_BUTTON}
              aria-label={buttonLabel(installer)}
            >
              <ArrowDownTrayIcon aria-hidden="true" className="tw-size-4" />
              {t(LOCALE, KIND_TEXT[installer.kind].button)}
              <span className="tw-font-normal tw-text-iron-400">
                {formatDesktopFileSize(installer.file.size)}
              </span>
            </a>
          ))}
        </div>
      )}
      <dl className="tw-m-0 tw-mt-6 tw-grid tw-grid-cols-1 tw-gap-4 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-pt-5 sm:tw-grid-cols-3">
        <Fact label={t(LOCALE, "desktopPage.download.facts.version")}>
          <span className="tw-font-mono">{release.version}</span>
        </Fact>
        <Fact label={t(LOCALE, "desktopPage.download.facts.published")}>
          {formatDate(LOCALE, release.publishedAt.slice(0, 10), PUBLISHED_DATE)}
        </Fact>
        <Fact label={t(LOCALE, "desktopPage.download.facts.signed")}>
          {t(LOCALE, "desktopPage.download.facts.signedValue", {
            publisher: DESKTOP_WINDOWS_PUBLISHER,
          })}
        </Fact>
      </dl>
    </div>
  );
}

function PlatformNote({ platform }: { readonly platform: VisitorPlatform }) {
  const key: MessageKey =
    platform.system === "other"
      ? "desktopPage.download.otherSystem"
      : "desktopPage.download.linux";
  return (
    <p className="tw-mb-0 tw-mt-4 tw-text-sm tw-leading-6 tw-text-iron-400">
      {t(LOCALE, key)}
    </p>
  );
}

function Section({
  id,
  heading,
  children,
}: {
  readonly id: string;
  readonly heading: string;
  readonly children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="tw-mb-14 tw-scroll-mt-24">
      <h2 id={id} className={`tw-mb-5 ${SECTION_HEADING}`}>
        {heading}
      </h2>
      {children}
    </section>
  );
}

function AboutFacts() {
  return (
    <dl
      className={`${ABOUT_CARD_CLASS_NAME} tw-m-0 tw-divide-y tw-divide-white/[0.06] tw-px-5`}
    >
      {ABOUT_FACTS.map((fact) => (
        <div
          key={fact.label}
          className="tw-grid tw-gap-1 tw-py-4 sm:tw-grid-cols-[11rem_minmax(0,1fr)] sm:tw-gap-6"
        >
          <dt className="tw-text-sm tw-font-semibold tw-leading-6 tw-text-iron-100">
            {t(LOCALE, fact.label)}
          </dt>
          <dd className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
            {t(LOCALE, fact.value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default function DesktopDownloadPage({
  releases,
  platform,
}: {
  readonly releases: DesktopReleases;
  /** The server's guess at the visitor's system, from the User-Agent. */
  readonly platform: VisitorPlatform;
}) {
  const release = getNewestDesktopRelease(releases.releases);
  return (
    <DesktopPageFrame
      current="download"
      eyebrow={
        release
          ? t(LOCALE, "desktopPage.download.eyebrow.release", {
              version: release.version,
            })
          : t(LOCALE, "desktopPage.download.eyebrow.none")
      }
      title={t(LOCALE, "desktopPage.download.title")}
      lead={t(LOCALE, "desktopPage.download.lead")}
    >
      <section
        id="download"
        aria-label={t(LOCALE, "desktopPage.download.section")}
        className="tw-mb-14 tw-scroll-mt-24"
      >
        {release ? (
          <DownloadPanel release={release} platform={platform} />
        ) : (
          <ReleaseSectionEmpty
            tone={releases.state === "error" ? "error" : "info"}
            message={t(
              LOCALE,
              releases.state === "error"
                ? "desktopPage.download.unavailable"
                : "desktopPage.download.notOutYet"
            )}
            action={
              releases.state === "error" ? (
                <a href="/desktop" className={SECONDARY_BUTTON}>
                  <ArrowPathIcon aria-hidden="true" className="tw-size-4" />
                  {t(LOCALE, "desktopPage.download.reload")}
                </a>
              ) : undefined
            }
          />
        )}
        <PlatformNote platform={platform} />
      </section>

      {release && (
        <Section
          id="desktop-check"
          heading={t(LOCALE, "desktopPage.check.heading")}
        >
          <DesktopCheckDownload release={release} />
        </Section>
      )}

      {release && (
        <Section
          id="all-files-title"
          heading={t(LOCALE, "desktopPage.files.heading")}
        >
          <DesktopAllFiles release={release} />
        </Section>
      )}

      {release?.notes && (
        <Section
          id="release-notes"
          heading={t(LOCALE, "desktopPage.download.notes.heading", {
            version: release.version,
          })}
        >
          <p className={`tw-m-0 tw-whitespace-pre-line ${BODY}`}>
            {release.notes}
          </p>
        </Section>
      )}

      <Section
        id="desktop-about"
        heading={t(LOCALE, "desktopPage.about.heading")}
      >
        <AboutFacts />
      </Section>

      <Section
        id="desktop-feedback"
        heading={t(LOCALE, "desktopPage.feedback.heading")}
      >
        <div
          className={`${ABOUT_CARD_CLASS_NAME} tw-flex tw-flex-col tw-gap-4 tw-p-5 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between`}
        >
          <p className={`tw-m-0 ${BODY}`}>
            {t(LOCALE, "desktopPage.feedback.body")}
          </p>
          <Link
            href={FEEDBACK_HREF}
            className={`${SECONDARY_BUTTON} tw-flex-none`}
          >
            <ChatBubbleLeftRightIcon aria-hidden="true" className="tw-size-4" />
            {t(LOCALE, "desktopPage.feedback.wave")}
          </Link>
        </div>
        <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
          {tRich(LOCALE, "desktopPage.download.next", {
            guide: (
              <Link key="guide" href="/desktop/guide" className={LINK}>
                {t(LOCALE, "desktopPage.download.guideLink")}
              </Link>
            ),
          })}
        </p>
      </Section>
    </DesktopPageFrame>
  );
}
