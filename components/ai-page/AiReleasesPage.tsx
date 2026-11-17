import ReleaseFilesTable, {
  type ReleaseFileRow,
} from "@/components/release-section/ReleaseFilesTable";
import ReleaseHistoryEntry, {
  type ReleaseFact,
} from "@/components/release-section/ReleaseHistoryEntry";
import ReleaseSectionEmpty from "@/components/release-section/ReleaseSectionEmpty";
import { CODE } from "@/components/validator-page/validatorStyles";
import { formatDate } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, tRich, type MessageKey } from "@/i18n/messages";
import "@/i18n/namespaces/ai-download";
import {
  getOfferedAiRelease,
  signedByOf,
  type AiRelease,
  type AiReleaseFeedSnapshot,
  type AiSystem,
} from "@/lib/ai-page/releaseFeed";
import {
  getAiDownloadPath,
  groupAiReleaseFiles,
  type AiFileEntry,
} from "@/lib/ai-page/releaseFiles";
import AiPageFrame, { AI_BODY } from "./AiPageFrame";
import { signedByText } from "./AiTrustBadges";
import { formatAiFileSize } from "./formatAiFileSize";

// Rendered on the server, in the locale the server renders.
const LOCALE = DEFAULT_LOCALE;
// The list's day, as a calendar date: the same day in every time zone.
const RELEASE_DATE: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
  day: "numeric",
};

const SYSTEM_TITLES: Readonly<Record<AiSystem, MessageKey>> = {
  "macos-arm64": "ai.files.family.mac",
  "windows-x64": "ai.files.family.windows",
  "linux-x86_64-cpu": "ai.releases.file.linuxX64",
  "linux-x86_64-cuda": "ai.releases.file.linuxCuda",
  "linux-arm64-cpu": "ai.releases.file.linuxArm64",
};

function toRow(
  release: AiRelease,
  entry: AiFileEntry,
  offered: boolean
): ReleaseFileRow {
  const { file } = entry;
  return {
    name: file.name,
    title: t(
      LOCALE,
      file.system ? SYSTEM_TITLES[file.system] : "ai.releases.file.other"
    ),
    // A package's kind ("Disk image"), or what a release file holds.
    what: file.system ? entry.label : entry.detail,
    size: formatAiFileSize(file.size) ?? t(LOCALE, "ai.releases.sizeUnknown"),
    sha256: file.sha256,
    copyLabel: t(LOCALE, "ai.files.sha256.label", { file: file.name }),
    publisher: signedByText(file.signedBy ?? signedByOf(file)),
    // Only the newest release's files are handed out.
    href: offered ? getAiDownloadPath(release, file) : undefined,
    downloadLabel: t(LOCALE, "ai.files.download.label", { file: file.name }),
  };
}

function facts(release: AiRelease): ReleaseFact[] {
  return [
    {
      term: t(LOCALE, "ai.releases.published"),
      value: formatDate(LOCALE, release.date, RELEASE_DATE),
    },
    { term: t(LOCALE, "ai.releases.channel"), value: release.channel },
    ...(release.commit
      ? [
          {
            term: t(LOCALE, "ai.releases.commit"),
            value: <span className="tw-font-mono">{release.commit}</span>,
          },
        ]
      : []),
  ];
}

/**
 * One release. The newest is Latest unless the list calls it unsafe; only
 * its files link to a download.
 */
function Release({
  release,
  offered,
}: {
  readonly release: AiRelease;
  readonly offered: boolean;
}) {
  const rows = groupAiReleaseFiles(release).groups.flatMap((group) =>
    group.entries.map((entry) => toRow(release, entry, offered))
  );
  return (
    <ReleaseHistoryEntry
      version={release.version}
      latest={offered ? t(LOCALE, "ai.releases.latest") : undefined}
      unsafe={
        release.unsafeReason
          ? {
              badge: t(LOCALE, "ai.releases.unsafe"),
              line: t(LOCALE, "ai.releases.unsafeLine", {
                reason: release.unsafeReason,
              }),
            }
          : undefined
      }
      facts={facts(release)}
      notes={release.notes}
      filesHeading={t(LOCALE, "ai.releases.files")}
      files={
        rows.length > 0 ? (
          <ReleaseFilesTable
            rows={rows}
            columns={{
              file: t(LOCALE, "ai.releases.column.file"),
              size: t(LOCALE, "ai.releases.column.size"),
              sha256: t(LOCALE, "ai.releases.column.sha256"),
              publisher: t(LOCALE, "ai.releases.column.signer"),
              download: t(LOCALE, "ai.releases.column.download"),
            }}
            downloadText={t(LOCALE, "ai.files.download.text")}
            fullHash
          />
        ) : undefined
      }
    />
  );
}

function ListLinks() {
  const link = (key: string, href: string) => (
    <a key={key} href={href} className={CODE}>
      {href}
    </a>
  );
  return (
    <p className={`tw-m-0 ${AI_BODY}`}>
      {tRich(LOCALE, "ai.releases.list", {
        list: link("list", "/ai/releases.json"),
        signature: link("signature", "/ai/releases.json.sig"),
      })}
    </p>
  );
}

/**
 * Every release in 6529 AI's signed release list, newest first, each under
 * its version as anchor, with its notes and each file's full SHA-256.
 */
export default function AiReleasesPage({
  snapshot,
}: {
  readonly snapshot: AiReleaseFeedSnapshot;
}) {
  const { releases } = snapshot;
  const offered = getOfferedAiRelease(releases);
  return (
    <AiPageFrame
      current="releases"
      eyebrow={t(LOCALE, "ai.releases.eyebrow")}
      title={t(LOCALE, "ai.releases.title")}
      lead={t(LOCALE, "ai.releases.lead")}
    >
      <div className="tw-mt-10 tw-flex tw-flex-col tw-gap-10">
        {releases.length === 0 ? (
          <ReleaseSectionEmpty
            tone={snapshot.state === "error" ? "error" : "info"}
            message={t(
              LOCALE,
              snapshot.state === "error"
                ? "ai.releases.unavailable"
                : "ai.releases.none"
            )}
          />
        ) : (
          releases.map((release) => (
            <Release
              key={release.version}
              release={release}
              offered={release === offered}
            />
          ))
        )}
        {snapshot.state === "ok" && <ListLinks />}
      </div>
    </AiPageFrame>
  );
}
