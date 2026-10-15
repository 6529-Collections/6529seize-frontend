import { useId } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

/**
 * Three layers of assurance (plan §8.2): the English specification, the Lean
 * model and the programs, with the inputs checked separately. Only the proofs
 * inside the model are machine-checked links.
 */
export default function AssuranceLayers({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const id = useId();
  const band = (y: number, title: string, subtitle: string, tone: string) => (
    <g>
      <rect
        x="20"
        y={y}
        width="460"
        height="62"
        rx="12"
        className={tone}
        strokeWidth="1.5"
      />
      <text
        x="40"
        y={y + 27}
        className="tw-fill-iron-50 tw-text-[15px] tw-font-semibold"
      >
        {title}
      </text>
      <text x="40" y={y + 47} className="tw-fill-iron-400 tw-text-[12px]">
        {subtitle}
      </text>
    </g>
  );
  return (
    <figure className="tw-m-0">
      <svg
        viewBox="0 0 720 330"
        role="img"
        aria-labelledby={`${id}-title ${id}-desc`}
        className="tw-block tw-h-auto tw-w-full tw-max-w-3xl"
      >
        <title id={`${id}-title`}>
          {t(locale, "network.tdh.formal.layers.title")}
        </title>
        <desc id={`${id}-desc`}>
          {t(locale, "network.tdh.formal.layers.desc")}
        </desc>
        {band(
          16,
          t(locale, "network.tdh.formal.layers.spec"),
          t(locale, "network.tdh.formal.layers.specSub"),
          "tw-fill-iron-900 tw-stroke-iron-600"
        )}
        {band(
          134,
          t(locale, "network.tdh.formal.layers.model"),
          t(locale, "network.tdh.formal.layers.modelSub"),
          "tw-fill-success/10 tw-stroke-success/70"
        )}
        {band(
          252,
          t(locale, "network.tdh.formal.layers.programs"),
          t(locale, "network.tdh.formal.layers.programsSub"),
          "tw-fill-primary-500/10 tw-stroke-primary-400/60"
        )}
        <line
          x1="250"
          x2="250"
          y1="78"
          y2="134"
          strokeDasharray="5 5"
          strokeWidth="1.5"
          className="tw-stroke-iron-500"
        />
        <text x="262" y="111" className="tw-fill-iron-300 tw-text-[12px]">
          {t(locale, "network.tdh.formal.layers.people")}
        </text>
        <line
          x1="250"
          x2="250"
          y1="196"
          y2="252"
          strokeDasharray="5 5"
          strokeWidth="1.5"
          className="tw-stroke-iron-500"
        />
        <text x="262" y="229" className="tw-fill-iron-300 tw-text-[12px]">
          {t(locale, "network.tdh.formal.layers.vectors")}
        </text>
        <rect
          x="516"
          y="252"
          width="190"
          height="62"
          rx="12"
          className="tw-fill-iron-900 tw-stroke-amber-300/50"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <text
          x="530"
          y="276"
          className="tw-fill-iron-50 tw-text-[13px] tw-font-semibold"
        >
          {t(locale, "network.tdh.formal.layers.inputs")}
        </text>
        <text x="530" y="293" className="tw-fill-iron-400 tw-text-[11px]">
          {t(locale, "network.tdh.formal.layers.inputsReads")}
        </text>
        <text x="530" y="307" className="tw-fill-iron-400 tw-text-[11px]">
          {t(locale, "network.tdh.formal.layers.inputsProofs")}
        </text>
        <line
          x1="516"
          x2="482"
          y1="283"
          y2="283"
          strokeWidth="1.5"
          className="tw-stroke-amber-300/60"
        />
      </svg>
      <figcaption className="tw-mt-3 tw-flex tw-flex-wrap tw-gap-x-6 tw-gap-y-2 tw-text-xs tw-text-iron-400">
        <span className="tw-inline-flex tw-items-center tw-gap-2">
          <span
            aria-hidden="true"
            className="tw-h-3 tw-w-5 tw-rounded tw-border tw-border-solid tw-border-success/70 tw-bg-success/10"
          />
          {t(locale, "network.tdh.formal.layers.machine")}
        </span>
        <span className="tw-inline-flex tw-items-center tw-gap-2">
          <span
            aria-hidden="true"
            className="tw-w-5 tw-border-0 tw-border-t-2 tw-border-dashed tw-border-iron-500"
          />
          {t(locale, "network.tdh.formal.layers.human")}
        </span>
      </figcaption>
    </figure>
  );
}
