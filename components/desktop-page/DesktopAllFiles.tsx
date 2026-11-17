import ReleaseBuildLine from "@/components/release-section/ReleaseBuildLine";
import ReleaseCommandList from "@/components/release-section/ReleaseCommandList";
import ReleaseFilesTable from "@/components/release-section/ReleaseFilesTable";
import CopyChecksumButton from "@/components/validator-page/CopyChecksumButton";
import { BODY, CODE, LINK } from "@/components/validator-page/validatorStyles";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, tRich } from "@/i18n/messages";
import "@/i18n/namespaces/desktop-download";
import { DESKTOP_WINDOWS_PUBLISHER } from "@/lib/desktop-releases/content";
import {
  getDesktopDownloadPath,
  getDesktopInstallers,
  listDesktopReleaseFiles,
} from "@/lib/desktop-releases/releaseFiles";
import type { DesktopRelease } from "@/lib/desktop-releases/releases";
import { DESKTOP_RELEASE_LIST_KEYS } from "@/lib/desktop-releases/signingKeys";
import { desktopFileColumns, toDesktopFileRow } from "./desktopFileWords";

// Rendered on the server, in the locale the server renders.
const LOCALE = DEFAULT_LOCALE;
const SUBHEADING = "tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-50";
const LIST_PATH = "/desktop/releases.json";
const SIGNATURE_PATH = "/desktop/releases.json.sig";

function listLinks() {
  return {
    list: (
      <a key="list" href={LIST_PATH} className={LINK}>
        releases.json
      </a>
    ),
    signature: (
      <a key="signature" href={SIGNATURE_PATH} className={LINK}>
        releases.json.sig
      </a>
    ),
  };
}

/** Where the SHA-256 values come from: the signed list, and its key. */
function ReleaseListCheck() {
  const address = DESKTOP_RELEASE_LIST_KEYS[0]?.address;
  return (
    <div className="tw-flex tw-flex-col tw-gap-3">
      <h3 className={SUBHEADING}>
        {t(LOCALE, "desktopPage.check.list.heading")}
      </h3>
      <p className={`tw-m-0 ${BODY}`}>
        {tRich(LOCALE, "desktopPage.check.list.body", listLinks())}
      </p>
      {address && (
        <div className="tw-flex tw-items-center tw-gap-3">
          <code className={`${CODE} tw-min-w-0 tw-break-all`}>{address}</code>
          <CopyChecksumButton
            value={address}
            label={t(LOCALE, "desktopPage.check.list.addressLabel")}
          />
        </div>
      )}
    </div>
  );
}

/**
 * How to check a download: the command for each system, who signed the
 * installers, and where the SHA-256 values come from.
 */
export function DesktopCheckDownload({
  release,
}: {
  readonly release: DesktopRelease;
}) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-6">
      <div className="tw-flex tw-flex-col tw-gap-3">
        <p className={`tw-m-0 ${BODY}`}>
          {t(LOCALE, "desktopPage.check.body")}
        </p>
        <ReleaseCommandList
          rows={getDesktopInstallers(release).map(({ kind, file }) =>
            kind === "windows"
              ? {
                  system: t(LOCALE, "desktopPage.check.system.windows"),
                  commands: [`Get-FileHash .\\${file.name}`],
                }
              : {
                  system: t(LOCALE, "desktopPage.check.system.mac"),
                  commands: [`shasum -a 256 ${file.name}`],
                }
          )}
        />
      </div>
      <div className="tw-flex tw-flex-col tw-gap-3">
        <h3 className={SUBHEADING}>
          {t(LOCALE, "desktopPage.check.signed.heading")}
        </h3>
        <p className={`tw-m-0 ${BODY}`}>
          {t(LOCALE, "desktopPage.check.signed.windows", {
            publisher: DESKTOP_WINDOWS_PUBLISHER,
          })}
        </p>
        <p className={`tw-m-0 ${BODY}`}>
          {t(LOCALE, "desktopPage.check.signed.macos")}
        </p>
      </div>
      <ReleaseListCheck />
    </div>
  );
}

/** Every file of the release in one table, with its size and SHA-256. */
export default function DesktopAllFiles({
  release,
}: {
  readonly release: DesktopRelease;
}) {
  const rows = listDesktopReleaseFiles(release).map((entry) =>
    toDesktopFileRow(entry, getDesktopDownloadPath(release, entry.file))
  );
  return (
    <div className="tw-flex tw-flex-col tw-gap-6">
      <ReleaseBuildLine
        version={release.version}
        date={release.publishedAt.slice(0, 10)}
        commit={release.commit}
        withCommit="desktopPage.files.build.withCommit"
        withoutCommit="desktopPage.files.build.withoutCommit"
      />
      <ReleaseFilesTable
        rows={rows}
        columns={desktopFileColumns()}
        downloadText={t(LOCALE, "desktopPage.files.download.text")}
      />
    </div>
  );
}

/** The links to the signed list and its signature, for other pages. */
export function DesktopListLinks() {
  return (
    <p className={`tw-m-0 ${BODY}`}>
      {tRich(LOCALE, "desktopPage.releases.list", listLinks())}
    </p>
  );
}
