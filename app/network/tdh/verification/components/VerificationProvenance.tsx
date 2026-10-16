import { ArrowDownTrayIcon, RssIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  VerificationDay,
  VerificationImplementation,
  VerificationIndexDay,
  VerificationRunFiles,
} from "@/lib/tdh/verification/schema";
import TdhHeading from "../../shared/TdhHeading";
import TdhCopyButton from "../../shared/TdhCopyButton";
import TdhSource from "../../shared/TdhSource";
import TdhStatusPill from "../../shared/TdhStatusPill";
import TdhDisclosure from "../../shared/TdhDisclosure";
import { P26, rustCoreSpec } from "../../shared/tdhFacts";
import { REGISTRY_HASH } from "../../shared/tdhRules";
import { TDH_CARD, TDH_LINK } from "../../shared/tdhStyles";
import {
  DT,
  FeedStatement,
  Hash,
  Row,
  ShaMatch,
} from "./VerificationProvenanceParts";
import {
  arweaveFileUrl,
  arweaveTransactionUrl,
  etherscanBlockUrl,
} from "./verificationLinks";
import {
  formatCycleDate,
  formatInteger,
  middleTruncate,
  shortCommit,
} from "./verificationFormat";

/** A commit with the repository it belongs to: "validator @ db72daa". */
function CommitLine({
  locale,
  program,
  repository,
  commit,
  follows,
}: {
  readonly locale: SupportedLocale;
  readonly program: string;
  readonly repository: string;
  readonly commit: string;
  /** The P26 commit the code computes, when known. */
  readonly follows: string | null;
}) {
  return (
    <span className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2">
      <span className="tw-text-iron-300">{program}</span>
      <span className="tw-inline-flex tw-items-center tw-gap-1 tw-whitespace-nowrap">
        <code className="tw-font-mono tw-text-xs tw-text-iron-200">
          {repository}@{shortCommit(commit)}
        </code>
        <TdhCopyButton
          value={commit}
          label={t(locale, "network.tdh.shared.copyNamed", {
            name: `${repository} ${commit}`,
          })}
          copiedLabel={t(locale, "network.tdh.shared.copied")}
          failedLabel={t(locale, "network.tdh.shared.copyFailed")}
        />
      </span>
      {follows && (
        <span className="tw-text-iron-400">
          {t(locale, "network.tdh.verify.provenance.follows", {
            commit: follows,
          })}
        </span>
      )}
    </span>
  );
}

function UploadLine({
  locale,
  label,
  source,
  sha256 = null,
}: {
  readonly locale: SupportedLocale;
  readonly label: string;
  readonly source: string;
  /** The SHA-256 of the file as the comparison read it, when stated. */
  readonly sha256?: string | null;
}) {
  const id = source.replace(/^arweave:/, "");
  return (
    <span className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-0.5">
      <span className="tw-w-20 tw-shrink-0 tw-text-sm tw-text-iron-400">
        {label}
      </span>
      <Hash
        locale={locale}
        value={id}
        name={t(locale, "network.tdh.verify.provenance.liveSource")}
      />
      <span className="tw-inline-flex tw-gap-3 tw-text-sm">
        <a
          href={arweaveTransactionUrl(id)}
          className={`${TDH_LINK} tw-inline-flex tw-min-h-6 tw-min-w-6 tw-items-center`}
          rel="noopener noreferrer"
          target="_blank"
          aria-label={t(locale, "network.tdh.verify.provenance.txLink", { id })}
        >
          {t(locale, "network.tdh.verify.provenance.tx")}
        </a>
        <a
          href={arweaveFileUrl(id)}
          className={`${TDH_LINK} tw-inline-flex tw-min-h-6 tw-min-w-6 tw-items-center`}
          rel="noopener noreferrer"
          target="_blank"
          aria-label={t(locale, "network.tdh.verify.side.uploadLink", { id })}
        >
          {t(locale, "network.tdh.verify.provenance.file")}
        </a>
      </span>
      {sha256 && (
        <Hash
          locale={locale}
          value={sha256}
          name={t(locale, "network.tdh.verify.provenance.liveFileSha", {
            name: label,
          })}
        />
      )}
    </span>
  );
}

/**
 * One file the runs share, by SHA-256: the Rust core's, and the Python
 * reference's beside it only where the two differ.
 */
function FileLine({
  locale,
  label,
  rust,
  python,
}: {
  readonly locale: SupportedLocale;
  readonly label: string;
  readonly rust: string;
  readonly python: string | null;
}) {
  return (
    <span className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-0.5">
      <span className="tw-w-20 tw-shrink-0 tw-text-sm tw-text-iron-400">
        {label}
      </span>
      <Hash locale={locale} value={rust} name={label} />
      {python !== null && python !== rust && (
        <span className="tw-inline-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-text-sm tw-text-amber-200">
          {t(locale, "network.tdh.verify.provenance.pythonOther")}
          <Hash locale={locale} value={python} name={label} />
        </span>
      )}
    </span>
  );
}

/**
 * The canonical input and the record files, when the day's file names them,
 * then one line on whether the Python reference's files are the same.
 */
function RunFiles({
  locale,
  rust,
  python,
}: {
  readonly locale: SupportedLocale;
  readonly rust: VerificationRunFiles;
  readonly python: VerificationRunFiles | null;
}) {
  const files = [
    ["inputFile", rust.canonicalInputSha256, python?.canonicalInputSha256],
    ["identityFile", rust.identitiesSha256, python?.identitiesSha256],
    ["walletFile", rust.walletsSha256, python?.walletsSha256],
  ] as const;
  const shown = files.filter(([, value]) => value !== null);
  const pythonStated = shown.filter(([, , other]) => (other ?? null) !== null);
  const identical =
    pythonStated.length === shown.length &&
    shown.length > 0 &&
    shown.every(([, value, other]) => other === value);
  return (
    <span className="tw-flex tw-flex-col tw-gap-1">
      {shown.map(([key, value, other]) => (
        <FileLine
          key={key}
          locale={locale}
          label={t(locale, `network.tdh.verify.provenance.${key}`)}
          rust={value ?? ""}
          python={other ?? null}
        />
      ))}
      {identical && (
        <span className="tw-text-sm tw-text-success">
          {t(locale, "network.tdh.verify.provenance.pythonIdentical")}
        </span>
      )}
    </span>
  );
}

function Commits({
  locale,
  rust,
  python,
}: {
  readonly locale: SupportedLocale;
  readonly rust: VerificationImplementation | null;
  readonly python: VerificationImplementation | null;
}) {
  return (
    <span className="tw-flex tw-flex-col tw-gap-1">
      {rust?.commit && (
        <CommitLine
          locale={locale}
          program={t(locale, "network.tdh.verify.side.rust")}
          repository="validator"
          commit={rust.commit}
          follows={rustCoreSpec(rust.commit)}
        />
      )}
      {rust?.binarySha256 && (
        <span className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2">
          <span className="tw-text-iron-400">
            {t(locale, "network.tdh.verify.provenance.binary")}
          </span>
          <Hash
            locale={locale}
            value={rust.binarySha256}
            name={t(locale, "network.tdh.verify.provenance.binary")}
          />
        </span>
      )}
      {python?.commit && (
        <CommitLine
          locale={locale}
          program={t(locale, "network.tdh.verify.side.python")}
          repository="6529chain"
          commit={python.commit}
          follows={shortCommit(python.commit)}
        />
      )}
    </span>
  );
}

/** The day before a day, as its own page shows it. */
export interface PreviousDay {
  readonly cycleDay: number;
  readonly date: string;
  /** Its file's SHA-256 as this page read it. */
  readonly sha256: string | null;
  /** The SHA-256 the index states for it, when it states one. */
  readonly stated?: string | null;
}

/** Whether the Python reference's run states the Rust core's registry hash. */
function RegistryAgreement({
  locale,
  rust,
  python,
}: {
  readonly locale: SupportedLocale;
  readonly rust: string;
  readonly python: string;
}) {
  if (python === rust) {
    return (
      <span className="tw-text-sm tw-text-success">
        {t(locale, "network.tdh.verify.provenance.registrySame")}
      </span>
    );
  }
  return (
    <span className="tw-inline-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-text-sm tw-text-amber-200">
      {t(locale, "network.tdh.verify.provenance.pythonOther")}
      <Hash
        locale={locale}
        value={python}
        name={t(locale, "network.tdh.verify.provenance.registry")}
      />
    </span>
  );
}

/**
 * Which P26 a day's runs followed, said only as far as the day's own
 * registry hash shows it: this page restates P26 at one commit, and a later
 * build may compute another text.
 */
function p26RunNote(
  locale: SupportedLocale,
  pythonCommit: string,
  registryHash: string | null
): string {
  const values = { commit: pythonCommit.slice(0, 7), p26: P26.commit };
  if (registryHash === null) {
    return t(locale, "network.tdh.verify.provenance.p26RunUnstated", values);
  }
  return registryHash.toLowerCase() === REGISTRY_HASH.toLowerCase()
    ? t(locale, "network.tdh.verify.provenance.p26Run", values)
    : t(locale, "network.tdh.verify.provenance.p26RunOther", {
        ...values,
        hash: middleTruncate(registryHash),
      });
}

/**
 * What the day's result rests on (P26 §4.2, §9): where the data comes from,
 * rule version, registry hash, snapshot block, history mode, code versions
 * and 6529.io's signed files. Values come from the day's file; where it does
 * not state one, the page says so and shows the specification's value.
 */
export default function VerificationProvenance({
  locale,
  day,
  dayUrl,
  daySha256 = null,
  previousDay = null,
  indexUrl,
  indexEntry = null,
  indexGeneratedAt = null,
}: {
  readonly locale: SupportedLocale;
  readonly day: VerificationDay | null;
  /** The day's entry in the index, for what the index states about it. */
  readonly indexEntry?: VerificationIndexDay | null;
  /** When the index was written, if it says. */
  readonly indexGeneratedAt?: string | null;
  readonly dayUrl: string | null;
  /** The SHA-256 of the day file's bytes as the page read them. */
  readonly daySha256?: string | null;
  /** The day before, with its own file's SHA-256, to check days as a chain. */
  readonly previousDay?: PreviousDay | null;
  readonly indexUrl: string;
}) {
  const rust = day?.implementations.rust ?? null;
  const python = day?.implementations.python ?? null;
  const live = day?.implementations.live ?? null;
  const identityUpload = live?.sources?.identity ?? live?.source ?? null;
  const walletUpload = live?.sources?.wallet ?? null;
  const liveFiles = day?.sources?.live ?? null;
  const runFiles = day?.sources?.rust ?? null;
  // The rule as the day states it: at the top of the file, or in the run.
  const ruleVersion = day?.ruleVersion ?? rust?.ruleVersion ?? null;
  const registryHash = day?.registryHash ?? rust?.registryHash ?? null;
  return (
    <section
      id="provenance"
      aria-labelledby="provenance-heading"
      className="tw-mt-12 tw-scroll-mt-24"
    >
      <TdhHeading
        id="provenance"
        title={t(locale, "network.tdh.verify.provenance.heading")}
        locale={locale}
        className="tw-text-balance tw-text-xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-2xl"
      />
      <div className={`${TDH_CARD} tw-mt-4 tw-p-5 sm:tw-p-6`}>
        {/* Where the data comes from, across the card in two lines; then
            the facts as one column of label and value rows, each value a
            line or two; what each means waits in one disclosure. */}
        <p className={`${DT} tw-m-0`}>
          {t(locale, "network.tdh.verify.provenance.dataSource")}
        </p>
        {/* The feed's host name is one long word: it may break anywhere. */}
        <p className="tw-m-0 tw-mt-1 tw-max-w-[38em] tw-text-sm tw-leading-6 tw-text-iron-200 [overflow-wrap:anywhere]">
          {t(locale, "network.tdh.verify.provenance.remote")}
        </p>
        <dl className="tw-m-0 tw-mt-5 tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-white/[0.06] tw-border-0 tw-border-y tw-border-solid tw-border-white/[0.06]">
          <FeedStatement
            locale={locale}
            day={day}
            entry={indexEntry}
            indexGeneratedAt={indexGeneratedAt}
            daySha256={daySha256}
          />
          {day && (
            <Row label={t(locale, "network.tdh.verify.provenance.snapshot")}>
              <span className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1">
                <a
                  href={etherscanBlockUrl(day.cutoffBlock)}
                  className={`${TDH_LINK} tw-tabular-nums`}
                  rel="noopener noreferrer"
                  target="_blank"
                  aria-label={t(
                    locale,
                    "network.tdh.verify.provenance.explorer",
                    { block: formatInteger(locale, day.cutoffBlock) }
                  )}
                >
                  {formatInteger(locale, day.cutoffBlock)}
                </a>
                {day.cutoffBlockHash && (
                  <Hash
                    locale={locale}
                    value={day.cutoffBlockHash}
                    name={t(locale, "network.tdh.verify.provenance.snapshot")}
                  />
                )}
              </span>
            </Row>
          )}
          {day && (
            <Row label={t(locale, "network.tdh.verify.provenance.history")}>
              <span className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1">
                <TdhStatusPill
                  pill={day.mode === "checked" ? "checked" : "unchecked"}
                  locale={locale}
                  size="sm"
                />
                <span className="tw-text-iron-300">
                  {t(
                    locale,
                    day.mode === "checked"
                      ? "network.tdh.verify.mode.checkedShort"
                      : "network.tdh.verify.mode.uncheckedShort"
                  )}
                </span>
              </span>
            </Row>
          )}
          <Row label={t(locale, "network.tdh.verify.provenance.rule")}>
            <span className="tw-flex tw-flex-col tw-gap-1">
              <span>
                {ruleVersion
                  ? t(locale, "network.tdh.verify.provenance.ruleFromFile", {
                      version: ruleVersion,
                    })
                  : t(locale, "network.tdh.verify.provenance.ruleFromSpec")}
              </span>
              {rust?.ruleId && (
                <span className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2">
                  <span className="tw-text-iron-400">
                    {t(locale, "network.tdh.verify.provenance.ruleId")}
                  </span>
                  <Hash
                    locale={locale}
                    value={rust.ruleId}
                    name={t(locale, "network.tdh.verify.provenance.ruleId")}
                  />
                </span>
              )}
            </span>
          </Row>
          <Row label={t(locale, "network.tdh.verify.provenance.registry")}>
            <span className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3">
              <Hash
                locale={locale}
                value={registryHash ?? REGISTRY_HASH}
                name={t(locale, "network.tdh.verify.provenance.registry")}
              />
              {registryHash !== null && python?.registryHash && (
                <RegistryAgreement
                  locale={locale}
                  rust={registryHash}
                  python={python.registryHash}
                />
              )}
            </span>
          </Row>
          {(rust?.commit ?? python?.commit) && (
            <Row label={t(locale, "network.tdh.verify.provenance.commits")}>
              <Commits locale={locale} rust={rust} python={python} />
            </Row>
          )}
          {runFiles && (
            <Row label={t(locale, "network.tdh.verify.provenance.files")}>
              <RunFiles
                locale={locale}
                rust={runFiles}
                python={day?.sources?.python ?? null}
              />
            </Row>
          )}
          {day && (
            <Row label={t(locale, "network.tdh.verify.provenance.liveSource")}>
              {identityUpload === null ? (
                <span className="tw-text-iron-400">
                  {t(locale, "network.tdh.verify.provenance.liveSourceMissing")}
                </span>
              ) : (
                <span className="tw-flex tw-flex-col tw-gap-1">
                  <UploadLine
                    locale={locale}
                    label={t(
                      locale,
                      "network.tdh.verify.provenance.identityFile"
                    )}
                    source={identityUpload}
                    sha256={liveFiles?.identity?.sha256 ?? live?.sha256 ?? null}
                  />
                  {walletUpload && walletUpload !== identityUpload && (
                    <UploadLine
                      locale={locale}
                      label={t(
                        locale,
                        "network.tdh.verify.provenance.walletFile"
                      )}
                      source={walletUpload}
                      sha256={liveFiles?.wallet?.sha256 ?? null}
                    />
                  )}
                </span>
              )}
            </Row>
          )}
          {previousDay && (
            <Row label={t(locale, "network.tdh.verify.provenance.previous")}>
              <span className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1">
                <Link
                  href={`/network/tdh/verification/${previousDay.cycleDay}`}
                  className={TDH_LINK}
                >
                  {formatCycleDate(locale, previousDay.date)}
                </Link>
                {previousDay.sha256 && (
                  <Hash
                    locale={locale}
                    value={previousDay.sha256}
                    name={t(
                      locale,
                      "network.tdh.verify.provenance.previousSha"
                    )}
                  />
                )}
                {previousDay.sha256 && previousDay.stated && (
                  <ShaMatch
                    locale={locale}
                    stated={previousDay.stated}
                    read={previousDay.sha256}
                    of="read"
                  />
                )}
              </span>
            </Row>
          )}
        </dl>
        <TdhDisclosure
          className="tw-mt-3"
          summary={t(locale, "network.tdh.verify.provenance.notes")}
        >
          <ul className="tw-m-0 tw-max-w-[38em] tw-list-disc tw-space-y-2 tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-300 marker:tw-text-iron-500">
            {day && (
              <li>
                {t(
                  locale,
                  day.mode === "checked"
                    ? "network.tdh.verify.mode.checked"
                    : "network.tdh.verify.mode.unchecked"
                )}
              </li>
            )}
            {/* Which P26 the runs followed, said only as far as the day's
                own registry hash shows it: the page knows P26 at one
                commit, and a later build may compute another text. */}
            {python?.commit && (
              <li>{p26RunNote(locale, python.commit, registryHash)}</li>
            )}
            {!registryHash && (
              <li>
                {t(locale, "network.tdh.verify.provenance.registryFromSpec")}
              </li>
            )}
            {(rust?.commit ?? python?.commit) && (
              <li>{t(locale, "network.tdh.verify.provenance.commitsNote")}</li>
            )}
            {(rust?.binarySha256 ?? rust?.ruleId) && (
              <li>{t(locale, "network.tdh.verify.provenance.buildsNote")}</li>
            )}
            {runFiles && (
              <li>{t(locale, "network.tdh.verify.provenance.filesNote")}</li>
            )}
            {identityUpload !== null && (
              <li>
                {t(locale, "network.tdh.verify.provenance.signed")}
                {live?.sha256 &&
                  ` ${t(locale, "network.tdh.verify.provenance.liveSha", {
                    hash: middleTruncate(live.sha256),
                  })}`}
              </li>
            )}
            {previousDay && (
              <li>{t(locale, "network.tdh.verify.provenance.previousNote")}</li>
            )}
          </ul>
          <TdhSource
            refs={["D118", "P53 §11", "P26 §10", "P28 §4.5", "D116", "D120"]}
            locale={locale}
            block
            className="tw-mt-2 tw-pb-2"
          />
        </TdhDisclosure>
        <div className="tw-mt-6 tw-flex tw-flex-wrap tw-gap-x-6 tw-gap-y-3 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-pt-4 tw-text-sm">
          {dayUrl && (
            <a
              href={dayUrl}
              className={`${TDH_LINK} tw-inline-flex tw-min-h-11 tw-items-center tw-gap-1.5`}
            >
              <ArrowDownTrayIcon aria-hidden="true" className="tw-size-4" />
              {t(locale, "network.tdh.verify.provenance.downloadDay")}
            </a>
          )}
          <a
            href={indexUrl}
            className={`${TDH_LINK} tw-inline-flex tw-min-h-11 tw-items-center tw-gap-1.5`}
          >
            <ArrowDownTrayIcon aria-hidden="true" className="tw-size-4" />
            {t(locale, "network.tdh.verify.provenance.downloadIndex")}
          </a>
          <a
            href="/network/tdh/verification.rss"
            className={`${TDH_LINK} tw-inline-flex tw-min-h-11 tw-items-center tw-gap-1.5`}
          >
            <RssIcon aria-hidden="true" className="tw-size-4" />
            {t(locale, "network.tdh.verify.provenance.rss")}
          </a>
          {daySha256 && (
            <p className="tw-m-0 tw-basis-full tw-text-sm tw-leading-5 tw-text-iron-400">
              {t(locale, "network.tdh.verify.provenance.daySha")}
              {/* Only the hash may break, anywhere; the words never. */}
              <code className="tw-mt-0.5 tw-block tw-break-all tw-font-mono tw-text-iron-300">
                {daySha256}
              </code>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
