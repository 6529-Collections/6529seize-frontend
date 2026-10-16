import { CheckCircleIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { selectPluralCategory } from "@/i18n/format";
import {
  DIFFERENCE_CLASSES,
  type DifferenceClass,
} from "@/lib/tdh/verification/schema";
import type { DayDifferences } from "@/lib/tdh/verification/states";
import TdhHeading from "../../shared/TdhHeading";
import TdhSourcesNote from "../../shared/TdhSourcesNote";
import { SPECIFICATION_PATH } from "../../shared/tdhSources";
import { TDH_CARD, TDH_LINK } from "../../shared/tdhStyles";
import { formatInteger, formatSigned } from "./verificationFormat";

/** Class colours: distinct hues, always next to the class letter. */
const CLASS_DOT: Record<DifferenceClass, string> = {
  A: "tw-bg-primary-400",
  B: "tw-bg-violet-400",
  C: "tw-bg-error",
  D: "tw-bg-amber-400",
};

const ITEM_ID = /^(DEV|BUG)-\d{1,4}$/;

function plural(locale: SupportedLocale, count: number): "one" | "other" {
  return selectPluralCategory(locale, count) === "one" ? "one" : "other";
}

function ClassLetter({ value }: { readonly value: DifferenceClass }) {
  return (
    <span
      aria-hidden="true"
      className={`tw-flex tw-size-5 tw-shrink-0 tw-items-center tw-justify-center tw-rounded tw-text-sm tw-font-bold tw-text-iron-950 ${CLASS_DOT[value]}`}
    >
      {value}
    </span>
  );
}

/** A cause as words, with a link to the specification for DEV and BUG items. */
function Cause({
  locale,
  cause,
}: {
  readonly locale: SupportedLocale;
  readonly cause: string;
}) {
  if (cause === "rust-python" || cause === "unexplained") {
    return <>{t(locale, `network.tdh.verify.cause.${cause}` as MessageKey)}</>;
  }
  const parts = cause.split(",");
  return (
    <>
      {parts.map((part, index) => (
        <span key={part}>
          {index > 0 && ", "}
          {ITEM_ID.test(part) ? (
            <Link
              href={`${SPECIFICATION_PATH}#${part.toLowerCase()}`}
              className={TDH_LINK}
            >
              {part}
            </Link>
          ) : (
            part
          )}
        </span>
      ))}
    </>
  );
}

function ClassLegend({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <dl className="tw-m-0 tw-grid tw-gap-3 sm:tw-grid-cols-2 xl:tw-grid-cols-4">
      {DIFFERENCE_CLASSES.map((value) => (
        <div key={value} className="tw-flex tw-gap-2.5">
          <dt className="tw-pt-0.5">
            <ClassLetter value={value} />
            <span className="tw-sr-only">
              {t(locale, `network.tdh.verify.class.${value}` as MessageKey)}
            </span>
          </dt>
          <dd className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
            <span className="tw-font-medium tw-text-iron-100">
              {t(locale, `network.tdh.verify.class.${value}` as MessageKey)}.
            </span>{" "}
            {t(locale, `network.tdh.verify.class.${value}.body` as MessageKey)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * The day's differences, as the daily job publishes them: counts by class
 * and by cause, and the totals' differences. No record is listed: one
 * differing token can single its holder out, so the detail stays in the
 * job's private report.
 */
export default function VerificationDifferences({
  locale,
  differences,
  agreementComplete,
}: {
  readonly locale: SupportedLocale;
  readonly differences: DayDifferences;
  /** Whether every compared record is equal by the agreement counts. */
  readonly agreementComplete: boolean;
}) {
  const records = differences.identities + differences.wallets;
  const none = records === 0 && agreementComplete;
  const classes = differences.byClass;

  return (
    <section
      id="diff"
      aria-labelledby="diff-heading"
      className="tw-mt-12 tw-scroll-mt-24"
    >
      <TdhHeading
        id="diff"
        title={t(locale, "network.tdh.verify.diff.heading")}
        locale={locale}
        className="tw-text-balance tw-text-xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-2xl"
      />
      <p className="tw-m-0 tw-mt-2 tw-max-w-[34rem] tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(locale, "network.tdh.verify.diff.lede")}
      </p>
      {/* The day, then the classes, each the full width: side by side the
          shorter card left a hole beside the taller. */}
      <div className="tw-mt-4 tw-space-y-4">
        <div className={`${TDH_CARD} tw-p-5 sm:tw-p-6`}>
          {none ? (
            <p className="tw-m-0 tw-flex tw-items-start tw-gap-3 tw-text-base tw-leading-7 tw-text-iron-100">
              <CheckCircleIcon
                aria-hidden="true"
                className="tw-mt-0.5 tw-size-6 tw-shrink-0 tw-text-success"
              />
              <span>{t(locale, "network.tdh.verify.diff.none")}</span>
            </p>
          ) : (
            <>
              <p className="tw-m-0 tw-text-base tw-font-semibold tw-leading-7 tw-text-iron-50">
                {records === 0
                  ? t(locale, "network.tdh.verify.diff.countsMissing")
                  : t(locale, "network.tdh.verify.diff.count", {
                      identities: formatInteger(locale, differences.identities),
                      wallets: formatInteger(locale, differences.wallets),
                    })}
              </p>
              {classes !== null && (
                <ul className="tw-m-0 tw-mt-4 tw-grid tw-list-none tw-grid-cols-2 tw-gap-2 tw-p-0 sm:tw-grid-cols-4">
                  {DIFFERENCE_CLASSES.map((value) => (
                    <li
                      key={value}
                      className={`tw-flex tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-px-3 tw-py-2 tw-text-sm tw-tabular-nums ${
                        classes[value] > 0
                          ? "tw-border-white/10 tw-text-iron-50"
                          : "tw-border-white/[0.05] tw-text-iron-500"
                      }`}
                    >
                      <ClassLetter value={value} />
                      <span className="tw-sr-only">
                        {t(
                          locale,
                          `network.tdh.verify.class.${value}` as MessageKey
                        )}
                        :
                      </span>
                      {formatInteger(locale, classes[value])}
                    </li>
                  ))}
                </ul>
              )}
              {differences.byCause.length > 0 && (
                <div className="tw-mt-4">
                  <p className="tw-m-0 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400">
                    {t(locale, "network.tdh.verify.diff.byCause")}
                  </p>
                  <ul className="tw-m-0 tw-mt-2 tw-list-none tw-space-y-1.5 tw-p-0 tw-text-sm tw-text-iron-200">
                    {differences.byCause.map((entry) => (
                      <li
                        key={entry.cause}
                        className="tw-flex tw-items-baseline tw-justify-between tw-gap-4 tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.05] tw-pb-1.5"
                      >
                        <span>
                          <Cause locale={locale} cause={entry.cause} />
                        </span>
                        <span className="tw-tabular-nums">
                          {t(
                            locale,
                            `network.tdh.verify.diff.records.${plural(locale, entry.count)}` as MessageKey,
                            { count: formatInteger(locale, entry.count) }
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
          {/* One sign everywhere: the Rust core minus the other. */}
          {(differences.rustVsLive !== null ||
            differences.rustVsPython !== null) && (
            <dl className="tw-m-0 tw-mt-5 tw-grid tw-grid-cols-1 tw-gap-3 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-pt-4 sm:tw-grid-cols-2">
              {(["rustVsLive", "rustVsPython"] as const).map((key) => (
                <div key={key}>
                  <dt className="tw-text-sm tw-text-iron-400">
                    {t(locale, `network.tdh.verify.diff.delta.${key}`)}
                  </dt>
                  <dd className="tw-m-0 tw-mt-0.5 tw-text-lg tw-font-semibold tw-tabular-nums tw-text-iron-50">
                    {differences[key] === null
                      ? t(locale, "network.tdh.verify.history.noValue")
                      : formatSigned(locale, differences[key])}
                  </dd>
                </div>
              ))}
            </dl>
          )}
          <p className="tw-m-0 tw-mt-5 tw-flex tw-items-start tw-gap-2.5 tw-rounded-lg tw-bg-iron-950 tw-p-3 tw-text-sm tw-leading-6 tw-text-iron-300">
            <LockClosedIcon
              aria-hidden="true"
              className="tw-mt-0.5 tw-size-4 tw-shrink-0 tw-text-iron-400"
            />
            <span>{t(locale, "network.tdh.verify.diff.privacy")}</span>
          </p>
        </div>
        <div
          id="classes"
          className={`${TDH_CARD} tw-scroll-mt-24 tw-p-5 sm:tw-p-6`}
        >
          <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50">
            {t(locale, "network.tdh.verify.diff.classesTitle")}
          </h3>
          <div className="tw-mt-3">
            <ClassLegend locale={locale} />
          </div>
          <p className="tw-m-0 tw-mt-4 tw-max-w-[38em] tw-text-sm tw-leading-6 tw-text-iron-300">
            {t(locale, "network.tdh.verify.class.note")}
          </p>
          <div className="tw-mt-3 tw-max-w-[34rem] tw-rounded-lg tw-border-0 tw-border-l-2 tw-border-solid tw-border-amber-400/70 tw-bg-amber-400/[0.05] tw-py-2 tw-pl-4 tw-pr-3 tw-text-sm tw-leading-6 tw-text-iron-200">
            <p className="tw-m-0 tw-font-semibold tw-text-iron-50">
              {t(locale, "network.tdh.verify.class.expectedTitle")}
            </p>
            {/* DEV-2 once: the case that can still differ, and how the
                other was settled, with the way to the rule. */}
            <p className="tw-m-0 tw-mt-0.5">
              {t(locale, "network.tdh.verify.class.expectedDev2")}
              {none &&
                ` ${t(locale, "network.tdh.verify.class.expectedNone")}`}{" "}
              <Link
                href="/network/tdh/how-it-works#step-5"
                className={TDH_LINK}
              >
                {t(locale, "network.tdh.verify.diff.historyLink")}
              </Link>
            </p>
          </div>
        </div>
      </div>
      <TdhSourcesNote
        locale={locale}
        refs={["P38 §3.3", "DEV-2", "D131", "D132"]}
      />
    </section>
  );
}
