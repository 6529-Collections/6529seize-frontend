import type { ReactNode } from "react";

import { ABOUT_CARD_CLASS_NAME } from "@/components/about/AboutLayout";
import type {
  ReleaseFeedSnapshot,
  ValidatorRelease,
} from "@/lib/validator-page/releaseFeed";
import {
  formatFileSize,
  getReleaseDownloadPath,
} from "@/lib/validator-page/releaseFiles";
import CopyChecksumButton from "./CopyChecksumButton";
import ValidatorPageFrame, { ValidatorPageHeader } from "./ValidatorPageFrame";

const BODY = "tw-text-base tw-leading-7 tw-text-iron-300";
const LINK =
  "tw-font-medium tw-text-primary-300 tw-underline tw-decoration-primary-300/40 tw-underline-offset-4 hover:tw-decoration-primary-300";
const CODE =
  "tw-break-words tw-rounded tw-bg-iron-900 tw-px-1.5 tw-py-0.5 tw-font-mono tw-text-[0.85em] tw-text-iron-100";

function MetaRow({
  term,
  children,
}: {
  readonly term: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="tw-grid tw-gap-1 sm:tw-grid-cols-[8rem_1fr] sm:tw-gap-3">
      <dt className="tw-text-sm tw-font-semibold tw-text-iron-400">{term}</dt>
      <dd className="tw-m-0 tw-min-w-0 tw-break-all tw-text-sm tw-leading-6 tw-text-iron-200">
        {children}
      </dd>
    </div>
  );
}

function ReleaseEntry({
  release,
  isLatest,
}: {
  readonly release: ValidatorRelease;
  readonly isLatest: boolean;
}) {
  const headingId = `release-${release.version}`;
  return (
    <article
      aria-labelledby={headingId}
      className={`${ABOUT_CARD_CLASS_NAME} tw-p-5 sm:tw-p-6`}
    >
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
        <h2
          id={headingId}
          className="tw-m-0 tw-font-mono tw-text-xl tw-font-semibold tw-text-iron-50"
        >
          {release.version}
        </h2>
        {isLatest && (
          <span className="tw-rounded-full tw-border tw-border-solid tw-border-primary-400/40 tw-bg-primary-500/10 tw-px-2.5 tw-py-0.5 tw-text-xs tw-font-semibold tw-text-iron-100">
            Latest
          </span>
        )}
      </div>
      <dl className="tw-mb-0 tw-mt-4 tw-grid tw-gap-2">
        <MetaRow term="Published">{release.publishedAt.slice(0, 10)}</MetaRow>
        <MetaRow term="Channel">{release.channel}</MetaRow>
        {release.commit && (
          <MetaRow term="Commit">
            <span className="tw-font-mono">{release.commit}</span>
          </MetaRow>
        )}
        {release.softwareId && (
          <MetaRow term="Software ID">
            <span className="tw-font-mono">{release.softwareId}</span>
          </MetaRow>
        )}
      </dl>
      {release.notes && (
        <p className={`tw-mb-0 tw-mt-4 tw-whitespace-pre-line ${BODY}`}>
          {release.notes}
        </p>
      )}
      <h3 className="tw-mb-3 tw-mt-6 tw-text-base tw-font-semibold tw-text-iron-50">
        Files
      </h3>
      <ul className="tw-m-0 tw-list-none tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-white/[0.06] tw-border-0 tw-border-y tw-border-solid tw-border-white/[0.06] tw-p-0">
        {release.files.map((file) => {
          const size = formatFileSize(file.size);
          return (
            <li
              key={file.name}
              className="tw-flex tw-flex-col tw-gap-2 tw-py-3"
            >
              <div className="tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-3">
                <a
                  href={getReleaseDownloadPath(release, file)}
                  className={`${LINK} tw-break-all tw-font-mono tw-text-sm`}
                >
                  {file.name}
                </a>
                {size && (
                  <span className="tw-text-sm tw-text-iron-500">{size}</span>
                )}
              </div>
              <div className="tw-flex tw-items-start tw-gap-3">
                <code className="tw-min-w-0 tw-flex-1 tw-break-all tw-font-mono tw-text-[13px] tw-leading-5 tw-text-iron-300">
                  {file.sha256}
                </code>
                <CopyChecksumButton
                  value={file.sha256}
                  label={`SHA-256 of ${file.name} in ${release.version}`}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </article>
  );
}

export default function ValidatorReleaseHistory({
  snapshot,
}: {
  readonly snapshot: ReleaseFeedSnapshot;
}) {
  return (
    <ValidatorPageFrame current="releases">
      <ValidatorPageHeader
        eyebrow="Releases"
        title="All releases and checksums"
      >
        <p className={`tw-mb-0 tw-mt-4 tw-max-w-2xl ${BODY}`}>
          Every test release of the validator, newest first, with its notes and
          the SHA-256 of each file. The list comes from the signed release feed,{" "}
          <a href="/validator/releases.json" className={LINK}>
            releases.json
          </a>
          , and its signature,{" "}
          <a href="/validator/releases.json.sig" className={LINK}>
            releases.json.sig
          </a>
          .
        </p>
      </ValidatorPageHeader>
      {snapshot.releases.length === 0 ? (
        <p className={`${ABOUT_CARD_CLASS_NAME} tw-m-0 tw-p-5 ${BODY}`}>
          {snapshot.state === "error"
            ? "The release list could not be loaded. Reload the page in a minute."
            : "No release yet. The test release appears here when it is out."}
        </p>
      ) : (
        <div className="tw-grid tw-gap-5">
          {snapshot.releases.map((release, index) => (
            <ReleaseEntry
              key={release.version}
              release={release}
              isLatest={index === 0}
            />
          ))}
        </div>
      )}
      <p className="tw-mb-0 tw-mt-8 tw-text-sm tw-leading-6 tw-text-iron-500">
        To check a file, compare its SHA-256 with the one here:{" "}
        <code className={CODE}>shasum -a 256 &lt;file&gt;</code> on a Mac,{" "}
        <code className={CODE}>Get-FileHash &lt;file&gt;</code> on Windows,{" "}
        <code className={CODE}>sha256sum &lt;file&gt;</code> on Linux.
      </p>
    </ValidatorPageFrame>
  );
}
