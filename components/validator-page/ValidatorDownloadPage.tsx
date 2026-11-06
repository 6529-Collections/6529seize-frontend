import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

import { ABOUT_INSET_CLASS_NAME } from "@/components/about/AboutLayout";
import { VALIDATOR_GUIDE_FOLDS } from "@/lib/validator-page/content/guideMarkdown";
import type { VisitorPlatform } from "@/lib/validator-page/detectSystem";
import {
  getOfferedRelease,
  type ReleaseFeedSnapshot,
  type ValidatorFeedSupport,
  type ValidatorRelease,
} from "@/lib/validator-page/releaseFeed";
import {
  formatFileSize,
  getDebNames,
  getReleaseDownloadPath,
  groupReleaseFiles,
  type ValidatorFileEntry,
  type ValidatorInstaller,
} from "@/lib/validator-page/releaseFiles";
import ValidatorAllFiles from "./ValidatorAllFiles";
import ValidatorDownloadChooser from "./ValidatorDownloadChooser";
import ValidatorDownloadRow, {
  type ValidatorDownloadOption,
} from "./ValidatorDownloadRow";
import ValidatorFold from "./ValidatorFold";
import ValidatorFoldOpener from "./ValidatorFoldOpener";
import ValidatorMarkdown from "./ValidatorMarkdown";
import ValidatorPageFrame, { ValidatorPageHeader } from "./ValidatorPageFrame";
import {
  ValidatorFeedback,
  ValidatorNeeds,
  ValidatorUpgrade,
} from "./ValidatorSections";
import ValidatorSteps from "./ValidatorSteps";
import { BODY } from "./validatorStyles";

const SYSTEM_IMAGES: Record<string, string> = {
  Mac: "/macos.png",
  Windows: "/windows.png",
  Linux: "/linux.png",
};

const LIST =
  "tw-m-0 tw-list-none tw-divide-y tw-divide-white/[0.06] tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.08] tw-bg-iron-950/60 tw-p-0";

function toOption(
  release: ValidatorRelease,
  installer: ValidatorInstaller
): ValidatorDownloadOption {
  return {
    kind: installer.kind,
    title: installer.title,
    summary: installer.summary,
    size: formatFileSize(installer.file.size),
    href: getReleaseDownloadPath(release, installer.file),
    fileName: installer.file.name,
    image: SYSTEM_IMAGES[installer.system] ?? "/linux.png",
  };
}

function toRow(release: ValidatorRelease, entry: ValidatorFileEntry) {
  return {
    title: entry.title,
    summary: entry.what,
    size: formatFileSize(entry.file.size),
    href: getReleaseDownloadPath(release, entry.file),
    fileName: entry.file.name,
    image: SYSTEM_IMAGES[entry.system] ?? "/linux.png",
  };
}

function guideFold(id: string) {
  const fold = VALIDATOR_GUIDE_FOLDS.find((entry) => entry.id === id);
  if (!fold) {
    throw new Error(`the guide has no section ${id}`);
  }
  return fold;
}

function notOutYetText(snapshot: ReleaseFeedSnapshot): string {
  const newest = snapshot.releases[0];
  if (newest?.unsafeReason) {
    return `The newest release, ${newest.version}, is listed as unsafe to run, so it isn't offered here. ${newest.unsafeReason}`;
  }
  return snapshot.state === "error"
    ? "The release list could not be loaded. Reload the page in a minute."
    : "The test release isn't out yet. When it is, its downloads appear here.";
}

function NotOutYet({ snapshot }: { readonly snapshot: ReleaseFeedSnapshot }) {
  return (
    <div
      className={`${ABOUT_INSET_CLASS_NAME} tw-flex tw-items-start tw-gap-3 tw-p-5`}
    >
      <ExclamationTriangleIcon
        aria-hidden="true"
        className="tw-mt-0.5 tw-size-5 tw-flex-none tw-text-iron-400"
      />
      <p className={`tw-m-0 ${BODY}`}>{notOutYetText(snapshot)}</p>
    </div>
  );
}

/** `2026-11-08T00:00:00Z` as `2026-11-08 00:00 UTC`. */
function formatUtc(time: string): string {
  return `${time.slice(0, 10)} ${time.slice(11, 16)} UTC`;
}

/**
 * The feed marks the offered release urgent: its reason, and the feed's
 * deadline, above the download, where every visitor sees it.
 */
function UrgentNotice({
  release,
  support,
}: {
  readonly release: ValidatorRelease;
  readonly support: ValidatorFeedSupport;
}) {
  if (!release.urgent) {
    return null;
  }
  return (
    <section
      id="urgent"
      aria-labelledby="urgent-title"
      className="tw-mb-6 tw-flex tw-items-start tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-error/40 tw-bg-error/10 tw-p-5 sm:tw-p-6"
    >
      <ExclamationTriangleIcon
        aria-hidden="true"
        className="tw-mt-1 tw-size-5 tw-flex-none tw-text-error"
      />
      <div className="tw-min-w-0">
        <h2
          id="urgent-title"
          className="tw-m-0 tw-text-lg tw-font-semibold tw-leading-7 tw-text-iron-50"
        >
          {release.version} is an urgent update
        </h2>
        {release.reason && (
          <p className={`tw-mb-0 tw-mt-2 ${BODY}`}>{release.reason}</p>
        )}
        {(support.deadline ?? support.deadlineReason) && (
          <p className={`tw-mb-0 tw-mt-2 ${BODY}`}>
            {support.deadline && support.minSupported && (
              <strong className="tw-font-semibold tw-text-iron-50">
                If you run a release before {support.minSupported}, update by{" "}
                {formatUtc(support.deadline)}.
              </strong>
            )}
            {support.deadline && support.deadlineReason && " "}
            {support.deadlineReason}
          </p>
        )}
      </div>
    </section>
  );
}

function LinuxAndTerminal({ release }: { readonly release: ValidatorRelease }) {
  const { installers, archives } = groupReleaseFiles(release);
  const linux = installers.filter((item) => item.system === "Linux");
  const terminal = archives.filter((item) => item.what === "Terminal archive");
  const fold = guideFold("linux-and-the-terminal");
  return (
    <ValidatorFold id={fold.id} title={fold.title}>
      <ul className={`${LIST} tw-mb-6`}>
        {linux.map((installer) => (
          <li key={installer.kind}>
            <ValidatorDownloadRow option={toOption(release, installer)} />
          </li>
        ))}
      </ul>
      <ValidatorMarkdown markdown={fold.markdown} />
      {terminal.length > 0 && (
        <ul className={`${LIST} tw-mt-2`}>
          {terminal.map((entry) => (
            <li key={entry.file.name}>
              <ValidatorDownloadRow option={toRow(release, entry)} />
            </li>
          ))}
        </ul>
      )}
    </ValidatorFold>
  );
}

export default function ValidatorDownloadPage({
  snapshot,
  platform,
}: {
  readonly snapshot: ReleaseFeedSnapshot;
  /** The server's guess at the visitor's system, from the User-Agent. */
  readonly platform: VisitorPlatform;
}) {
  const release = getOfferedRelease(snapshot.releases);
  const installers = release ? groupReleaseFiles(release).installers : [];
  const knownIssues = guideFold("known-issues");
  return (
    <ValidatorPageFrame current="download">
      <ValidatorFoldOpener />
      <ValidatorPageHeader
        eyebrow={release ? `Test release ${release.version}` : "Test release"}
        title="6529 Validator"
      >
        <p className="tw-mb-0 tw-mt-3 tw-max-w-2xl tw-text-lg tw-leading-8 tw-text-iron-300">
          It runs on your computer, computes each day&apos;s TDH from Ethereum
          and signs it.
        </p>
      </ValidatorPageHeader>

      <section
        id="download"
        aria-label="Download"
        className="tw-mb-12 tw-scroll-mt-24"
      >
        {release && (
          <UrgentNotice release={release} support={snapshot.support} />
        )}
        {release ? (
          <ValidatorDownloadChooser
            version={release.version}
            options={installers.map((item) => toOption(release, item))}
            initial={platform}
          />
        ) : (
          <NotOutYet snapshot={snapshot} />
        )}
      </section>

      <ValidatorUpgrade newest={release?.version} />

      <section aria-labelledby="steps">
        <h2 id="steps" className="tw-sr-only">
          Three steps
        </h2>
        <ValidatorSteps initial={platform} debs={getDebNames(release)} />
      </section>

      <ValidatorNeeds />
      <ValidatorFeedback />

      <div className="tw-mt-14 tw-flex tw-flex-col tw-gap-3">
        {release && <LinuxAndTerminal release={release} />}
        {release && (
          <ValidatorFold id="all-files" title="All files and checksums">
            <ValidatorAllFiles release={release} />
          </ValidatorFold>
        )}
        <ValidatorFold id={knownIssues.id} title={knownIssues.title}>
          <ValidatorMarkdown markdown={knownIssues.markdown} />
        </ValidatorFold>
      </div>
    </ValidatorPageFrame>
  );
}
