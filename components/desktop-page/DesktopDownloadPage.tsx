import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ReactNode } from "react";

import ReleaseSectionEmpty from "@/components/release-section/ReleaseSectionEmpty";
import {
  BODY,
  LINK,
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
  SECTION_HEADING,
} from "@/components/validator-page/validatorStyles";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, tRich, type MessageKey } from "@/i18n/messages";
import "@/i18n/namespaces/desktop-download";
import { DESKTOP_FEEDBACK_WAVE_ID } from "@/lib/desktop-releases/content";
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
import DesktopAllFiles from "./DesktopAllFiles";
import DesktopPageFrame from "./DesktopPageFrame";
import { formatDesktopFileSize } from "./desktopFileWords";

// Rendered on the server, in the locale the server renders.
const LOCALE = DEFAULT_LOCALE;

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

/**
 * One big button for this computer, chosen from the User-Agent header, and
 * the other installer one click away.
 */
function DownloadButtons({
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
  if (installers.length === 0) {
    return (
      <p className={`tw-m-0 ${BODY}`}>
        {t(LOCALE, "desktopPage.download.noInstallers")}
      </p>
    );
  }
  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      {primary.length > 0 && (
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
                {t(LOCALE, "desktopPage.download.buttonNote", {
                  version: release.version,
                  summary: summaryOf(installer),
                })}
              </p>
            </div>
          ))}
        </div>
      )}
      {others.length > 0 && (
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-2">
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
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function TextSection({
  id,
  heading,
  children,
}: {
  readonly id: string;
  readonly heading: string;
  readonly children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="tw-mb-12">
      <h2 id={id} className={SECTION_HEADING}>
        {heading}
      </h2>
      <div className="tw-mt-4 tw-flex tw-flex-col tw-gap-4">{children}</div>
    </section>
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
        className="tw-mb-12 tw-scroll-mt-24"
      >
        {release ? (
          <DownloadButtons release={release} platform={platform} />
        ) : (
          <ReleaseSectionEmpty
            message={t(
              LOCALE,
              releases.state === "error"
                ? "desktopPage.download.unavailable"
                : "desktopPage.download.notOutYet"
            )}
          />
        )}
        <p className={`tw-mb-0 tw-mt-6 ${BODY}`}>
          {t(LOCALE, "desktopPage.download.linux")}
        </p>
        <p className={`tw-mb-0 tw-mt-3 ${BODY}`}>
          {tRich(LOCALE, "desktopPage.download.next", {
            guide: (
              <Link key="guide" href="/desktop/guide" className={LINK}>
                {t(LOCALE, "desktopPage.download.guideLink")}
              </Link>
            ),
          })}
        </p>
      </section>

      <TextSection
        id="desktop-about"
        heading={t(LOCALE, "desktopPage.about.heading")}
      >
        <p className={`tw-m-0 ${BODY}`}>
          {t(LOCALE, "desktopPage.about.body")}
        </p>
        <p className={`tw-m-0 ${BODY}`}>
          {t(LOCALE, "desktopPage.about.session")}
        </p>
      </TextSection>

      {release?.notes && (
        <TextSection
          id="release-notes"
          heading={t(LOCALE, "desktopPage.download.notes.heading", {
            version: release.version,
          })}
        >
          <p className={`tw-m-0 tw-whitespace-pre-line ${BODY}`}>
            {release.notes}
          </p>
        </TextSection>
      )}

      {release && (
        <section
          id="all-files"
          aria-labelledby="all-files-title"
          className="tw-mb-12 tw-scroll-mt-24"
        >
          <h2 id="all-files-title" className={`tw-mb-4 ${SECTION_HEADING}`}>
            {t(LOCALE, "desktopPage.files.heading")}
          </h2>
          <DesktopAllFiles release={release} />
        </section>
      )}

      <TextSection
        id="desktop-feedback"
        heading={t(LOCALE, "desktopPage.feedback.heading")}
      >
        <p className={`tw-m-0 ${BODY}`}>
          {tRich(LOCALE, "desktopPage.feedback.body", {
            wave: (
              <Link key="wave" href={FEEDBACK_HREF} className={LINK}>
                {t(LOCALE, "desktopPage.feedback.wave")}
              </Link>
            ),
          })}
        </p>
      </TextSection>
    </DesktopPageFrame>
  );
}
