import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";

import CopyChecksumButton from "@/components/validator-page/CopyChecksumButton";
import {
  BODY,
  CODE,
  SECONDARY_BUTTON,
} from "@/components/validator-page/validatorStyles";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, tRich } from "@/i18n/messages";
import "@/i18n/namespaces/ai-download";
import { ed25519PublicKeyPem } from "@/lib/ai-page/feedSignature";
import { AI_FEED_SIGNING_KEYS } from "@/lib/ai-page/feedSigningKeys";
import type { AiRelease } from "@/lib/ai-page/releaseFeed";
import {
  formatAiFileSize,
  getAiDownloadPath,
  groupAiReleaseFiles,
  listAiReleaseFiles,
  type AiInstallerKind,
} from "@/lib/ai-page/releaseFiles";
import { shortCommit } from "@/lib/validator-page/releaseFiles";

const CELL =
  "tw-border-0 tw-border-solid tw-border-white/[0.06] tw-align-middle lg:tw-border-b lg:tw-px-3 lg:tw-py-3";
const MOBILE_LABEL =
  "tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500 lg:tw-hidden";
const HEAD =
  "tw-whitespace-nowrap tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.08] tw-px-3 tw-py-2 tw-text-left tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400";
const SUBHEADING = "tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-50";
const COMMAND_LIST =
  "tw-m-0 tw-list-none tw-divide-y tw-divide-white/[0.06] tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-p-0";
const PRE =
  "tw-m-0 tw-overflow-x-auto tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.06] tw-bg-iron-950 tw-p-4 tw-font-mono tw-text-[13px] tw-leading-6 tw-text-iron-100";
// Rendered on the server, in the locale the server renders.
const LOCALE = DEFAULT_LOCALE;
// File names and commands, shown and run as they are in every language.
const SHA256SUMS = "SHA256SUMS";
const SHA256SUMS_SIG = "SHA256SUMS.sig";
const KEY_FILE = "release-key.pub";
const OPENSSL_VERIFY = `openssl pkeyutl -verify -pubin -inkey ${KEY_FILE} -rawin -in ${SHA256SUMS} -sigfile ${SHA256SUMS_SIG}`;
const OPENSSL_OK = "Signature Verified Successfully";
const RELEASE_PY_VERIFY = "release.py verify";

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
      {/* The header row is hidden below 1024 px, so this label names the
          cell there; it is hidden from 1024 px, where the header does. */}
      <span className={MOBILE_LABEL}>{label}</span>
      {children}
    </td>
  );
}

function ChecksumCommands({ release }: { readonly release: AiRelease }) {
  const { installers } = groupAiReleaseFiles(release);
  const fileFor = (kind: AiInstallerKind): string =>
    installers.find((installer) => installer.kind === kind)?.file.name ??
    "<file>";
  const windowsFile = fileFor("windows");
  const rows = [
    {
      system: t(LOCALE, "ai.files.check.system.mac"),
      commands: [`shasum -a 256 -c ${SHA256SUMS} --ignore-missing`],
    },
    {
      system: t(LOCALE, "ai.files.check.system.windows"),
      commands: [
        `Get-FileHash .\\${windowsFile}`,
        `Select-String ${windowsFile} ${SHA256SUMS}`,
      ],
    },
    {
      system: t(LOCALE, "ai.files.check.system.linux"),
      commands: [`sha256sum -c ${SHA256SUMS} --ignore-missing`],
    },
  ];
  return (
    <ul className={COMMAND_LIST}>
      {rows.map((row) => (
        <li
          key={row.system}
          className="tw-flex tw-flex-col tw-gap-1 tw-px-4 tw-py-3 sm:tw-flex-row sm:tw-items-baseline sm:tw-gap-4"
        >
          <span className="tw-text-sm tw-font-medium tw-text-iron-200 sm:tw-w-44 sm:tw-flex-none">
            {row.system}
          </span>
          <span className="tw-flex tw-min-w-0 tw-flex-col">
            {row.commands.map((command) => (
              <code
                key={command}
                className="tw-break-all tw-font-mono tw-text-[13px] tw-leading-6 tw-text-iron-100"
              >
                {command}
              </code>
            ))}
          </span>
        </li>
      ))}
    </ul>
  );
}

function SignatureCheck() {
  const pem = AI_FEED_SIGNING_KEYS[0]
    ? ed25519PublicKeyPem(AI_FEED_SIGNING_KEYS[0])
    : null;
  if (!pem) {
    return null;
  }
  const code = (key: string, value: string) => (
    <code key={key} className={CODE}>
      {value}
    </code>
  );
  return (
    <div className="tw-flex tw-flex-col tw-gap-3">
      <h3 className={SUBHEADING}>{t(LOCALE, "ai.files.sig.heading")}</h3>
      <p className={`tw-m-0 ${BODY}`}>
        {tRich(LOCALE, "ai.files.sig.body", {
          sig: code("sig", SHA256SUMS_SIG),
          sums: code("sums", SHA256SUMS),
          keyFile: code("key-file", KEY_FILE),
        })}
      </p>
      <figure className="tw-m-0">
        <figcaption className="tw-mb-2 tw-text-sm tw-font-medium tw-text-iron-200">
          {t(LOCALE, "ai.files.sig.keyLabel")}
        </figcaption>
        <div className="tw-flex tw-items-start tw-gap-3">
          <pre className={`${PRE} tw-min-w-0 tw-flex-1`}>{pem.trim()}</pre>
          <CopyChecksumButton
            value={pem}
            label={t(LOCALE, "ai.files.sig.keyLabel")}
          />
        </div>
      </figure>
      <pre className={PRE}>{OPENSSL_VERIFY}</pre>
      <p className={`tw-m-0 ${BODY}`}>
        {tRich(LOCALE, "ai.files.sig.result", {
          ok: code("ok", OPENSSL_OK),
          verify: code("verify", RELEASE_PY_VERIFY),
        })}
      </p>
    </div>
  );
}

/**
 * Every file of the release in one table, with its SHA-256 and the name
 * its code signature shows, then how to check a file and SHA256SUMS.
 * Below 1024 px each row is a card.
 */
export default function AiAllFiles({
  release,
}: {
  readonly release: AiRelease;
}) {
  const files = listAiReleaseFiles(release);
  const commit = shortCommit(release.commit);
  const publisherLabel = t(LOCALE, "ai.files.column.publisher");
  const sizeLabel = t(LOCALE, "ai.files.column.size");
  const sha256Label = t(LOCALE, "ai.files.column.sha256");
  const buildParams = {
    version: (
      <span key="version" className="tw-font-mono">
        {release.version}
      </span>
    ),
    date: release.date,
    commit: (
      <span key="commit" className="tw-font-mono">
        {commit}
      </span>
    ),
  };
  return (
    <div className="tw-flex tw-flex-col tw-gap-6">
      <p className={`tw-m-0 ${BODY}`}>
        {tRich(
          LOCALE,
          commit ? "ai.files.build.withCommit" : "ai.files.build.withoutCommit",
          buildParams
        )}
      </p>
      <table className="tw-w-full tw-border-collapse tw-text-sm max-lg:tw-block">
        <thead className="max-lg:tw-hidden">
          <tr>
            <th scope="col" className={HEAD}>
              {t(LOCALE, "ai.files.column.file")}
            </th>
            <th scope="col" className={HEAD}>
              {sizeLabel}
            </th>
            <th scope="col" className={HEAD}>
              {sha256Label}
            </th>
            <th scope="col" className={HEAD}>
              {publisherLabel}
            </th>
            <th scope="col" className={HEAD}>
              <span className="tw-sr-only">
                {t(LOCALE, "ai.files.column.download")}
              </span>
            </th>
          </tr>
        </thead>
        <tbody className="max-lg:tw-grid max-lg:tw-gap-3">
          {files.map((entry) => (
            <tr
              key={entry.file.name}
              className="max-lg:tw-flex max-lg:tw-flex-col max-lg:tw-gap-3 max-lg:tw-rounded-xl max-lg:tw-border max-lg:tw-border-solid max-lg:tw-border-white/[0.08] max-lg:tw-bg-iron-950/60 max-lg:tw-p-4"
            >
              <td className={`${CELL} max-lg:tw-block`}>
                <span className="tw-block tw-font-semibold tw-text-iron-50">
                  {entry.title}
                </span>
                <span className="tw-block tw-text-iron-400">{entry.what}</span>
                <span className="tw-block tw-break-all tw-font-mono tw-text-xs tw-leading-5 tw-text-iron-300">
                  {entry.file.name}
                </span>
              </td>
              <Cell
                label={sizeLabel}
                className="tw-whitespace-nowrap tw-text-iron-300"
              >
                {formatAiFileSize(entry.file.size) ?? "–"}
              </Cell>
              <Cell label={sha256Label}>
                <span className="tw-inline-flex tw-items-center tw-gap-2">
                  <code
                    title={entry.file.sha256}
                    className="tw-font-mono tw-text-xs tw-text-iron-200"
                  >
                    {entry.file.sha256.slice(0, 12)}…
                  </code>
                  <CopyChecksumButton
                    value={entry.file.sha256}
                    label={t(LOCALE, "ai.files.sha256.copyLabel", {
                      file: entry.file.name,
                    })}
                  />
                </span>
              </Cell>
              <Cell label={publisherLabel} className="tw-text-iron-300">
                <span className="max-lg:tw-text-right">
                  {entry.file.signed ?? t(LOCALE, "ai.files.publisher.none")}
                </span>
              </Cell>
              <td className={`${CELL} lg:tw-text-right`}>
                <a
                  href={getAiDownloadPath(release, entry.file)}
                  className={`${SECONDARY_BUTTON} max-lg:tw-w-full`}
                  aria-label={t(LOCALE, "ai.files.download.label", {
                    file: entry.file.name,
                  })}
                >
                  <ArrowDownTrayIcon aria-hidden="true" className="tw-size-4" />
                  {t(LOCALE, "ai.files.download.text")}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={`tw-m-0 ${BODY}`}>{t(LOCALE, "ai.files.source")}</p>
      <div className="tw-flex tw-flex-col tw-gap-3">
        <h3 className={SUBHEADING}>{t(LOCALE, "ai.files.check.heading")}</h3>
        <p className={`tw-m-0 ${BODY}`}>
          {tRich(LOCALE, "ai.files.check.body", {
            sums: (
              <code key="sums" className={CODE}>
                {SHA256SUMS}
              </code>
            ),
          })}
        </p>
        <ChecksumCommands release={release} />
      </div>
      <SignatureCheck />
    </div>
  );
}
