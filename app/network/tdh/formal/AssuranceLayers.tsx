import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

/** One layer of the diagram: a band across the figure. */
function Band({
  layer,
  title,
  subtitle,
  tone,
}: {
  readonly layer: string;
  readonly title: string;
  readonly subtitle: string;
  readonly tone: string;
}) {
  return (
    <div
      className={`tw-grid tw-grid-cols-1 tw-items-baseline tw-gap-x-6 tw-gap-y-0.5 tw-rounded-xl tw-border tw-border-solid tw-px-4 tw-py-3.5 sm:tw-grid-cols-[9rem_minmax(0,1fr)] sm:tw-px-5 ${tone}`}
    >
      <p className="tw-m-0 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400">
        {layer}
      </p>
      <div className="tw-min-w-0">
        <p className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50">
          {title}
        </p>
        <p className="tw-m-0 tw-mt-0.5 tw-max-w-[36em] tw-text-sm tw-leading-6 tw-text-iron-300">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

/** A small arrowhead for a connector, pointing up or down. */
function Head({ up }: { readonly up: boolean }) {
  return (
    <svg
      viewBox="0 0 10 6"
      className={`tw-h-1.5 tw-w-2.5 tw-shrink-0 tw-text-iron-400 ${up ? "" : "tw-rotate-180"}`}
    >
      <path d="M0 6 L5 0 L10 6 z" fill="currentColor" />
    </svg>
  );
}

/**
 * The check between two layers, on the arrow that joins them: a dashed
 * line down the middle of the figure, arrowheads inside the gap (up where
 * what is below feeds what is above, at both ends where two layers are
 * checked against each other), and the check's name on the arrow.
 */
function Link({
  label,
  ends,
}: {
  readonly label: string;
  readonly ends: "both" | "up";
}) {
  return (
    <div className="tw-flex tw-flex-col tw-items-center tw-py-1">
      <Head up />
      <span className="tw-h-2 tw-w-0 tw-border-0 tw-border-l-2 tw-border-dashed tw-border-iron-500" />
      <span className="tw-max-w-xl tw-rounded-lg tw-border tw-border-dashed tw-border-iron-600 tw-bg-iron-950 tw-px-3 tw-py-1.5 tw-text-center tw-text-sm tw-leading-5 tw-text-iron-200">
        {label}
      </span>
      <span className="tw-h-2 tw-w-0 tw-border-0 tw-border-l-2 tw-border-dashed tw-border-iron-500" />
      {ends === "both" ? <Head up={false} /> : <span className="tw-h-1.5" />}
    </div>
  );
}

/**
 * Three layers of assurance (plan §8.2) across the section: the English
 * specification, the Lean model and the programs, and under them the inputs
 * that feed the programs, checked outside the model. Each check is named on
 * the arrow between the layers it joins. Only the proofs inside the model
 * are machine-checked; every other link is people or tests.
 */
export default function AssuranceLayers({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const m = (key: string) =>
    t(locale, `network.tdh.formal.layers.${key}` as Parameters<typeof t>[1]);
  return (
    <figure className="tw-m-0">
      <p className="tw-sr-only">{m("desc")}</p>
      <div aria-hidden="true">
        <Band
          layer={m("layer1")}
          title={m("spec")}
          subtitle={m("specSub")}
          tone="tw-border-iron-600 tw-bg-iron-900"
        />
        <Link label={m("people")} ends="both" />
        <Band
          layer={m("layer2")}
          title={m("model")}
          subtitle={m("modelSub")}
          tone="tw-border-success/70 tw-bg-success/10"
        />
        <Link label={m("vectors")} ends="both" />
        <Band
          layer={m("layer3")}
          title={m("programs")}
          subtitle={m("programsSub")}
          tone="tw-border-iron-600 tw-bg-iron-900"
        />
        <Link label={m("inputsEdge")} ends="up" />
        <Band
          layer={m("layerInputs")}
          title={m("inputs")}
          subtitle={m("inputsBody")}
          tone="tw-border-dashed tw-border-iron-500 tw-bg-iron-950"
        />
      </div>
      <figcaption className="tw-mt-4 tw-flex tw-flex-wrap tw-gap-x-6 tw-gap-y-2 tw-text-sm tw-text-iron-300">
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
        <span className="tw-inline-flex tw-items-center tw-gap-2">
          <span
            aria-hidden="true"
            className="tw-h-3 tw-w-5 tw-rounded tw-border tw-border-dashed tw-border-iron-500 tw-bg-iron-950"
          />
          {m("planned")}
        </span>
      </figcaption>
    </figure>
  );
}
