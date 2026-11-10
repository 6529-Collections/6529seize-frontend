import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ReactNode } from "react";

import type { ValidatorRelease } from "@/lib/validator-page/releaseFeed";
import {
  formatFileSize,
  getReleaseDownloadPath,
  groupReleaseFiles,
  listReleaseFiles,
  shortCommit,
  type ValidatorInstallerKind,
} from "@/lib/validator-page/releaseFiles";
import CopyChecksumButton from "./CopyChecksumButton";
import { BODY, CODE, LINK, SECONDARY_BUTTON } from "./validatorStyles";

const CELL =
  "tw-border-0 tw-border-solid tw-border-white/[0.06] tw-align-middle lg:tw-border-b lg:tw-px-3 lg:tw-py-3";
const MOBILE_LABEL =
  "tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500 lg:tw-hidden";
const HEAD =
  "tw-whitespace-nowrap tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.08] tw-px-3 tw-py-2 tw-text-left tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400";

function Cell({
  label,
  children,
  className = "",
}: {
  readonly label: string;
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <td
      className={`${CELL} max-lg:tw-flex max-lg:tw-items-center max-lg:tw-justify-between max-lg:tw-gap-3 ${className}`}
    >
      <span aria-hidden="true" className={MOBILE_LABEL}>
        {label}
      </span>
      {children}
    </td>
  );
}

/**
 * The publisher the system should name on one line, and Apple's
 * notarization under it.
 */
function Publisher({
  publisher,
  note,
}: {
  readonly publisher: string | null;
  readonly note: string | null;
}) {
  if (!publisher) {
    return <span>None</span>;
  }
  return (
    <span className="tw-flex tw-flex-col max-lg:tw-items-end">
      <span className="tw-whitespace-nowrap">{publisher}</span>
      {note && <span className="tw-text-xs tw-text-iron-500">{note}</span>}
    </span>
  );
}

function ChecksumCommands({ release }: { readonly release: ValidatorRelease }) {
  const { installers } = groupReleaseFiles(release);
  // The commands name this release's own files, so they work as shown.
  const fileFor = (kind: ValidatorInstallerKind): string =>
    installers.find((installer) => installer.kind === kind)?.file.name ??
    "<file>";
  const rows = [
    {
      system: "Mac, in Terminal",
      command: `shasum -a 256 ${fileFor("macos")}`,
    },
    {
      system: "Windows, in PowerShell",
      command: `Get-FileHash .\\${fileFor("windows")}`,
    },
    { system: "Linux", command: `sha256sum ${fileFor("deb-x64")}` },
  ];
  return (
    <ul className="tw-m-0 tw-list-none tw-divide-y tw-divide-white/[0.06] tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-p-0">
      {rows.map((row) => (
        <li
          key={row.system}
          className="tw-flex tw-flex-col tw-gap-1 tw-px-4 tw-py-3 sm:tw-flex-row sm:tw-items-baseline sm:tw-gap-4"
        >
          <span className="tw-text-sm tw-font-medium tw-text-iron-200 sm:tw-w-44 sm:tw-flex-none">
            {row.system}
          </span>
          <code className="tw-min-w-0 tw-break-all tw-font-mono tw-text-[13px] tw-leading-6 tw-text-iron-100">
            {row.command}
          </code>
        </li>
      ))}
    </ul>
  );
}

/**
 * Every file of the release in one table, the SHA-256 commands, and
 * SHA256SUMS last. Below 1024 px each row is a card.
 */
export default function ValidatorAllFiles({
  release,
}: {
  readonly release: ValidatorRelease;
}) {
  const files = listReleaseFiles(release);
  const { checksums } = groupReleaseFiles(release);
  const commit = shortCommit(release.commit);
  return (
    <div className="tw-flex tw-flex-col tw-gap-6">
      <p className={`tw-m-0 ${BODY}`}>
        Build <span className="tw-font-mono">{release.version}</span>, published{" "}
        {release.publishedAt.slice(0, 10)}
        {commit && (
          <>
            , commit <span className="tw-font-mono">{commit}</span>
          </>
        )}
        . Earlier builds are under{" "}
        <Link href="/validator/releases" className={LINK}>
          Releases
        </Link>
        .
      </p>
      <table className="tw-w-full tw-border-collapse tw-text-sm max-lg:tw-block">
        <thead className="max-lg:tw-hidden">
          <tr>
            <th scope="col" className={HEAD}>
              File
            </th>
            <th scope="col" className={HEAD}>
              Size
            </th>
            <th scope="col" className={HEAD}>
              SHA-256
            </th>
            <th scope="col" className={HEAD}>
              Publisher
            </th>
            <th scope="col" className={HEAD}>
              <span className="tw-sr-only">Download</span>
            </th>
          </tr>
        </thead>
        <tbody className="max-lg:tw-grid max-lg:tw-gap-3">
          {files.map((entry) => {
            const label = [entry.system, entry.cpu].filter(Boolean).join(", ");
            return (
              <tr
                key={entry.file.name}
                className="max-lg:tw-flex max-lg:tw-flex-col max-lg:tw-gap-3 max-lg:tw-rounded-xl max-lg:tw-border max-lg:tw-border-solid max-lg:tw-border-white/[0.08] max-lg:tw-bg-iron-950/60 max-lg:tw-p-4"
              >
                <td className={`${CELL} max-lg:tw-block`}>
                  <span className="tw-block tw-font-semibold tw-text-iron-50">
                    {label}
                  </span>
                  <span className="tw-block tw-text-iron-400">
                    {entry.what}
                  </span>
                  <span className="tw-block tw-break-all tw-font-mono tw-text-xs tw-leading-5 tw-text-iron-300">
                    {entry.file.name}
                  </span>
                </td>
                <Cell
                  label="Size"
                  className="tw-whitespace-nowrap tw-text-iron-300"
                >
                  {formatFileSize(entry.file.size) ?? "–"}
                </Cell>
                <Cell label="SHA-256">
                  <span className="tw-inline-flex tw-items-center tw-gap-2">
                    <code
                      title={entry.file.sha256}
                      className="tw-font-mono tw-text-xs tw-text-iron-200"
                    >
                      {entry.file.sha256.slice(0, 12)}…
                    </code>
                    <CopyChecksumButton
                      value={entry.file.sha256}
                      label={`SHA-256 of ${entry.file.name}`}
                    />
                  </span>
                </Cell>
                <Cell label="Publisher" className="tw-text-iron-300">
                  <Publisher
                    publisher={entry.publisher}
                    note={entry.publisherNote}
                  />
                </Cell>
                <td className={`${CELL} lg:tw-text-right`}>
                  <a
                    href={getReleaseDownloadPath(release, entry.file)}
                    className={`${SECONDARY_BUTTON} max-lg:tw-w-full`}
                    aria-label={`Download ${entry.file.name}`}
                  >
                    <ArrowDownTrayIcon
                      aria-hidden="true"
                      className="tw-size-4"
                    />
                    Download
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className={`tw-m-0 ${BODY}`}>
        Each SHA-256 comes from 6529&apos;s signed list of releases. This page
        checks that signature before it lists a file. The publisher is the name
        your system should show when it opens the file; this page doesn&apos;t
        check it, so check it yourself.
      </p>
      <div>
        <h3 className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-50">
          Check a file
        </h3>
        <p className={`tw-mb-3 tw-mt-2 ${BODY}`}>
          In the folder with the file, run the command for your system and
          compare what it prints with the SHA-256 above. Windows prints capital
          letters; the letters and digits must match. If they differ, delete the
          file.
        </p>
        <ChecksumCommands release={release} />
      </div>
      {checksums && (
        <div className="tw-flex tw-flex-col tw-gap-3 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-pt-5 sm:tw-flex-row sm:tw-items-start sm:tw-gap-5">
          <a
            href={getReleaseDownloadPath(release, checksums)}
            className={SECONDARY_BUTTON}
            aria-label="Download SHA256SUMS"
          >
            <ArrowDownTrayIcon aria-hidden="true" className="tw-size-4" />
            SHA256SUMS
          </a>
          <p className={`tw-m-0 ${BODY}`}>
            It lists the SHA-256 of every file. On Linux, in a folder with it
            and your downloads, run{" "}
            <code className={CODE}>
              sha256sum --check --ignore-missing SHA256SUMS
            </code>{" "}
            to check them all. 6529 also signs the list of releases, and your
            validator checks that signature before it tells you about a new one.
          </p>
        </div>
      )}
    </div>
  );
}
