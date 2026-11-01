import {
  ArrowDownTrayIcon,
  BookOpenIcon,
  ExclamationTriangleIcon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";

import {
  ABOUT_CARD_CLASS_NAME,
  ABOUT_INSET_CLASS_NAME,
} from "@/components/about/AboutLayout";
import {
  ANY_MACHINE_QUOTE,
  describeStatusDmAccount,
  getBaseVersion,
  VALIDATOR_FEEDBACK_WAVE,
} from "@/lib/validator-page/content/pageText";
import type {
  ReleaseFeedSnapshot,
  ValidatorRelease,
  ValidatorReleaseFile,
} from "@/lib/validator-page/releaseFeed";
import {
  formatFileSize,
  getReleaseDownloadPath,
  groupReleaseFiles,
  shortCommit,
  type ValidatorInstaller,
  type ValidatorInstallerKind,
} from "@/lib/validator-page/releaseFiles";
import CopyChecksumButton from "./CopyChecksumButton";
import ValidatorPageFrame, { ValidatorPageHeader } from "./ValidatorPageFrame";

const SECTION_HEADING =
  "tw-m-0 tw-text-2xl tw-font-semibold tw-leading-8 tw-tracking-tight tw-text-iron-50";
const BODY = "tw-text-base tw-leading-7 tw-text-iron-300";
const CODE =
  "tw-break-words tw-rounded tw-bg-iron-900 tw-px-1.5 tw-py-0.5 tw-font-mono tw-text-[0.85em] tw-text-iron-100";
const LINK =
  "tw-font-medium tw-text-primary-300 tw-underline tw-decoration-primary-300/40 tw-underline-offset-4 hover:tw-decoration-primary-300";

const SYSTEM_IMAGES: Record<ValidatorInstallerKind, string> = {
  macos: "/macos.png",
  windows: "/windows.png",
  "deb-x64": "/linux.png",
  "deb-arm64": "/linux.png",
  appimage: "/linux.png",
};

function formatDate(value: string): string {
  return value.slice(0, 10);
}

function Checksum({ file }: { readonly file: ValidatorReleaseFile }) {
  return (
    <div className="tw-flex tw-items-start tw-gap-3">
      <div className="tw-min-w-0 tw-flex-1">
        <span className="tw-block tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
          SHA-256
        </span>
        <code className="tw-mt-1 tw-block tw-break-all tw-font-mono tw-text-[13px] tw-leading-5 tw-text-iron-200">
          {file.sha256}
        </code>
      </div>
      <CopyChecksumButton
        value={file.sha256}
        label={`SHA-256 of ${file.name}`}
      />
    </div>
  );
}

function InstallerCard({
  release,
  installer,
}: {
  readonly release: ValidatorRelease;
  readonly installer: ValidatorInstaller;
}) {
  const size = formatFileSize(installer.file.size);
  const headingId = `download-${installer.kind}`;
  return (
    <section
      aria-labelledby={headingId}
      className={`${ABOUT_CARD_CLASS_NAME} tw-flex tw-flex-col tw-gap-4 tw-p-5`}
    >
      <div className="tw-flex tw-items-start tw-gap-3">
        <span className="tw-flex tw-size-11 tw-flex-none tw-items-center tw-justify-center tw-rounded-lg tw-bg-white">
          <Image
            unoptimized
            src={SYSTEM_IMAGES[installer.kind]}
            alt=""
            width={28}
            height={28}
            className="tw-size-7 tw-object-contain"
          />
        </span>
        <div className="tw-min-w-0">
          <h3
            id={headingId}
            className="tw-m-0 tw-text-lg tw-font-semibold tw-leading-7 tw-text-iron-50"
          >
            {installer.title}
          </h3>
          <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-400">
            {installer.forMachines}
          </p>
        </div>
      </div>
      <a
        href={getReleaseDownloadPath(release, installer.file)}
        className="tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-bg-primary-500 tw-px-4 tw-text-base tw-font-semibold tw-text-white tw-no-underline tw-transition hover:tw-bg-primary-600 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950"
      >
        <ArrowDownTrayIcon aria-hidden="true" className="tw-size-5" />
        <span>
          Download
          <span className="tw-sr-only"> {installer.file.name}</span>
        </span>
      </a>
      <p className="tw-m-0 tw-break-all tw-font-mono tw-text-[13px] tw-leading-5 tw-text-iron-300">
        {installer.file.name}
        {size && (
          <span className="tw-whitespace-nowrap tw-font-sans tw-text-iron-500">
            {" "}
            · {size}
          </span>
        )}
      </p>
      <Checksum file={installer.file} />
      <p className="tw-m-0 tw-mt-auto tw-text-sm tw-leading-6 tw-text-iron-400">
        {installer.signing}
      </p>
    </section>
  );
}

function OtherDownloads({ release }: { readonly release: ValidatorRelease }) {
  const { archives } = groupReleaseFiles(release);
  if (archives.length === 0) {
    return null;
  }
  return (
    <section aria-labelledby="other-downloads" className="tw-mt-12">
      <h2 id="other-downloads" className={SECTION_HEADING}>
        Other downloads
      </h2>
      <p className={`tw-mb-5 tw-mt-3 ${BODY}`}>
        Archives for the terminal. Each holds the validator program and the
        install guide in <code className={CODE}>docs/install/</code>.
      </p>
      <ul className="tw-m-0 tw-grid tw-list-none tw-gap-3 tw-p-0">
        {archives.map((archive) => {
          const size = formatFileSize(archive.file.size);
          return (
            <li
              key={archive.file.name}
              className={`${ABOUT_INSET_CLASS_NAME} tw-flex tw-flex-col tw-gap-3 tw-p-4`}
            >
              <div className="tw-flex tw-flex-wrap tw-items-baseline tw-justify-between tw-gap-x-4 tw-gap-y-2">
                <div className="tw-min-w-0">
                  <p className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50">
                    {archive.title}
                  </p>
                  <p className="tw-m-0 tw-break-all tw-font-mono tw-text-[13px] tw-leading-5 tw-text-iron-400">
                    {archive.file.name}
                    {size && (
                      <span className="tw-whitespace-nowrap tw-font-sans">
                        {" "}
                        · {size}
                      </span>
                    )}
                  </p>
                </div>
                <a
                  href={getReleaseDownloadPath(release, archive.file)}
                  className="tw-inline-flex tw-min-h-9 tw-items-center tw-gap-1.5 tw-rounded-lg tw-border tw-border-solid tw-border-white/15 tw-px-3 tw-text-sm tw-font-semibold tw-text-iron-100 tw-no-underline hover:tw-border-primary-400/60 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                >
                  <ArrowDownTrayIcon aria-hidden="true" className="tw-size-4" />
                  Download
                  <span className="tw-sr-only"> {archive.file.name}</span>
                </a>
              </div>
              <Checksum file={archive.file} />
              {archive.signing && (
                <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-400">
                  {archive.signing}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function CheckYourDownload({
  release,
}: {
  readonly release: ValidatorRelease;
}) {
  const { checksums } = groupReleaseFiles(release);
  return (
    <section aria-labelledby="check-download" className="tw-mt-12">
      <h2 id="check-download" className={SECTION_HEADING}>
        Check your download
      </h2>
      <p className={`tw-mb-4 tw-mt-3 ${BODY}`}>
        Compute the file&apos;s SHA-256 and compare it with the one on this
        page. If they differ, delete the file.
      </p>
      <ul className="tw-mb-5 tw-list-disc tw-space-y-2 tw-pl-6">
        <li className={BODY}>
          Mac, in Terminal:{" "}
          <code className={CODE}>shasum -a 256 6529-Validator-0.1.0.dmg</code>
        </li>
        <li className={BODY}>
          Windows, in PowerShell:{" "}
          <code className={CODE}>
            Get-FileHash .\6529-Validator-0.1.0-x64.msi
          </code>{" "}
          (it prints capital letters; the digits and letters must match)
        </li>
        <li className={BODY}>
          Linux:{" "}
          <code className={CODE}>sha256sum 6529-validator_0.1.0_amd64.deb</code>
        </li>
      </ul>
      {checksums && (
        <p className={`tw-mb-5 ${BODY}`}>
          <a href={getReleaseDownloadPath(release, checksums)} className={LINK}>
            SHA256SUMS
          </a>{" "}
          lists the SHA-256 of every file in this release. On Linux, with it in
          the same folder as your download, run{" "}
          <code className={CODE}>
            sha256sum --check --ignore-missing SHA256SUMS
          </code>
          .
        </p>
      )}
      <p className={`tw-mb-3 ${BODY}`}>
        The Mac app and the Windows installer are signed by 6529 Collection LLC.
      </p>
      <ul className="tw-m-0 tw-list-disc tw-space-y-2 tw-pl-6">
        <li className={BODY}>
          Mac: macOS asks if you are sure you want to open an app downloaded
          from the internet. Press Open. If it says it could not verify the app,
          do not open it.
        </li>
        <li className={BODY}>
          Windows: if &ldquo;Windows protected your PC&rdquo; appears, press
          More info, check that the publisher is 6529 Collection LLC, and press
          Run anyway. User Account Control then shows &ldquo;Verified publisher:
          6529 Collection LLC&rdquo;. If it shows another publisher, or none,
          stop.
        </li>
        <li className={BODY}>Linux: the SHA-256 is the only check.</li>
      </ul>
    </section>
  );
}

function DownloadArea({
  snapshot,
}: {
  readonly snapshot: ReleaseFeedSnapshot;
}) {
  const release = snapshot.releases[0];
  if (!release) {
    const unavailable = snapshot.state === "error";
    return (
      <div
        className={`${ABOUT_INSET_CLASS_NAME} tw-mt-5 tw-flex tw-items-start tw-gap-3 tw-p-5`}
      >
        <ExclamationTriangleIcon
          aria-hidden="true"
          className="tw-mt-0.5 tw-size-5 tw-flex-none tw-text-iron-400"
        />
        <p className={`tw-m-0 ${BODY}`}>
          {unavailable
            ? "The release list could not be loaded. Reload the page in a minute."
            : "The test release isn't out yet. When it is, its downloads and checksums appear here."}
        </p>
      </div>
    );
  }
  const { installers } = groupReleaseFiles(release);
  return (
    <>
      <p className={`tw-mb-5 tw-mt-3 ${BODY}`}>
        Pick the file for your system. Each one shows its SHA-256, so you can
        check the file before you open it.
      </p>
      <div className="tw-grid tw-gap-4 md:tw-grid-cols-2">
        {installers.map((installer) => (
          <InstallerCard
            key={installer.kind}
            release={release}
            installer={installer}
          />
        ))}
      </div>
      <OtherDownloads release={release} />
      <CheckYourDownload release={release} />
    </>
  );
}

function ReleaseLine({ release }: { readonly release: ValidatorRelease }) {
  const commit = shortCommit(release.commit);
  return (
    <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
      Build <span className="tw-font-mono">{release.version}</span>, published{" "}
      {formatDate(release.publishedAt)}
      {commit && (
        <>
          , commit <span className="tw-font-mono">{commit}</span>
        </>
      )}
      .
    </p>
  );
}

const NEXT_STEPS = [
  {
    href: "/validator/guide",
    icon: BookOpenIcon,
    title: "Tester guide",
    text: "Install, make the key, sign the grant and add the peers. About 30 minutes.",
  },
  {
    href: "/validator/known-issues",
    icon: ExclamationTriangleIcon,
    title: "Known issues",
    text: "What testers have run into, with a workaround for each.",
  },
  {
    href: "/validator/releases",
    icon: ListBulletIcon,
    title: "All releases and checksums",
    text: "Every test release, its notes, and the SHA-256 of each file.",
  },
] as const;

export default function ValidatorDownloadPage({
  snapshot,
}: {
  readonly snapshot: ReleaseFeedSnapshot;
}) {
  const latest = snapshot.releases[0];
  const version = latest ? getBaseVersion(latest.version) : "0.1.0";
  return (
    <ValidatorPageFrame current="download">
      <ValidatorPageHeader eyebrow="Download" title="6529 Validator">
        <p className="tw-mb-0 tw-mt-3 tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-solid tw-border-primary-400/40 tw-bg-primary-500/10 tw-px-3 tw-py-1 tw-text-sm tw-font-medium tw-text-iron-100">
          Version {version}, test release
        </p>
        {latest && <ReleaseLine release={latest} />}
        <p className="tw-mb-0 tw-mt-5 tw-max-w-2xl tw-text-lg tw-leading-8 tw-text-iron-300">
          The validator is a program you run on your own computer. Every day it
          computes TDH from Ethereum, signs the result with a key your wallet
          authorizes, and agrees on it with the other validators. It needs no
          ETH, sends no transaction and cannot move NFTs or funds.
        </p>
      </ValidatorPageHeader>

      <section aria-labelledby="any-machine" className="tw-mb-12">
        <h2 id="any-machine" className={SECTION_HEADING}>
          Use any machine you have
        </h2>
        <p className={`tw-mb-4 tw-mt-3 ${BODY}`}>
          The hardware guide in each archive,{" "}
          <code className={CODE}>docs/install/hardware.md</code>, lists tiers of
          machines. For the test phase:
        </p>
        <blockquote className="tw-m-0 tw-rounded-r-lg tw-border-0 tw-border-l-4 tw-border-solid tw-border-primary-400/70 tw-bg-iron-900/50 tw-px-5 tw-py-4">
          <p className="tw-m-0 tw-text-lg tw-leading-8 tw-text-iron-100">
            {ANY_MACHINE_QUOTE}
          </p>
        </blockquote>
      </section>

      <section aria-labelledby="download">
        <h2 id="download" className={SECTION_HEADING}>
          Download the validator
        </h2>
        <DownloadArea snapshot={snapshot} />
      </section>

      <section aria-labelledby="next-steps" className="tw-mt-12">
        <h2 id="next-steps" className={SECTION_HEADING}>
          Set it up
        </h2>
        <ul className="tw-m-0 tw-mt-5 tw-grid tw-list-none tw-gap-3 tw-p-0 md:tw-grid-cols-3">
          {NEXT_STEPS.map((step) => (
            <li key={step.href}>
              <Link
                href={step.href}
                className={`${ABOUT_CARD_CLASS_NAME} tw-flex tw-h-full tw-flex-col tw-gap-2 tw-p-5 tw-no-underline tw-transition hover:tw-border-primary-400/50 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400`}
              >
                <step.icon
                  aria-hidden="true"
                  className="tw-size-6 tw-text-primary-300"
                />
                <span className="tw-text-base tw-font-semibold tw-text-iron-50">
                  {step.title}
                </span>
                <span className="tw-text-sm tw-leading-6 tw-text-iron-400">
                  {step.text}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="report" className="tw-mt-12">
        <h2 id="report" className={SECTION_HEADING}>
          Report what you find
        </h2>
        <p className={`tw-mb-3 tw-mt-3 ${BODY}`}>
          Post what you find in the {VALIDATOR_FEEDBACK_WAVE} wave: your
          machine, the file you installed, what you did and what happened, with
          times in UTC.
        </p>
        <p className={`tw-m-0 ${BODY}`}>
          Status files and logs name your keys and your account. Send them only
          in an encrypted DM in the 6529 app to {describeStatusDmAccount()},
          never in the wave. 6529 never starts a DM with you and never asks for
          a seed phrase.
        </p>
      </section>
    </ValidatorPageFrame>
  );
}
