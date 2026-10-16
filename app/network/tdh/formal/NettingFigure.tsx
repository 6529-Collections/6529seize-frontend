import { ArrowRightIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

const STEP =
  "tw-flex tw-items-center tw-gap-2 tw-rounded-md tw-bg-iron-950 tw-px-2.5 tw-py-1.5 tw-font-mono tw-text-[13px] tw-text-iron-100";

function Step({
  from,
  to,
  muted = false,
}: {
  readonly from: string;
  readonly to: string;
  readonly muted?: boolean;
}) {
  return (
    <li className={`${STEP} ${muted ? "tw-opacity-70" : ""}`}>
      <span>{from}</span>
      <ArrowRightIcon className="tw-size-3.5 tw-text-iron-400" />
      <span>{to}</span>
      <span className="tw-ml-auto tw-text-iron-400">1</span>
    </li>
  );
}

function Net({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <span className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-px-2 tw-py-0.5 tw-font-mono tw-text-xs tw-tabular-nums tw-text-iron-100">
      {label}
      <span className="tw-text-iron-300">{value}</span>
    </span>
  );
}

/**
 * The netting theorem on one example: a transaction with a round trip and a
 * transaction that goes straight to the result move the same net amount for
 * every address, so the replay leaves the same stacks.
 */
export default function NettingFigure({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const m = (key: string, values?: Record<string, string>) =>
    t(
      locale,
      `network.tdh.formal.figure.${key}` as Parameters<typeof t>[1],
      values
    );
  const card =
    "tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.08] tw-bg-iron-900 tw-p-4";
  return (
    <figure className="tw-m-0">
      <figcaption className="tw-mb-3 tw-text-sm tw-font-medium tw-text-iron-200">
        {m("title")}
      </figcaption>
      <p className="tw-sr-only">{m("desc")}</p>
      <div aria-hidden="true">
        <div className="tw-grid tw-items-start tw-gap-3 md:tw-grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:tw-items-center">
          <div className={card}>
            <p className="tw-m-0 tw-flex tw-justify-between tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400">
              <span>{m("logged")}</span>
              <span className="tw-normal-case tw-tracking-normal">
                {m("steps", { count: "3" })}
              </span>
            </p>
            <ol className="tw-m-0 tw-mt-3 tw-list-none tw-space-y-1.5 tw-p-0">
              <Step from="A" to="X" muted />
              <Step from="X" to="A" muted />
              <Step from="A" to="B" />
            </ol>
          </div>
          <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-2 tw-rounded-xl tw-border tw-border-dashed tw-border-primary-400/40 tw-px-4 tw-py-3 tw-text-center">
            <span className="tw-text-xs tw-font-medium tw-text-primary-300">
              {m("net")}
            </span>
            <span className="tw-flex tw-flex-wrap tw-justify-center tw-gap-1.5">
              <Net label="A" value="−1" />
              <Net label="B" value="+1" />
              <Net label="X" value="0" />
            </span>
          </div>
          <div className={card}>
            <p className="tw-m-0 tw-flex tw-justify-between tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400">
              <span>{m("direct")}</span>
              <span className="tw-normal-case tw-tracking-normal">
                {m("step")}
              </span>
            </p>
            <ol className="tw-m-0 tw-mt-3 tw-list-none tw-space-y-1.5 tw-p-0">
              <Step from="A" to="B" />
            </ol>
          </div>
        </div>
        <div className="tw-mt-3 tw-flex tw-items-start tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-success/40 tw-bg-success/[0.06] tw-p-4">
          <CheckCircleIcon className="tw-mt-0.5 tw-size-5 tw-shrink-0 tw-text-success" />
          <span>
            <span className="tw-block tw-text-sm tw-font-semibold tw-text-iron-50">
              {m("result")}
            </span>
            <span className="tw-mt-0.5 tw-block tw-text-sm tw-leading-6 tw-text-iron-300">
              {m("resultNote")}
            </span>
          </span>
        </div>
      </div>
    </figure>
  );
}
