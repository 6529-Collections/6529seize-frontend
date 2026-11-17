import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";

import ValidatorFold from "@/components/validator-page/ValidatorFold";
import { CODE } from "@/components/validator-page/validatorStyles";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, tRich, type MessageKey } from "@/i18n/messages";
import "@/i18n/namespaces/ai-download";
import { ed25519PublicKeyPem } from "@/lib/ai-page/feedSignature";
import { AI_FEED_SIGNING_KEYS } from "@/lib/ai-page/feedSigningKeys";
import type { AiRelease } from "@/lib/ai-page/releaseFeed";
import {
  describeCodeSignature,
  getAiDownloadPath,
  groupAiReleaseFiles,
} from "@/lib/ai-page/releaseFiles";
import AiCodeBlock from "./AiCodeBlock";
import { formatAiFileSize } from "./formatAiFileSize";
import { AI_BODY, AI_BUTTON, AI_H3, AI_MUTED } from "./AiPageFrame";

// Rendered on the server, in the locale the server renders.
const LOCALE = DEFAULT_LOCALE;
// File names and commands, shown and run as they are in every language.
const SHA256SUMS = "SHA256SUMS";
const SHA256SUMS_SIG = "SHA256SUMS.sig";
const OPENSSL_OK = "Signature Verified Successfully";
const RELEASE_PY_VERIFY = "release.py verify";
// The release list's own files, for checking the others.
const CHECK_FILES: readonly {
  readonly name: string;
  readonly what: MessageKey;
}[] = [
  { name: SHA256SUMS, what: "ai.verify.sumsFile" },
  { name: SHA256SUMS_SIG, what: "ai.verify.sigFile" },
  { name: "manifest.json", what: "ai.verify.manifest" },
];

function code(key: string, value: string) {
  return (
    <code key={key} className={CODE}>
      {value}
    </code>
  );
}

function Step({
  index,
  title,
  children,
}: {
  readonly index: number;
  readonly title: string;
  readonly children: ReactNode;
}) {
  return (
    <li className="tw-flex tw-flex-col tw-gap-3">
      <div className="tw-flex tw-items-center tw-gap-3">
        <span
          aria-hidden="true"
          className="tw-flex tw-size-7 tw-flex-none tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/15 tw-text-sm tw-font-semibold tw-tabular-nums tw-text-iron-200"
        >
          {index}
        </span>
        <h3 className={AI_H3}>{title}</h3>
      </div>
      {/* Indented under the title from 640 px; full width on a phone. */}
      <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-3 sm:tw-pl-10">
        {children}
      </div>
    </li>
  );
}

/**
 * How to check a download, closed by default: its SHA-256 against
 * SHA256SUMS, SHA256SUMS against 6529 AI's signature, and the code
 * signature the system shows.
 */
export default function AiVerify({ release }: { readonly release: AiRelease }) {
  const { installers } = groupAiReleaseFiles(release);
  const windows =
    installers.find((installer) => installer.kind === "windows")?.file.name ??
    "<file>";
  const signer =
    installers
      .map((installer) => describeCodeSignature(installer.file.signed).signer)
      .find((name) => name !== null) ?? null;
  const releaseKey = AI_FEED_SIGNING_KEYS[0];
  const pem = releaseKey ? ed25519PublicKeyPem(releaseKey) : null;
  const keyFile = t(LOCALE, "ai.verify.sums.key");
  const checkFiles = CHECK_FILES.flatMap(({ name, what }) => {
    const file = release.files.find((entry) => entry.name === name);
    return file ? [{ file, what: t(LOCALE, what) }] : [];
  });
  return (
    <ValidatorFold id="verify" title={t(LOCALE, "ai.verify.title")}>
      <p className={`tw-mb-6 tw-mt-0 ${AI_BODY}`}>
        {t(LOCALE, "ai.verify.intro")}
      </p>
      <ol className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-8 tw-p-0">
        <Step index={1} title={t(LOCALE, "ai.verify.file.title")}>
          <p className={`tw-m-0 ${AI_BODY}`}>
            {tRich(LOCALE, "ai.verify.file.body", {
              sums: code("sums", SHA256SUMS),
            })}
          </p>
          <AiCodeBlock
            label={t(LOCALE, "ai.verify.file.mac")}
            code={`shasum -a 256 -c ${SHA256SUMS} --ignore-missing`}
          />
          <AiCodeBlock
            label={t(LOCALE, "ai.verify.file.linux")}
            code={`sha256sum -c ${SHA256SUMS} --ignore-missing`}
          />
          <AiCodeBlock
            label={t(LOCALE, "ai.verify.file.windows")}
            code={`Get-FileHash .\\${windows}\nSelect-String ${windows} ${SHA256SUMS}`}
          />
          <p className={`tw-m-0 ${AI_MUTED}`}>
            {t(LOCALE, "ai.verify.file.after")}
          </p>
        </Step>
        {pem && (
          <Step index={2} title={t(LOCALE, "ai.verify.sums.title")}>
            <p className={`tw-m-0 ${AI_BODY}`}>
              {tRich(LOCALE, "ai.verify.sums.body", {
                sig: code("sig", SHA256SUMS_SIG),
                keyFile: code("key-file", keyFile),
              })}
            </p>
            <AiCodeBlock label={keyFile} code={pem.trim()} what={keyFile} />
            <AiCodeBlock
              label={t(LOCALE, "ai.code.terminal")}
              code={`openssl pkeyutl -verify -pubin -inkey ${keyFile} -rawin -in ${SHA256SUMS} -sigfile ${SHA256SUMS_SIG}`}
            />
            <p className={`tw-m-0 ${AI_MUTED}`}>
              {tRich(LOCALE, "ai.verify.sums.after", {
                ok: code("ok", OPENSSL_OK),
                verify: code("verify", RELEASE_PY_VERIFY),
              })}
            </p>
          </Step>
        )}
        {signer && (
          <Step index={pem ? 3 : 2} title={t(LOCALE, "ai.verify.code.title")}>
            <p className={`tw-m-0 ${AI_BODY}`}>
              {tRich(LOCALE, "ai.verify.code.body", {
                signer: (
                  <strong
                    key="signer"
                    className="tw-font-semibold tw-text-iron-100"
                  >
                    {signer}
                  </strong>
                ),
              })}
            </p>
          </Step>
        )}
      </ol>
      {checkFiles.length > 0 && (
        <section aria-labelledby="release-files" className="tw-mt-8">
          <h3 id="release-files" className={AI_H3}>
            {t(LOCALE, "ai.verify.files")}
          </h3>
          <ul className="tw-m-0 tw-mt-3 tw-list-none tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-p-0">
            {checkFiles.map(({ file, what }) => {
              const size = formatAiFileSize(file.size);
              return (
                <li
                  key={file.name}
                  className="tw-flex tw-flex-col tw-items-start tw-gap-3 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-px-4 tw-py-3 first:tw-border-t-0 sm:tw-flex-row sm:tw-items-center"
                >
                  <div className="tw-min-w-0 tw-flex-1">
                    <p className="tw-m-0 tw-font-mono tw-text-[13px] tw-leading-5 tw-text-iron-100">
                      {file.name}
                    </p>
                    <p className="tw-m-0 tw-text-[13px] tw-leading-5 tw-text-iron-400">
                      {size
                        ? t(LOCALE, "ai.verify.fileMeta", { what, size })
                        : what}
                    </p>
                  </div>
                  <a
                    href={getAiDownloadPath(release, file)}
                    className={AI_BUTTON}
                    aria-label={t(LOCALE, "ai.files.download.label", {
                      file: file.name,
                    })}
                  >
                    <ArrowDownTrayIcon
                      aria-hidden="true"
                      className="tw-size-4"
                    />
                    {t(LOCALE, "ai.files.download.text")}
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </ValidatorFold>
  );
}
