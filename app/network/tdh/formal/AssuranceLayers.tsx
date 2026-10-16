import { ArrowUpIcon } from "@heroicons/react/24/outline";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

function Band({
  title,
  subtitle,
  tone,
}: {
  readonly title: string;
  readonly subtitle: string;
  readonly tone: string;
}) {
  return (
    <div
      className={`tw-rounded-xl tw-border tw-border-solid tw-px-4 tw-py-3 sm:tw-px-5 ${tone}`}
    >
      <p className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50">
        {title}
      </p>
      <p className="tw-m-0 tw-mt-0.5 tw-text-sm tw-leading-6 tw-text-iron-300">
        {subtitle}
      </p>
    </div>
  );
}

function Link({
  label,
  up = false,
}: {
  readonly label: string;
  /** An arrow up: what is below feeds what is above. */
  readonly up?: boolean;
}) {
  return (
    <div className="tw-flex tw-items-stretch tw-gap-3 tw-pl-6">
      <span
        aria-hidden="true"
        className="tw-relative tw-w-0 tw-border-0 tw-border-l-2 tw-border-dashed tw-border-iron-500"
      >
        {up && (
          <ArrowUpIcon className="tw-absolute -tw-left-[9px] -tw-top-1 tw-size-4 tw-text-iron-400" />
        )}
      </span>
      <span className="tw-py-2 tw-text-sm tw-leading-5 tw-text-iron-300">
        {label}
      </span>
    </div>
  );
}

/**
 * Three layers of assurance (plan §8.2) as one column: the English
 * specification, the Lean model and the programs, and under them the inputs
 * that feed the programs, checked separately. Only the proofs inside the
 * model are machine-checked; every other link is people or tests.
 */
export default function AssuranceLayers({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const m = (key: string) =>
    t(locale, `network.tdh.formal.layers.${key}` as Parameters<typeof t>[1]);
  return (
    <figure className="tw-m-0 tw-max-w-3xl">
      <p className="tw-sr-only">{m("desc")}</p>
      <div aria-hidden="true">
        <Band
          title={m("spec")}
          subtitle={m("specSub")}
          tone="tw-border-iron-600 tw-bg-iron-900"
        />
        <Link label={m("people")} />
        <Band
          title={m("model")}
          subtitle={m("modelSub")}
          tone="tw-border-success/70 tw-bg-success/10"
        />
        <Link label={m("vectors")} />
        <Band
          title={m("programs")}
          subtitle={m("programsSub")}
          tone="tw-border-primary-400/60 tw-bg-primary-500/10"
        />
        <Link label={m("inputsEdge")} up />
        <Band
          title={m("inputs")}
          subtitle={m("inputsBody")}
          tone="tw-border-dashed tw-border-amber-300/50 tw-bg-iron-900"
        />
      </div>
      <figcaption className="tw-mt-4 tw-flex tw-flex-wrap tw-gap-x-6 tw-gap-y-2 tw-text-xs tw-text-iron-300">
        <span className="tw-inline-flex tw-items-center tw-gap-2">
          <span
            aria-hidden="true"
            className="tw-h-3 tw-w-5 tw-rounded tw-border tw-border-solid tw-border-success/70 tw-bg-success/10"
          />
          {m("machine")}
        </span>
        <span className="tw-inline-flex tw-items-center tw-gap-2">
          <span
            aria-hidden="true"
            className="tw-w-5 tw-border-0 tw-border-t-2 tw-border-dashed tw-border-iron-500"
          />
          {m("human")}
        </span>
      </figcaption>
    </figure>
  );
}
