import ReleaseFilesTable from "@/components/release-section/ReleaseFilesTable";
import ReleaseSectionEmpty from "@/components/release-section/ReleaseSectionEmpty";
import {
  BODY,
  SECTION_HEADING,
} from "@/components/validator-page/validatorStyles";
import { formatDate } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/desktop-download";
import {
  getDesktopDownloadPath,
  listDesktopReleaseFiles,
} from "@/lib/desktop-releases/releaseFiles";
import type {
  DesktopRelease,
  DesktopReleases,
} from "@/lib/desktop-releases/releases";
import { DesktopListLinks } from "./DesktopAllFiles";
import DesktopPageFrame from "./DesktopPageFrame";
import { desktopFileColumns, toDesktopFileRow } from "./desktopFileWords";

// Rendered on the server, in the locale the server renders.
const LOCALE = DEFAULT_LOCALE;
// The list's day, as a calendar date: the same day in every time zone.
const PUBLISHED_DATE: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
  day: "numeric",
};

function ReleaseEntry({
  release,
  isNewest,
}: {
  readonly release: DesktopRelease;
  readonly isNewest: boolean;
}) {
  const headingId = `release-${release.version}`;
  return (
    // The list's notes_url links here: /desktop/releases#0.1.0-rc.2.
    <section
      id={release.version}
      aria-labelledby={headingId}
      className="tw-scroll-mt-24 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-pt-8"
    >
      <h2
        id={headingId}
        className={`tw-flex tw-flex-wrap tw-items-center tw-gap-3 ${SECTION_HEADING}`}
      >
        <span className="tw-font-mono">{release.version}</span>
        {isNewest && (
          <span className="tw-rounded-full tw-border tw-border-solid tw-border-primary-400/60 tw-bg-primary-500/10 tw-px-2.5 tw-py-0.5 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-50">
            {t(LOCALE, "desktopPage.releases.newest")}
          </span>
        )}
      </h2>
      <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
        {t(LOCALE, "desktopPage.releases.published", {
          date: formatDate(
            LOCALE,
            release.publishedAt.slice(0, 10),
            PUBLISHED_DATE
          ),
          channel: release.channel,
        })}
      </p>
      {release.notes && (
        <p className={`tw-mb-0 tw-mt-4 tw-whitespace-pre-line ${BODY}`}>
          {release.notes}
        </p>
      )}
      <div className="tw-mt-6">
        <ReleaseFilesTable
          rows={listDesktopReleaseFiles(release).map((entry) =>
            toDesktopFileRow(
              entry,
              // Only the newest release's files are handed out.
              isNewest ? getDesktopDownloadPath(release, entry.file) : undefined
            )
          )}
          columns={desktopFileColumns()}
          downloadText={t(LOCALE, "desktopPage.files.download.text")}
        />
      </div>
    </section>
  );
}

/** Every release in the signed list, newest first, with each file's SHA-256. */
export default function DesktopReleaseHistory({
  releases,
}: {
  readonly releases: DesktopReleases;
}) {
  const list = releases.releases;
  return (
    <DesktopPageFrame
      current="releases"
      eyebrow={t(LOCALE, "desktopPage.releases.eyebrow")}
      title={t(LOCALE, "desktopPage.releases.title")}
      lead={t(LOCALE, "desktopPage.releases.lead")}
    >
      <div className="tw-flex tw-flex-col tw-gap-10">
        {list.length === 0 ? (
          <ReleaseSectionEmpty
            message={t(
              LOCALE,
              releases.state === "error"
                ? "desktopPage.releases.unavailable"
                : "desktopPage.releases.none"
            )}
          />
        ) : (
          list.map((release, index) => (
            <ReleaseEntry
              key={release.version}
              release={release}
              isNewest={index === 0}
            />
          ))
        )}
        {releases.state === "ok" && <DesktopListLinks />}
      </div>
    </DesktopPageFrame>
  );
}
