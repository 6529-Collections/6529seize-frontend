import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

import { ABOUT_INSET_CLASS_NAME } from "@/components/about/AboutLayout";
import {
  BODY,
  LINK,
  SECTION_HEADING,
} from "@/components/validator-page/validatorStyles";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, tRich, type MessageKey } from "@/i18n/messages";
import "@/i18n/namespaces/ai-download";
import {
  getNewestAiRelease,
  type AiRelease,
  type AiReleaseFeedSnapshot,
} from "@/lib/ai-page/releaseFeed";
import {
  getAiDownloadPath,
  groupAiReleaseFiles,
  type AiInstaller,
  type AiInstallerKind,
} from "@/lib/ai-page/releaseFiles";
import type { VisitorPlatform } from "@/lib/validator-page/detectSystem";
import AiAllFiles from "./AiAllFiles";
import AiDownloadChooser, {
  type AiChooserText,
  type AiDownloadOption,
} from "./AiDownloadChooser";
import AiPageFrame from "./AiPageFrame";
import { formatAiFileSize } from "./formatAiFileSize";

// Rendered on the server, in the locale the server renders.
const LOCALE = DEFAULT_LOCALE;

const BUTTON_TEXT: Readonly<Record<AiInstallerKind, MessageKey>> = {
  macos: "ai.download.button.macos",
  windows: "ai.download.button.windows",
  "linux-x64": "ai.download.button.linuxX64",
  "linux-x64-cuda": "ai.download.button.linuxCuda",
  "linux-arm64": "ai.download.button.linuxArm64",
};

function toOption(
  release: AiRelease,
  installer: AiInstaller
): AiDownloadOption {
  const size = formatAiFileSize(installer.file.size);
  const buttonText = t(LOCALE, BUTTON_TEXT[installer.kind]);
  const summary = size
    ? t(LOCALE, "ai.download.summaryWithSize", {
        summary: installer.summary,
        size,
      })
    : installer.summary;
  return {
    kind: installer.kind,
    title: installer.title,
    summary,
    note: t(LOCALE, "ai.download.buttonNote", {
      version: release.version,
      summary,
    }),
    href: getAiDownloadPath(release, installer.file),
    image: installer.image,
    buttonText,
    buttonLabel: t(LOCALE, "ai.download.button.ariaLabel", {
      button: buttonText,
      file: installer.file.name,
    }),
    rowLabel: t(LOCALE, "ai.download.row.label", {
      file: installer.file.name,
    }),
  };
}

function chooserText(): AiChooserText {
  return {
    armNote: t(LOCALE, "ai.download.armNote"),
    cudaText: t(LOCALE, "ai.download.cuda.text"),
    cudaButton: t(LOCALE, "ai.download.cuda.button"),
    otherSystems: t(LOCALE, "ai.download.otherSystems"),
    rowText: t(LOCALE, "ai.download.row.text"),
  };
}

/** No release to offer: none uploaded yet, or the list failed to load. */
function NoRelease({
  state,
}: {
  readonly state: AiReleaseFeedSnapshot["state"];
}) {
  return (
    <div
      className={`${ABOUT_INSET_CLASS_NAME} tw-flex tw-items-start tw-gap-3 tw-p-5`}
    >
      <ExclamationTriangleIcon
        aria-hidden="true"
        className="tw-mt-0.5 tw-size-5 tw-flex-none tw-text-iron-400"
      />
      <p className={`tw-m-0 ${BODY}`}>
        {t(
          LOCALE,
          state === "error"
            ? "ai.download.unavailable"
            : "ai.download.notOutYet"
        )}
      </p>
    </div>
  );
}

export default function AiDownloadPage({
  snapshot,
  platform,
}: {
  readonly snapshot: AiReleaseFeedSnapshot;
  /** The server's guess at the visitor's system, from the User-Agent. */
  readonly platform: VisitorPlatform;
}) {
  const release = getNewestAiRelease(snapshot.releases);
  const installers = release ? groupAiReleaseFiles(release).installers : [];
  return (
    <AiPageFrame
      current="download"
      eyebrow={
        release
          ? t(LOCALE, "ai.download.eyebrow.release", {
              version: release.version,
            })
          : t(LOCALE, "ai.download.eyebrow.none")
      }
      title={t(LOCALE, "ai.download.title")}
      lead={t(LOCALE, "ai.download.lead")}
    >
      <section
        id="download"
        aria-label={t(LOCALE, "ai.download.section")}
        className="tw-mb-12 tw-scroll-mt-24"
      >
        {release ? (
          <AiDownloadChooser
            options={installers.map((installer) =>
              toOption(release, installer)
            )}
            initial={platform}
            text={chooserText()}
          />
        ) : (
          <NoRelease state={snapshot.state} />
        )}
        <p className={`tw-mb-0 tw-mt-6 ${BODY}`}>
          {tRich(LOCALE, "ai.download.next", {
            guide: (
              <Link key="guide" href="/ai/guide" className={LINK}>
                {t(LOCALE, "ai.download.guideLink")}
              </Link>
            ),
          })}
        </p>
      </section>

      {release?.notes && (
        <section aria-labelledby="release-notes" className="tw-mb-12">
          <h2 id="release-notes" className={SECTION_HEADING}>
            {t(LOCALE, "ai.download.notes.heading", {
              version: release.version,
            })}
          </h2>
          <p className={`tw-mb-0 tw-mt-4 tw-whitespace-pre-line ${BODY}`}>
            {release.notes}
          </p>
        </section>
      )}

      {release && (
        <section
          id="all-files"
          aria-labelledby="all-files-title"
          className="tw-scroll-mt-24"
        >
          <h2 id="all-files-title" className={`tw-mb-4 ${SECTION_HEADING}`}>
            {t(LOCALE, "ai.files.heading")}
          </h2>
          <AiAllFiles release={release} />
        </section>
      )}
    </AiPageFrame>
  );
}
