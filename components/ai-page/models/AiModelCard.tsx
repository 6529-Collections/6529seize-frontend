import {
  ArrowUpRightIcon,
  CheckCircleIcon,
  ShieldExclamationIcon,
} from "@heroicons/react/20/solid";
import { Fragment } from "react";

import { formatDate, formatNumber } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import "@/i18n/namespaces/ai-download";
import {
  getAiModelLine,
  getMeasuredNote,
  isOriginalModelScore,
  type AiModel,
  type AiModelMeasured,
} from "@/lib/ai-page/models";
import { AI_CARD } from "../AiPageFrame";
import AiModelFold from "./AiModelFold";

// Rendered on the server, in the locale the server renders.
const LOCALE = DEFAULT_LOCALE;
const ONE_DECIMAL = { minimumFractionDigits: 1, maximumFractionDigits: 1 };

const SUBHEAD =
  "tw-m-0 tw-text-[11px] tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-wider tw-text-iron-500";
const QUIET_LINK =
  "tw-inline-flex tw-items-center tw-gap-0.5 tw-text-iron-300 tw-no-underline tw-decoration-iron-500 tw-underline-offset-2 hover:tw-text-iron-50 hover:tw-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400";

export function formatGB(size: number): string {
  return t(LOCALE, "ai.files.size.gb", {
    size: formatNumber(LOCALE, size, ONE_DECIMAL),
  });
}

function mediumWords(values: readonly string[]): string {
  const words = values.map((value) =>
    t(LOCALE, `ai.models.medium.${value}` as MessageKey)
  );
  const text = words.join(", ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function Status({ model }: { readonly model: AiModel }) {
  if (model.runsToday) {
    return (
      <p className="tw-m-0 tw-flex tw-items-start tw-gap-1.5 tw-text-sm tw-leading-5">
        <CheckCircleIcon
          aria-hidden="true"
          className="tw-mt-px tw-size-4 tw-flex-none tw-text-emerald-400"
        />
        <span>
          <span className="tw-font-medium tw-text-emerald-300">
            {t(LOCALE, "ai.models.card.inApp")}
          </span>
          {model.today.can.length > 0 && (
            <span className="tw-text-iron-400">
              {" "}
              · {model.today.can.join("; ")}
            </span>
          )}
        </span>
      </p>
    );
  }
  return (
    <p className="tw-m-0 tw-flex tw-items-start tw-gap-1.5 tw-text-sm tw-leading-5 tw-text-iron-400">
      <span
        aria-hidden="true"
        className="tw-ml-[3px] tw-mr-px tw-mt-[5px] tw-size-2.5 tw-flex-none tw-rounded-full tw-border-[1.5px] tw-border-solid tw-border-iron-500"
      />
      <span>
        <span className="tw-font-medium tw-text-iron-200">
          {t(LOCALE, "ai.models.card.notYet")}
        </span>
        {model.today.whyNot && <> · {model.today.whyNot}</>}
      </span>
    </p>
  );
}

/** Parameters, context, what it reads and makes, memory and license. */
function Facts({ model }: { readonly model: AiModel }) {
  const smallest = Math.min(
    ...model.variants.map((variant) => variant.memoryGB)
  );
  const facts: {
    readonly key: string;
    readonly label: string;
    readonly value: string;
  }[] = [];
  if (model.parameters) {
    facts.push({
      key: "parameters",
      label: t(LOCALE, "ai.models.card.parameters"),
      value: model.parameters.text,
    });
  }
  if (model.contextLength) {
    facts.push({
      key: "context",
      label: t(LOCALE, "ai.models.card.context"),
      value: model.contextLength.text,
    });
  }
  facts.push(
    {
      key: "reads",
      label: t(LOCALE, "ai.models.filter.reads"),
      value: mediumWords(model.inputs),
    },
    {
      key: "makes",
      label: t(LOCALE, "ai.models.filter.makes"),
      value: mediumWords(model.outputs),
    },
    {
      key: "memory",
      label: t(LOCALE, "ai.models.card.memory"),
      value: t(LOCALE, "ai.models.card.memoryFrom", {
        size: formatGB(smallest),
      }),
    }
  );
  return (
    <dl className="tw-m-0 tw-flex tw-flex-wrap tw-gap-x-4 tw-gap-y-1 tw-text-[13px] tw-leading-5">
      {facts.map((fact) => (
        <div key={fact.key} className="tw-flex tw-gap-1.5">
          <dt className="tw-text-iron-500">{fact.label}</dt>
          <dd className="tw-m-0 tw-tabular-nums tw-text-iron-200">
            {fact.value}
          </dd>
        </div>
      ))}
      <div className="tw-flex tw-gap-1.5">
        <dt className="tw-text-iron-500">
          {t(LOCALE, "ai.models.card.license")}
        </dt>
        <dd className="tw-m-0 tw-text-iron-200">
          {model.license.url ? (
            <a
              href={model.license.url}
              rel="noopener noreferrer"
              className={QUIET_LINK}
            >
              {model.license.name}
            </a>
          ) : (
            model.license.name
          )}
          <span className="tw-text-iron-500">
            {" "}
            (
            {t(
              LOCALE,
              model.license.class === "permissive"
                ? "ai.models.card.permissive"
                : "ai.models.card.conditional"
            )}
            )
          </span>
        </dd>
      </div>
    </dl>
  );
}

/** A conditional license's terms, and where it doesn't apply, one click away. */
function Terms({ model }: { readonly model: AiModel }) {
  const places = model.license.territoriesExcluded;
  if (model.license.class === "permissive" && !places) {
    return null;
  }
  return (
    <details className="tw-group tw-text-[13px] tw-leading-5">
      <summary className="tw-inline-flex tw-min-h-11 tw-cursor-pointer tw-list-none tw-items-center tw-gap-1 tw-text-iron-400 hover:tw-text-iron-100 sm:tw-min-h-0 [&::-webkit-details-marker]:tw-hidden">
        {t(LOCALE, "ai.models.card.licenseTerms")}
        <span
          aria-hidden="true"
          className="tw-text-iron-600 tw-transition group-open:tw-rotate-90"
        >
          ›
        </span>
      </summary>
      <p className="tw-mb-0 tw-mt-1.5 tw-max-w-prose tw-text-iron-400">
        {model.license.summary}
        {places && (
          <>
            {" "}
            {t(LOCALE, "ai.models.card.territories", {
              places: places.join(", "),
            })}
          </>
        )}
      </p>
    </details>
  );
}

function Versions({ model }: { readonly model: AiModel }) {
  const cell = "tw-py-1.5 tw-pr-3 tw-align-top";
  return (
    <div className="tw-min-w-0">
      <table className="tw-w-full tw-border-collapse tw-text-left tw-text-[13px] tw-leading-5">
        <caption className={`${SUBHEAD} tw-pb-1.5 tw-text-left`}>
          {t(LOCALE, "ai.models.card.versions")}
        </caption>
        <thead className="tw-sr-only">
          <tr>
            <th scope="col">{t(LOCALE, "ai.models.card.versionColumn")}</th>
            <th scope="col">{t(LOCALE, "ai.models.card.sizeColumn")}</th>
            <th scope="col">{t(LOCALE, "ai.models.card.memoryColumn")}</th>
            <th scope="col">{t(LOCALE, "ai.models.card.appColumn")}</th>
          </tr>
        </thead>
        <tbody>
          {model.variants.map((variant) => {
            // A reason of its own, when it differs from the card's: the
            // safetensors files of a model that runs as GGUF, say.
            const reason =
              !variant.runsToday &&
              variant.whyNot &&
              variant.whyNot !== model.today.whyNot
                ? variant.whyNot
                : null;
            return (
              <Fragment key={variant.entry}>
                <tr className="tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06]">
                  <td className={`${cell} tw-whitespace-nowrap`}>
                    <span className="tw-font-mono tw-text-[12px] tw-text-iron-100">
                      {variant.quantization ?? variant.format}
                    </span>
                    {variant.quantization && (
                      <span className="tw-text-iron-500">
                        {" "}
                        {variant.format}
                      </span>
                    )}
                  </td>
                  <td
                    className={`${cell} tw-whitespace-nowrap tw-tabular-nums tw-text-iron-300`}
                  >
                    {formatGB(variant.sizeGB)}
                  </td>
                  <td
                    className={`${cell} tw-whitespace-nowrap tw-tabular-nums tw-text-iron-500`}
                  >
                    {t(LOCALE, "ai.models.card.needs", {
                      size: formatGB(variant.memoryGB),
                    })}
                  </td>
                  <td className="tw-whitespace-nowrap tw-py-1.5 tw-text-right tw-align-top">
                    {variant.runsToday ? (
                      <>
                        <CheckCircleIcon
                          aria-hidden="true"
                          className="tw-inline tw-size-4 tw-text-emerald-400"
                        />
                        <span className="tw-sr-only">
                          {t(LOCALE, "ai.models.card.inApp")}
                        </span>
                      </>
                    ) : (
                      <span className="tw-text-iron-500">
                        {t(LOCALE, "ai.models.card.versionNo")}
                      </span>
                    )}
                  </td>
                </tr>
                {(variant.part ?? reason) && (
                  <tr>
                    <td
                      colSpan={4}
                      className="tw-pb-1.5 tw-text-xs tw-leading-4 tw-text-iron-500"
                    >
                      {[variant.part, reason].filter(Boolean).join(" · ")}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Scores({ model }: { readonly model: AiModel }) {
  if (model.benchmarks.length === 0) {
    return null;
  }
  const originals = model.benchmarks.filter(isOriginalModelScore).length;
  const allOriginal = originals === model.benchmarks.length;
  return (
    <div className="tw-min-w-0">
      <h4 className={`${SUBHEAD} tw-pb-1.5`}>
        {t(LOCALE, "ai.models.card.scores")}
        {allOriginal && (
          <span className="tw-font-medium tw-normal-case tw-tracking-normal tw-text-iron-500">
            {" "}
            · {t(LOCALE, "ai.models.card.originalScores")}
          </span>
        )}
      </h4>
      <ul className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-p-0">
        {model.benchmarks.map((benchmark) => (
          <li
            key={benchmark.name}
            className="tw-flex tw-items-baseline tw-justify-between tw-gap-3 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-py-1.5 tw-text-[13px] tw-leading-5"
          >
            <a
              href={benchmark.source}
              rel="noopener noreferrer"
              title={benchmark.note ?? undefined}
              className={`tw-min-w-0 ${QUIET_LINK}`}
            >
              <span className="tw-truncate">{benchmark.name}</span>
              <ArrowUpRightIcon
                aria-hidden="true"
                className="tw-size-3 tw-flex-none tw-text-iron-600"
              />
            </a>
            <span className="tw-flex tw-flex-none tw-items-baseline tw-gap-1.5 tw-tabular-nums">
              {!allOriginal && isOriginalModelScore(benchmark) && (
                <span className="tw-text-[11px] tw-text-iron-500">
                  {t(LOCALE, "ai.models.card.original")}
                </span>
              )}
              <span className="tw-font-semibold tw-text-iron-50">
                {benchmark.score}
                {benchmark.unit === "%" ? "%" : ""}
              </span>
              {benchmark.lowerIsBetter && (
                <span className="tw-text-[11px] tw-text-iron-500">
                  {t(LOCALE, "ai.models.card.lowerIsBetter")}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function speed(run: AiModelMeasured): string {
  if (run.tokensPerSecond !== undefined) {
    return t(LOCALE, "ai.models.card.tokensPerSecond", {
      speed: formatNumber(LOCALE, run.tokensPerSecond),
    });
  }
  if (
    run.tokensPerSecondMin !== undefined &&
    run.tokensPerSecondMax !== undefined
  ) {
    return t(LOCALE, "ai.models.card.tokensPerSecondRange", {
      min: formatNumber(LOCALE, run.tokensPerSecondMin),
      max: formatNumber(LOCALE, run.tokensPerSecondMax),
    });
  }
  return run.result ?? t(LOCALE, "ai.models.card.ranNoSpeed");
}

function Measured({ model }: { readonly model: AiModel }) {
  if (model.measured.length === 0) {
    return null;
  }
  return (
    <div className="tw-rounded-lg tw-border tw-border-solid tw-border-emerald-400/15 tw-bg-emerald-400/[0.04] tw-px-3.5 tw-py-3">
      <h4 className={`${SUBHEAD} tw-pb-1.5 tw-text-emerald-300/90`}>
        {t(LOCALE, "ai.models.card.measured")}
      </h4>
      <ul className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-1.5 tw-p-0">
        {model.measured.map((run) => {
          const note = getMeasuredNote(run);
          return (
            <li
              key={`${run.machine}-${run.date}-${speed(run)}`}
              className="tw-text-[13px] tw-leading-5"
            >
              <span className="tw-font-semibold tw-text-iron-50">
                {speed(run)}
              </span>
              <span className="tw-text-iron-300"> · {run.machine}</span>
              <span className="tw-text-iron-500">
                {" "}
                ·{" "}
                {formatDate(LOCALE, new Date(`${run.date}T00:00:00Z`), {
                  dateStyle: "medium",
                  timeZone: "UTC",
                })}
              </span>
              {note && (
                <span className="tw-block tw-text-xs tw-text-iron-500">
                  {note}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * One model. From 1024 px a row: what it is on the left, its versions and
 * scores beside it; on a phone a card with the versions and scores folded.
 */
export default function AiModelCard({ model }: { readonly model: AiModel }) {
  const hasScores = model.benchmarks.length > 0;
  return (
    <article
      id={`model-${model.id}`}
      aria-labelledby={`model-${model.id}-name`}
      className={`${AI_CARD} tw-grid tw-scroll-mt-28 tw-gap-x-8 tw-gap-y-3 tw-p-4 sm:tw-p-5 lg:tw-grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,0.95fr)]`}
    >
      <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-2.5">
        <header className="tw-flex tw-flex-col tw-gap-0.5">
          <h3
            id={`model-${model.id}-name`}
            className="tw-m-0 tw-text-[17px] tw-font-semibold tw-leading-6 tw-tracking-tight tw-text-iron-50"
          >
            {model.name}
          </h3>
          <p className="tw-m-0 tw-text-[13px] tw-leading-5 tw-text-iron-500">
            <a
              href={model.source.url}
              rel="noopener noreferrer"
              className={QUIET_LINK}
            >
              {model.publisher}
              <ArrowUpRightIcon
                aria-hidden="true"
                className="tw-size-3 tw-text-iron-600"
              />
            </a>
            {model.packagedBy && (
              <>
                {" "}
                ·{" "}
                {t(LOCALE, "ai.models.card.packagedBy", {
                  packager: model.packagedBy,
                })}
              </>
            )}
          </p>
        </header>
        <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
          {getAiModelLine(model)}
        </p>
        {model.refusalsRemoved && (
          <p className="tw-m-0 tw-flex tw-items-start tw-gap-1.5 tw-text-sm tw-leading-5 tw-text-amber-200/90">
            <ShieldExclamationIcon
              aria-hidden="true"
              className="tw-mt-px tw-size-4 tw-flex-none tw-text-amber-300"
            />
            <span>{model.refusalsRemoved.note}</span>
          </p>
        )}
        <Status model={model} />
        {model.today.note && (
          <p className="tw-m-0 tw-text-[13px] tw-leading-5 tw-text-iron-500">
            {model.today.note}
          </p>
        )}
        <Facts model={model} />
        <Terms model={model} />
      </div>
      <AiModelFold
        show={t(LOCALE, "ai.models.card.details")}
        hide={t(LOCALE, "ai.models.card.hideDetails")}
        className="tw-flex tw-min-w-0 tw-flex-col tw-gap-4 max-lg:tw-mt-2 max-lg:tw-border-0 max-lg:tw-border-t max-lg:tw-border-solid max-lg:tw-border-white/[0.06] max-lg:tw-pt-4 lg:tw-col-span-2"
      >
        <div
          className={`tw-grid tw-gap-x-8 tw-gap-y-4 ${hasScores ? "md:tw-grid-cols-2" : ""}`}
        >
          <Versions model={model} />
          <Scores model={model} />
        </div>
        <Measured model={model} />
      </AiModelFold>
    </article>
  );
}
