import ReleaseBuildLine from "@/components/release-section/ReleaseBuildLine";
import ReleaseCommandList from "@/components/release-section/ReleaseCommandList";
import ReleaseFilesTable from "@/components/release-section/ReleaseFilesTable";
import CopyChecksumButton from "@/components/validator-page/CopyChecksumButton";
import { BODY, CODE } from "@/components/validator-page/validatorStyles";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, tRich } from "@/i18n/messages";
import "@/i18n/namespaces/ai-download";
import { ed25519PublicKeyPem } from "@/lib/ai-page/feedSignature";
import { AI_FEED_SIGNING_KEYS } from "@/lib/ai-page/feedSigningKeys";
import type { AiRelease } from "@/lib/ai-page/releaseFeed";
import {
  getAiDownloadPath,
  groupAiReleaseFiles,
  listAiReleaseFiles,
  type AiInstallerKind,
} from "@/lib/ai-page/releaseFiles";
import { formatAiFileSize } from "./formatAiFileSize";

const SUBHEADING = "tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-50";
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
  return <ReleaseCommandList rows={rows} />;
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
  return (
    <div className="tw-flex tw-flex-col tw-gap-6">
      <ReleaseBuildLine
        version={release.version}
        date={release.date}
        commit={release.commit}
        withCommit="ai.files.build.withCommit"
        withoutCommit="ai.files.build.withoutCommit"
      />
      <ReleaseFilesTable
        rows={files.map((entry) => ({
          name: entry.file.name,
          title: entry.title,
          what: entry.what,
          size:
            formatAiFileSize(entry.file.size) ??
            t(LOCALE, "ai.files.size.unknown"),
          sha256: entry.file.sha256,
          copyLabel: t(LOCALE, "ai.files.sha256.copyLabel", {
            file: entry.file.name,
          }),
          publisher: entry.file.signed ?? t(LOCALE, "ai.files.publisher.none"),
          href: getAiDownloadPath(release, entry.file),
          downloadLabel: t(LOCALE, "ai.files.download.label", {
            file: entry.file.name,
          }),
        }))}
        columns={{
          file: t(LOCALE, "ai.files.column.file"),
          size: t(LOCALE, "ai.files.column.size"),
          sha256: t(LOCALE, "ai.files.column.sha256"),
          publisher: t(LOCALE, "ai.files.column.publisher"),
          download: t(LOCALE, "ai.files.column.download"),
        }}
        downloadText={t(LOCALE, "ai.files.download.text")}
      />
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
