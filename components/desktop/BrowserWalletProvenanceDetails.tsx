"use client";

import type { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDecimalString, formatUtcDate } from "@/i18n/format";
import { t } from "@/i18n/messages";
import type { DecodedValue } from "@/lib/desktop/wallet-transactions/decode";
import type { TransactionDescription } from "@/lib/desktop/wallet-transactions/describe";
import {
  argumentOf,
  formatArweaveId,
  formatCid,
  hashAlgorithmName,
  tupleField,
} from "@/lib/desktop/wallet-transactions/provenance";

type Locale = ReturnType<typeof useBrowserLocale>;
type MessageKey = Parameters<typeof t>[1];

const asText = (value: DecodedValue | undefined): string =>
  typeof value === "string" ? value : "";
const asNumber = (locale: Locale, value: DecodedValue | undefined): string =>
  typeof value === "bigint"
    ? formatDecimalString(locale, value.toString())
    : "";

/** A UTC date for a time the publisher asserts (seconds since 1970). */
function formatEffectiveAt(locale: Locale, value: DecodedValue | undefined) {
  if (typeof value !== "bigint") return "";
  const ms = Number(value) * 1000;
  if (!Number.isSafeInteger(ms) || ms > 8.64e15) return value.toString();
  return formatUtcDate(locale, ms, { dateStyle: "medium", timeStyle: "short" });
}

function Field({
  locale,
  label,
  value,
}: {
  readonly locale: Locale;
  readonly label: MessageKey;
  readonly value: string | null;
}) {
  return (
    <div>
      <dt className="tw-text-iron-400">{t(locale, label)}</dt>
      <dd className="tw-m-0 tw-break-all tw-font-mono tw-text-iron-100">
        {value ?? t(locale, "browserConnector.tx.provenance.none")}
      </dd>
    </div>
  );
}

function HashFields({
  locale,
  hash,
}: {
  readonly locale: Locale;
  readonly hash: DecodedValue | undefined;
}) {
  return (
    <Field
      locale={locale}
      label="browserConnector.tx.provenance.digest"
      value={t(locale, "browserConnector.tx.provenance.digestValue", {
        algorithm: hashAlgorithmName(tupleField(hash, "algorithm")),
        digest: asText(tupleField(hash, "digest")),
      })}
    />
  );
}

const LIST_CLASS = "tw-m-0 tw-flex tw-flex-col tw-gap-2 tw-text-sm";
const CARD_CLASS = "tw-rounded-lg tw-bg-iron-900 tw-p-3";

function OpenRelease({
  locale,
  description,
}: {
  readonly locale: Locale;
  readonly description: TransactionDescription;
}) {
  const header = argumentOf(description, "header");
  const field = (name: string) => tupleField(header, name);
  const label = asText(field("label"));
  return (
    <dl className={`${LIST_CLASS} ${CARD_CLASS}`}>
      <Field
        locale={locale}
        label="browserConnector.tx.provenance.manifestCid"
        value={formatCid(asText(field("manifestCid")))}
      />
      <HashFields locale={locale} hash={field("manifestHash")} />
      <Field
        locale={locale}
        label="browserConnector.tx.provenance.rootCid"
        value={formatCid(asText(field("rootCid")))}
      />
      <Field
        locale={locale}
        label="browserConnector.tx.provenance.arweaveId"
        value={formatArweaveId(asText(field("arweaveId")))}
      />
      <Field
        locale={locale}
        label="browserConnector.tx.provenance.sourceCommit"
        value={asText(field("sourceCommit")).slice(2)}
      />
      <Field
        locale={locale}
        label="browserConnector.tx.provenance.label"
        value={
          label === ""
            ? null
            : t(locale, "browserConnector.tx.quoted", { text: label })
        }
      />
    </dl>
  );
}

function Record({
  locale,
  record,
  position,
}: {
  readonly locale: Locale;
  readonly record: DecodedValue;
  readonly position: number;
}) {
  const field = (name: string) => tupleField(record, name);
  const expected = field("expectedVersion");
  const label = asText(field("label"));
  return (
    <li className={CARD_CLASS}>
      <p className="tw-m-0 tw-mb-2 tw-font-semibold">
        {t(locale, "browserConnector.tx.provenance.record", {
          position: formatDecimalString(locale, String(position)),
        })}
      </p>
      <dl className={LIST_CLASS}>
        <Field
          locale={locale}
          label="browserConnector.tx.provenance.subject"
          value={asText(field("subjectId"))}
        />
        <Field
          locale={locale}
          label="browserConnector.tx.provenance.recordType"
          value={asText(field("recordType"))}
        />
        <Field
          locale={locale}
          label="browserConnector.tx.provenance.schema"
          value={asText(field("schemaId"))}
        />
        <HashFields locale={locale} hash={field("contentHash")} />
        <Field
          locale={locale}
          label="browserConnector.tx.provenance.cid"
          value={formatCid(asText(field("cid")))}
        />
        <Field
          locale={locale}
          label="browserConnector.tx.provenance.arweaveId"
          value={formatArweaveId(asText(field("arweaveId")))}
        />
        <Field
          locale={locale}
          label="browserConnector.tx.provenance.expectedVersion"
          value={
            expected === 0n
              ? t(locale, "browserConnector.tx.provenance.newSubject")
              : asNumber(locale, expected)
          }
        />
        <Field
          locale={locale}
          label="browserConnector.tx.provenance.effectiveAt"
          value={t(locale, "browserConnector.tx.provenance.effectiveAtValue", {
            time: formatEffectiveAt(locale, field("effectiveAt")),
          })}
        />
        {label !== "" && (
          <Field
            locale={locale}
            label="browserConnector.tx.provenance.label"
            value={t(locale, "browserConnector.tx.quoted", { text: label })}
          />
        )}
      </dl>
    </li>
  );
}

/**
 * The decoded fields of a 6529 Provenance publisher call, for the browser
 * page: the release header for `openRelease`, every record for `publish`
 * (a subject's first version marked new), and the release and its expected
 * record count for `sealRelease`.
 */
export default function BrowserWalletProvenanceDetails({
  locale,
  description,
}: {
  readonly locale: Locale;
  readonly description: TransactionDescription;
}) {
  if (description.ruleId === "provenance.openRelease") {
    return <OpenRelease locale={locale} description={description} />;
  }
  const releaseId = asNumber(locale, argumentOf(description, "releaseId"));
  if (description.ruleId === "provenance.sealRelease") {
    return (
      <dl className={`${LIST_CLASS} ${CARD_CLASS}`}>
        <Field
          locale={locale}
          label="browserConnector.tx.provenance.release"
          value={releaseId}
        />
        <Field
          locale={locale}
          label="browserConnector.tx.provenance.expectedCount"
          value={asNumber(
            locale,
            argumentOf(description, "expectedRecordCount")
          )}
        />
      </dl>
    );
  }
  const records = argumentOf(description, "records");
  const list = Array.isArray(records)
    ? (records as readonly DecodedValue[])
    : [];
  return (
    <>
      <dl className={`${LIST_CLASS} ${CARD_CLASS}`}>
        <Field
          locale={locale}
          label="browserConnector.tx.provenance.release"
          value={releaseId}
        />
      </dl>
      <ol className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-2 tw-p-0">
        {list.map((record, index) => (
          // Records are listed in the signed order; position identifies them.
          <Record
            key={`${index}:${asText(tupleField(record, "subjectId"))}`}
            locale={locale}
            record={record}
            position={index + 1}
          />
        ))}
      </ol>
    </>
  );
}
