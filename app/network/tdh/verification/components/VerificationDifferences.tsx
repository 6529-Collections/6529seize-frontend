"use client";

import Link from "next/link";
import { useState } from "react";
import { formatInteger, selectPluralCategory } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import {
  DIFFERENCE_CLASSES,
  type DifferenceClass,
  type VerificationDifference,
  type VerificationDifferenceField,
} from "@/lib/tdh/verification/schema";
import {
  differenceCases,
  type DifferenceCase,
} from "@/lib/tdh/verification/states";
import TransactionBoxDiagram from "../../shared/diagrams/TransactionBoxDiagram";
import TdhDisclosure from "../../shared/TdhDisclosure";
import { SPECIFICATION_PATH } from "../../shared/tdhSources";
import {
  TDH_CARD,
  TDH_CHIP_BUTTON,
  TDH_CHIP_OFF,
  TDH_CHIP_ON,
  TDH_FOCUS_RING,
  TDH_LINK,
  TDH_TABLE,
  TDH_TD,
  TDH_TH,
} from "../../shared/tdhStyles";
import { formatSigned } from "./verificationFormat";

type ClassFilter = DifferenceClass | "all";

const KNOWN_CAUSES = new Set(["DEV-2"]);
const COLLECTIONS = new Set(["memes", "gradients", "nextgen"]);
/** Class colours: distinct hues, always next to the class letter. */
export const CLASS_DOT: Record<DifferenceClass, string> = {
  A: "tw-bg-primary-400",
  B: "tw-bg-violet-400",
  C: "tw-bg-error",
  D: "tw-bg-amber-400",
};

function plural(locale: SupportedLocale, count: number): "one" | "other" {
  return selectPluralCategory(locale, count) === "one" ? "one" : "other";
}

function causeHref(cause: string): string {
  return `${SPECIFICATION_PATH}#${cause.toLowerCase()}`;
}

/**
 * A field of 6529.io's upload, made readable: `memes#208.tdh__raw` is
 * "The Memes #208" with `tdh__raw`; `boosted_nextgen_tdh` is "NextGen" with
 * its name; `boosted_tdh` belongs to the whole record.
 */
export function describeField(
  locale: SupportedLocale,
  name: string
): { readonly label: string; readonly code: string } {
  const token = /^([a-z]+)#(\d+)\.(.+)$/.exec(name);
  if (token?.[1] && token[2] && token[3] && COLLECTIONS.has(token[1])) {
    return {
      label: t(locale, "network.tdh.verify.diff.token", {
        collection: t(
          locale,
          `network.tdh.verify.diff.collection.${token[1]}` as MessageKey
        ),
        id: token[2],
      }),
      code: token[3],
    };
  }
  const collection = /^(?:boosted_)?(memes|gradients|nextgen)_/.exec(name);
  if (collection?.[1]) {
    return {
      label: t(
        locale,
        `network.tdh.verify.diff.collection.${collection[1]}` as MessageKey
      ),
      code: name,
    };
  }
  return { label: t(locale, "network.tdh.verify.diff.record"), code: name };
}

/** The fields to show first: the record's total and every per-token field. */
function mainFields(
  fields: readonly VerificationDifferenceField[]
): VerificationDifferenceField[] {
  const main = fields.filter(
    (field) => field.name === "boosted_tdh" || field.name.includes("#")
  );
  return main.length > 0 ? main : [...fields];
}

function sameFields(
  left: VerificationDifference,
  right: VerificationDifference
): boolean {
  return (
    left.fields.length === right.fields.length &&
    left.fields.every((field, index) => {
      const other = right.fields[index];
      return (
        other?.name === field.name &&
        other.rust === field.rust &&
        other.python === field.python &&
        other.live === field.live
      );
    })
  );
}

export function caseDelta(item: DifferenceCase): number | null {
  const record = item.identity ?? item.wallets[0];
  const field =
    record?.fields.find((entry) => entry.name === "boosted_tdh") ??
    record?.fields[0];
  const rust = field?.rust ?? null;
  const live = field?.live ?? null;
  if (rust === null || live === null) {
    return null;
  }
  return rust - live;
}

function ClassBadge({
  locale,
  value,
}: {
  readonly locale: SupportedLocale;
  readonly value: DifferenceClass;
}) {
  return (
    <span className="tw-inline-flex tw-items-center tw-gap-1.5 tw-whitespace-nowrap">
      <span
        aria-hidden="true"
        className={`tw-flex tw-size-4 tw-items-center tw-justify-center tw-rounded tw-text-[11px] tw-font-bold tw-text-iron-950 ${CLASS_DOT[value]}`}
      >
        {value}
      </span>
      {t(locale, `network.tdh.verify.class.${value}` as MessageKey)}
    </span>
  );
}

function Value({
  locale,
  value,
}: {
  readonly locale: SupportedLocale;
  readonly value: number | null;
}) {
  return value === null ? (
    <span className="tw-text-iron-500">
      <span aria-hidden="true">–</span>
      <span className="tw-sr-only">
        {t(locale, "network.tdh.verify.history.noValue")}
      </span>
    </span>
  ) : (
    <>{formatInteger(locale, value)}</>
  );
}

function FieldsTable({
  locale,
  caption,
  fields,
}: {
  readonly locale: SupportedLocale;
  readonly caption: string;
  readonly fields: readonly VerificationDifferenceField[];
}) {
  const head = {
    field: t(locale, "network.tdh.verify.diff.field"),
    rust: t(locale, "network.tdh.verify.diff.rust"),
    python: t(locale, "network.tdh.verify.diff.python"),
    live: t(locale, "network.tdh.verify.diff.live"),
    delta: t(locale, "network.tdh.verify.diff.delta"),
  };
  return (
    <table className={`${TDH_TABLE} tw-block md:tw-table md:tw-table-fixed`}>
      <caption className="tw-sr-only">{caption}</caption>
      <thead className="tw-hidden md:tw-table-header-group">
        <tr>
          <th scope="col" className={`${TDH_TH} tw-w-[36%]`}>
            {head.field}
          </th>
          <th scope="col" className={`${TDH_TH} tw-text-right`}>
            {head.rust}
          </th>
          <th scope="col" className={`${TDH_TH} tw-text-right`}>
            {head.python}
          </th>
          <th scope="col" className={`${TDH_TH} tw-text-right`}>
            {head.live}
          </th>
          <th scope="col" className={`${TDH_TH} tw-text-right`}>
            {head.delta}
          </th>
        </tr>
      </thead>
      <tbody className="tw-block md:tw-table-row-group">
        {fields.map((field) => {
          const { label, code } = describeField(locale, field.name);
          const delta =
            field.rust !== null && field.live !== null
              ? field.rust - field.live
              : null;
          return (
            <tr
              key={field.name}
              className="tw-grid tw-grid-cols-2 tw-gap-x-4 tw-gap-y-1 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-py-3 first:tw-border-t-0 md:tw-table-row md:tw-py-0"
            >
              <th
                scope="row"
                className={`${TDH_TD} tw-col-span-2 tw-border-0 tw-p-0 tw-font-normal md:tw-border-b md:tw-border-solid md:tw-px-4 md:tw-py-2.5`}
              >
                <span className="tw-block tw-text-sm tw-text-iron-100">
                  {label}
                </span>
                <code className="tw-font-mono tw-text-xs tw-text-iron-400">
                  {code}
                </code>
              </th>
              {(
                [
                  ["rust", field.rust],
                  ["python", field.python],
                  ["live", field.live],
                ] as const
              ).map(([series, value]) => (
                <td
                  key={series}
                  className={`${TDH_TD} tw-flex tw-items-baseline tw-justify-between tw-gap-2 tw-border-0 tw-p-0 tw-tabular-nums md:tw-table-cell md:tw-border-b md:tw-border-solid md:tw-px-4 md:tw-py-2.5 md:tw-text-right`}
                >
                  <span
                    aria-hidden="true"
                    className="tw-text-xs tw-text-iron-400 md:tw-hidden"
                  >
                    {head[series]}
                  </span>
                  <Value locale={locale} value={value} />
                </td>
              ))}
              <td
                className={`${TDH_TD} tw-flex tw-items-baseline tw-justify-between tw-gap-2 tw-border-0 tw-p-0 tw-tabular-nums md:tw-table-cell md:tw-border-b md:tw-border-solid md:tw-px-4 md:tw-py-2.5 md:tw-text-right`}
              >
                <span
                  aria-hidden="true"
                  className="tw-text-xs tw-text-iron-400 md:tw-hidden"
                >
                  {head.delta}
                </span>
                {delta === null ? (
                  <Value locale={locale} value={null} />
                ) : (
                  <span
                    className={
                      delta === 0 ? "tw-text-iron-300" : "tw-text-amber-200"
                    }
                  >
                    {formatSigned(locale, delta)}
                  </span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function RecordFields({
  locale,
  record,
  captionKey,
}: {
  readonly locale: SupportedLocale;
  readonly record: VerificationDifference;
  readonly captionKey:
    | "network.tdh.verify.diff.identityFields"
    | "network.tdh.verify.diff.walletFields";
}) {
  const [all, setAll] = useState(false);
  const noValues = record.fields.every(
    (field) =>
      field.rust === null && field.python === null && field.live === null
  );
  if (record.fields.length === 0 || noValues) {
    return (
      <p className="tw-m-0 tw-text-sm tw-text-iron-300">
        {t(locale, "network.tdh.verify.diff.noValues")}
      </p>
    );
  }
  const main = mainFields(record.fields);
  const shown = all ? record.fields : main;
  return (
    <div>
      <FieldsTable
        locale={locale}
        caption={t(locale, captionKey, { label: record.label })}
        fields={shown}
      />
      {main.length < record.fields.length && (
        <button
          type="button"
          onClick={() => setAll((value) => !value)}
          aria-expanded={all}
          className={`tw-mt-1 tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-0 tw-text-sm tw-font-medium tw-text-primary-300 hover:tw-text-primary-400 ${TDH_FOCUS_RING}`}
        >
          {all
            ? t(locale, "network.tdh.verify.diff.showFewer")
            : t(locale, "network.tdh.verify.diff.showAll", {
                count: formatInteger(locale, record.fields.length),
              })}
        </button>
      )}
    </div>
  );
}

function CauseText({
  locale,
  cause,
}: {
  readonly locale: SupportedLocale;
  readonly cause: string;
}) {
  return (
    <TdhDisclosure summary={t(locale, "network.tdh.verify.diff.details")}>
      <div className="tw-grid tw-gap-4 lg:tw-grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:tw-items-center">
        <div className="tw-space-y-2">
          <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-200">
            {KNOWN_CAUSES.has(cause)
              ? t(locale, `network.tdh.verify.cause.${cause}` as MessageKey)
              : t(locale, "network.tdh.verify.cause.generic", { cause })}
          </p>
          <Link
            href={causeHref(cause)}
            className={`${TDH_LINK} tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm`}
          >
            {t(locale, "network.tdh.verify.cause.link", { cause })}
          </Link>
        </div>
        {cause === "DEV-2" && <TransactionBoxDiagram locale={locale} />}
      </div>
    </TdhDisclosure>
  );
}

function CaseCard({
  locale,
  item,
}: {
  readonly locale: SupportedLocale;
  readonly item: DifferenceCase;
}) {
  const delta = caseDelta(item);
  const records = item.identity
    ? t(
        locale,
        `network.tdh.verify.diff.caseRecords.${plural(locale, item.wallets.length)}` as MessageKey,
        { count: formatInteger(locale, item.wallets.length) }
      )
    : t(
        locale,
        `network.tdh.verify.diff.caseWalletsOnly.${plural(locale, item.wallets.length)}` as MessageKey,
        { count: formatInteger(locale, item.wallets.length) }
      );
  return (
    <li className={`${TDH_CARD} tw-p-4 sm:tw-p-5`}>
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-2">
        <h3 className="tw-m-0 tw-font-mono tw-text-base tw-font-semibold tw-text-iron-50">
          {item.holder}
        </h3>
        <span className="tw-text-sm tw-text-iron-400">{records}</span>
        {item.classes.map((value) => (
          <span key={value} className="tw-text-sm tw-text-iron-200">
            <ClassBadge locale={locale} value={value} />
          </span>
        ))}
        {item.causes.map((cause) => (
          <Link
            key={cause}
            href={causeHref(cause)}
            className={`${TDH_LINK} tw-font-mono tw-text-sm`}
          >
            {cause}
          </Link>
        ))}
        {delta !== null && (
          <span className="tw-ml-auto tw-text-sm tw-font-semibold tw-tabular-nums tw-text-amber-200">
            {t(locale, "network.tdh.verify.diff.caseDelta", {
              delta: formatSigned(locale, delta),
            })}
          </span>
        )}
      </div>
      <div className="tw-mt-3 tw-space-y-3">
        {item.identity && (
          <RecordFields
            locale={locale}
            record={item.identity}
            captionKey="network.tdh.verify.diff.identityFields"
          />
        )}
        {item.wallets.map((wallet) =>
          item.identity && sameFields(item.identity, wallet) ? (
            <p
              key={wallet.label}
              className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300"
            >
              {t(locale, "network.tdh.verify.diff.sameAsIdentity", {
                label: wallet.label,
              })}
            </p>
          ) : (
            <div key={wallet.label}>
              <p className="tw-m-0 tw-mb-1 tw-font-mono tw-text-sm tw-text-iron-200">
                {wallet.label}
              </p>
              <RecordFields
                locale={locale}
                record={wallet}
                captionKey="network.tdh.verify.diff.walletFields"
              />
            </div>
          )
        )}
        {item.causes.map((cause) => (
          <CauseText key={cause} locale={locale} cause={cause} />
        ))}
        {item.causes.length === 0 && (
          <p className="tw-m-0 tw-text-sm tw-text-iron-300">
            {t(locale, "network.tdh.verify.class.D.body")}
          </p>
        )}
      </div>
    </li>
  );
}

export default function VerificationDifferences({
  locale,
  differences,
  cycleDay,
  totalDelta,
}: {
  readonly locale: SupportedLocale;
  readonly differences: readonly VerificationDifference[];
  readonly cycleDay: number;
  readonly totalDelta: number | null;
}) {
  const [filter, setFilter] = useState<ClassFilter>("all");
  const cases = differenceCases(differences);
  const shown =
    filter === "all"
      ? cases
      : cases.filter((item) => item.classes.includes(filter));
  const identities = differences.filter(
    (difference) => difference.kind === "identity"
  ).length;
  const wallets = differences.length - identities;
  const presentClasses = DIFFERENCE_CLASSES.filter((value) =>
    cases.some((item) => item.classes.includes(value))
  );
  const filters: ReadonlyArray<{
    id: ClassFilter;
    label: string;
    count: number;
  }> = [
    {
      id: "all",
      label: t(locale, "network.tdh.verify.diff.filterAll"),
      count: cases.length,
    },
    ...presentClasses.map((value) => ({
      id: value,
      label: t(locale, "network.tdh.verify.diff.filterClass", {
        class: value,
      }),
      count: cases.filter((item) => item.classes.includes(value)).length,
    })),
  ];

  return (
    <section aria-labelledby="tdh-verify-diff-heading" className="tw-mt-10">
      <h2
        id="tdh-verify-diff-heading"
        className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-50"
      >
        {t(locale, "network.tdh.verify.diff.heading")}
      </h2>
      <p className="tw-m-0 tw-mt-2 tw-max-w-3xl tw-text-sm tw-leading-6 tw-text-iron-400">
        {t(locale, "network.tdh.verify.diff.lede")}
      </p>

      {differences.length === 0 ? (
        <p className="tw-m-0 tw-mt-4 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-900 tw-p-5 tw-text-sm tw-text-iron-200">
          {t(locale, "network.tdh.verify.diff.empty")}
        </p>
      ) : (
        <>
          <p className="tw-m-0 tw-mt-4 tw-text-[15px] tw-font-medium tw-leading-7 tw-text-iron-100">
            {t(
              locale,
              `network.tdh.verify.diff.summary.${plural(locale, cases.length)}` as MessageKey,
              {
                cases: formatInteger(locale, cases.length),
                identities: formatInteger(locale, identities),
                wallets: formatInteger(locale, wallets),
              }
            )}
            {totalDelta !== null && (
              <>
                {" "}
                {t(locale, "network.tdh.verify.diff.summaryTotal", {
                  delta: formatSigned(locale, totalDelta),
                })}
              </>
            )}
          </p>
          {filters.length > 2 && (
            <div
              role="group"
              aria-label={t(locale, "network.tdh.verify.diff.filterLabel")}
              className="tw-mt-3 tw-flex tw-gap-2 tw-overflow-x-auto tw-pb-1"
            >
              {filters.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={filter === item.id}
                  onClick={() => setFilter(item.id)}
                  className={`${TDH_CHIP_BUTTON} tw-shrink-0 ${filter === item.id ? TDH_CHIP_ON : TDH_CHIP_OFF}`}
                >
                  {item.label}
                  <span className="tw-rounded-full tw-bg-iron-800 tw-px-1.5 tw-text-xs tw-tabular-nums tw-text-iron-300">
                    {formatInteger(locale, item.count)}
                  </span>
                </button>
              ))}
            </div>
          )}
          <p className="tw-sr-only" aria-live="polite">
            {t(locale, "network.tdh.verify.diff.caption", {
              cycle: formatInteger(locale, cycleDay),
              shown: formatInteger(locale, shown.length),
              total: formatInteger(locale, cases.length),
            })}
          </p>
          {shown.length === 0 ? (
            <p className="tw-m-0 tw-mt-4 tw-text-sm tw-text-iron-300">
              {t(locale, "network.tdh.verify.diff.emptyFiltered")}
            </p>
          ) : (
            <ul className="tw-m-0 tw-mt-4 tw-grid tw-list-none tw-gap-3 tw-p-0">
              {shown.map((item) => (
                <CaseCard key={item.holder} locale={locale} item={item} />
              ))}
            </ul>
          )}
        </>
      )}

      <dl className="tw-m-0 tw-mt-6 tw-grid tw-gap-3 sm:tw-grid-cols-2">
        {DIFFERENCE_CLASSES.map((value) => (
          <div key={value} className="tw-rounded-lg tw-bg-iron-900/60 tw-p-4">
            <dt className="tw-text-sm tw-font-medium tw-text-iron-100">
              <ClassBadge locale={locale} value={value} />
            </dt>
            <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-400">
              {t(
                locale,
                `network.tdh.verify.class.${value}.body` as MessageKey
              )}
            </dd>
          </div>
        ))}
      </dl>
      <p className="tw-m-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
        {t(locale, "network.tdh.verify.class.note")}
      </p>
    </section>
  );
}
