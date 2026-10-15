"use client";

import { ChevronRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { Fragment, useId, useState, type ReactNode } from "react";
import { formatInteger, formatNumber } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import {
  DIFFERENCE_CLASSES,
  type DifferenceClass,
  type VerificationDifference,
} from "@/lib/tdh/verification/schema";
import { differenceClassCounts } from "@/lib/tdh/verification/states";
import TransactionBoxDiagram from "../../shared/diagrams/TransactionBoxDiagram";
import { SPECIFICATION_PATH } from "../../shared/tdhSources";
import {
  TDH_CHIP_BUTTON,
  TDH_CHIP_OFF,
  TDH_CHIP_ON,
  TDH_FOCUS_RING,
  TDH_LINK,
  TDH_LINK_STANDALONE,
  TDH_TABLE,
  TDH_TD_STACK_MD,
  TDH_TH,
} from "../../shared/tdhStyles";

type ClassFilter = DifferenceClass | "all";

const KNOWN_FIELDS = new Set(["final", "base", "boost", "balance"]);
const KNOWN_CAUSES = new Set(["DEV-2"]);
const CLASS_DOT: Record<DifferenceClass, string> = {
  A: "tw-bg-primary-400",
  B: "tw-bg-sky-300",
  C: "tw-bg-error",
  D: "tw-bg-amber-400",
};

function fieldLabel(locale: SupportedLocale, name: string): string {
  return KNOWN_FIELDS.has(name)
    ? t(locale, `network.tdh.verify.diff.field.${name}` as MessageKey)
    : name;
}

function causeHref(cause: string): string {
  return `${SPECIFICATION_PATH}#${cause.toLowerCase()}`;
}

function DeltaBar({
  locale,
  delta,
  max,
}: {
  readonly locale: SupportedLocale;
  readonly delta: number;
  readonly max: number;
}) {
  const width = max > 0 ? Math.max((Math.abs(delta) / max) * 50, 2) : 0;
  return (
    <span className="tw-flex tw-items-center tw-gap-2">
      <span
        aria-hidden="true"
        className="tw-relative tw-h-2 tw-w-16 tw-shrink-0 tw-rounded-full tw-bg-iron-800"
      >
        <span className="tw-absolute tw-inset-y-0 tw-left-1/2 tw-w-px tw-bg-iron-500" />
        <span
          className={`tw-absolute tw-inset-y-0 tw-rounded-full ${
            delta < 0 ? "tw-bg-amber-400" : "tw-bg-primary-400"
          }`}
          style={
            delta < 0
              ? { right: "50%", width: `${width}%` }
              : { left: "50%", width: `${width}%` }
          }
        />
      </span>
      <span className="tw-tabular-nums">
        {formatNumber(locale, delta, {
          signDisplay: "exceptZero",
          maximumFractionDigits: 0,
        })}
      </span>
    </span>
  );
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
        className={`tw-size-2 tw-rounded-full ${CLASS_DOT[value]}`}
      />
      {t(locale, `network.tdh.verify.class.${value}` as MessageKey)}
    </span>
  );
}

function CauseDetails({
  locale,
  cause,
}: {
  readonly locale: SupportedLocale;
  readonly cause: string | null;
}) {
  if (cause === null) {
    return (
      <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(locale, "network.tdh.verify.class.D.body")}
      </p>
    );
  }
  return (
    <div className="tw-grid tw-gap-4 lg:tw-grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:tw-items-center">
      <div className="tw-space-y-2">
        <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-200">
          {KNOWN_CAUSES.has(cause)
            ? t(locale, `network.tdh.verify.cause.${cause}` as MessageKey)
            : t(locale, "network.tdh.verify.cause.generic", { cause })}
        </p>
        <Link
          href={causeHref(cause)}
          className={`${TDH_LINK_STANDALONE} tw-text-sm`}
        >
          {t(locale, "network.tdh.verify.cause.link", { cause })}
        </Link>
      </div>
      {cause === "DEV-2" && <TransactionBoxDiagram locale={locale} />}
    </div>
  );
}

export default function VerificationDifferences({
  locale,
  differences,
  cycleDay,
  isSample,
}: {
  readonly locale: SupportedLocale;
  readonly differences: readonly VerificationDifference[];
  readonly cycleDay: number;
  readonly isSample: boolean;
}) {
  const [filter, setFilter] = useState<ClassFilter>("all");
  const [open, setOpen] = useState<ReadonlySet<number>>(new Set());
  const baseId = useId();
  const counts = differenceClassCounts(differences);
  const indexed = differences.map((difference, index) => ({
    difference,
    index,
  }));
  const shown =
    filter === "all"
      ? indexed
      : indexed.filter(({ difference }) => difference.class === filter);
  const missingValue = t(
    locale,
    isSample
      ? "network.tdh.verify.diff.valuesNotInSample"
      : "network.tdh.verify.diff.valueNotPublished"
  );
  const maxDelta = Math.max(
    0,
    ...differences.flatMap((difference) =>
      difference.fields.map((field) =>
        field.rust !== null && field.live !== null
          ? Math.abs(field.rust - field.live)
          : 0
      )
    )
  );

  const toggle = (index: number) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });

  const hasMissingValues = differences.some((difference) =>
    difference.fields.some(
      (field) =>
        field.rust === null || field.python === null || field.live === null
    )
  );
  const cellValue = (amount: number | null) =>
    amount === null ? (
      <span className="tw-text-iron-500">
        <span aria-hidden="true">—</span>
        <span className="tw-sr-only">{missingValue}</span>
      </span>
    ) : (
      formatInteger(locale, amount)
    );

  const filters: ReadonlyArray<{
    id: ClassFilter;
    label: string;
    count: number;
  }> = [
    {
      id: "all",
      label: t(locale, "network.tdh.verify.diff.filterAll"),
      count: differences.length,
    },
    ...DIFFERENCE_CLASSES.map((value) => ({
      id: value,
      label: t(locale, "network.tdh.verify.diff.filterClass", { class: value }),
      count: counts[value],
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
          <div
            role="group"
            aria-label={t(locale, "network.tdh.verify.diff.filterLabel")}
            className="tw-mt-4 tw-flex tw-flex-wrap tw-gap-2"
          >
            {filters.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={filter === item.id}
                onClick={() => setFilter(item.id)}
                className={`${TDH_CHIP_BUTTON} ${filter === item.id ? TDH_CHIP_ON : TDH_CHIP_OFF}`}
              >
                {item.label}
                <span className="tw-rounded-full tw-bg-iron-800 tw-px-1.5 tw-text-xs tw-tabular-nums tw-text-iron-300">
                  {formatInteger(locale, item.count)}
                </span>
              </button>
            ))}
          </div>

          {shown.length === 0 ? (
            <p className="tw-m-0 tw-mt-4 tw-text-sm tw-text-iron-300">
              {t(locale, "network.tdh.verify.diff.emptyFiltered")}
            </p>
          ) : (
            <div className="tw-mt-4 tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.07]">
              <table className={`${TDH_TABLE} tw-block md:tw-table`}>
                <caption className="tw-sr-only">
                  {t(locale, "network.tdh.verify.diff.caption", {
                    cycle: formatInteger(locale, cycleDay),
                    shown: formatInteger(locale, shown.length),
                    total: formatInteger(locale, differences.length),
                  })}
                </caption>
                <thead className="tw-hidden md:tw-table-header-group">
                  <tr>
                    <th scope="col" className={TDH_TH}>
                      {t(locale, "network.tdh.verify.diff.label")}
                    </th>
                    <th scope="col" className={TDH_TH}>
                      {t(locale, "network.tdh.verify.diff.field")}
                    </th>
                    <th scope="col" className={`${TDH_TH} tw-text-right`}>
                      {t(locale, "network.tdh.verify.diff.rust")}
                    </th>
                    <th scope="col" className={`${TDH_TH} tw-text-right`}>
                      {t(locale, "network.tdh.verify.diff.python")}
                    </th>
                    <th scope="col" className={`${TDH_TH} tw-text-right`}>
                      {t(locale, "network.tdh.verify.diff.live")}
                    </th>
                    <th scope="col" className={TDH_TH}>
                      {t(locale, "network.tdh.verify.diff.delta")}
                    </th>
                    <th scope="col" className={TDH_TH}>
                      {t(locale, "network.tdh.verify.diff.class")}
                    </th>
                    <th scope="col" className={TDH_TH}>
                      {t(locale, "network.tdh.verify.diff.cause")}
                    </th>
                  </tr>
                </thead>
                <tbody className="tw-block md:tw-table-row-group">
                  {shown.map(({ difference, index }) => {
                    const isOpen = open.has(index);
                    const detailsId = `${baseId}-details-${index}`;
                    const kind = t(
                      locale,
                      `network.tdh.verify.diff.kind.${difference.kind}` as MessageKey
                    );
                    const fields =
                      difference.fields.length > 0
                        ? difference.fields
                        : [
                            {
                              name: "final",
                              rust: null,
                              python: null,
                              live: null,
                            },
                          ];
                    return (
                      <Fragment key={index}>
                        {fields.map((field, fieldIndex) => (
                          <tr
                            key={`${index}-${field.name}`}
                            className="tw-grid tw-grid-cols-2 tw-gap-x-4 tw-gap-y-1 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-p-4 first:tw-border-t-0 md:tw-table-row md:tw-p-0"
                          >
                            <th
                              scope="row"
                              className={`${TDH_TD_STACK_MD} tw-col-span-2 tw-font-medium`}
                            >
                              {fieldIndex === 0 ? (
                                <button
                                  type="button"
                                  aria-expanded={isOpen}
                                  aria-controls={detailsId}
                                  onClick={() => toggle(index)}
                                  aria-label={t(
                                    locale,
                                    "network.tdh.verify.diff.details",
                                    {
                                      label: difference.label,
                                      kind,
                                    }
                                  )}
                                  className={`-tw-ml-2 tw-inline-flex tw-min-h-11 tw-items-center tw-gap-1.5 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-2 tw-text-left tw-font-mono tw-text-sm tw-text-iron-100 hover:tw-bg-iron-800 ${TDH_FOCUS_RING}`}
                                >
                                  <ChevronRightIcon
                                    aria-hidden="true"
                                    className={`tw-size-4 tw-text-iron-400 tw-transition-transform motion-reduce:tw-transition-none ${isOpen ? "tw-rotate-90" : ""}`}
                                  />
                                  {difference.label}
                                  <span className="tw-font-sans tw-text-xs tw-font-normal tw-text-iron-400">
                                    {kind}
                                  </span>
                                </button>
                              ) : (
                                <span className="tw-sr-only">
                                  {`${difference.label}, ${kind}`}
                                </span>
                              )}
                            </th>
                            <MobileLabeled
                              label={t(locale, "network.tdh.verify.diff.field")}
                            >
                              {fieldLabel(locale, field.name)}
                            </MobileLabeled>
                            <MobileLabeled
                              label={t(locale, "network.tdh.verify.diff.rust")}
                              numeric
                            >
                              {cellValue(field.rust)}
                            </MobileLabeled>
                            <MobileLabeled
                              label={t(
                                locale,
                                "network.tdh.verify.diff.python"
                              )}
                              numeric
                            >
                              {cellValue(field.python)}
                            </MobileLabeled>
                            <MobileLabeled
                              label={t(locale, "network.tdh.verify.diff.live")}
                              numeric
                            >
                              {cellValue(field.live)}
                            </MobileLabeled>
                            <MobileLabeled
                              label={t(locale, "network.tdh.verify.diff.delta")}
                            >
                              {field.rust !== null && field.live !== null ? (
                                <DeltaBar
                                  locale={locale}
                                  delta={field.rust - field.live}
                                  max={maxDelta}
                                />
                              ) : (
                                cellValue(null)
                              )}
                            </MobileLabeled>
                            <MobileLabeled
                              label={t(locale, "network.tdh.verify.diff.class")}
                            >
                              <ClassBadge
                                locale={locale}
                                value={difference.class}
                              />
                            </MobileLabeled>
                            <MobileLabeled
                              label={t(locale, "network.tdh.verify.diff.cause")}
                            >
                              {difference.cause === null ? (
                                <span className="tw-text-iron-400">
                                  {t(locale, "network.tdh.verify.diff.noCause")}
                                </span>
                              ) : (
                                <Link
                                  href={causeHref(difference.cause)}
                                  className={`${TDH_LINK} tw-font-mono`}
                                >
                                  {difference.cause}
                                </Link>
                              )}
                            </MobileLabeled>
                          </tr>
                        ))}
                        <tr
                          id={detailsId}
                          hidden={!isOpen}
                          className={
                            isOpen ? "tw-block md:tw-table-row" : "tw-hidden"
                          }
                        >
                          <td
                            colSpan={8}
                            className="tw-block tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.06] tw-bg-iron-950/60 tw-px-4 tw-py-4 md:tw-table-cell"
                          >
                            <CauseDetails
                              locale={locale}
                              cause={difference.cause}
                            />
                          </td>
                        </tr>
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {hasMissingValues && (
        <p className="tw-m-0 tw-mt-2 tw-text-xs tw-text-iron-500">
          {t(locale, "network.tdh.verify.diff.missingNote", {
            missing: missingValue,
          })}
        </p>
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

/** A cell that shows its column label above the value on phones. */
function MobileLabeled({
  label,
  numeric = false,
  children,
}: {
  readonly label: string;
  readonly numeric?: boolean;
  readonly children: ReactNode;
}) {
  return (
    <td
      className={`${TDH_TD_STACK_MD} ${numeric ? "md:tw-text-right md:tw-tabular-nums" : ""}`}
    >
      <span
        aria-hidden="true"
        className="tw-block tw-text-xs tw-text-iron-500 md:tw-hidden"
      >
        {label}
      </span>
      {children}
    </td>
  );
}
