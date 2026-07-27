"use client";

import { useMemo, useState } from "react";

import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  SolidityAuditorEvidence,
  SolidityGovernedParameter,
} from "@/lib/public-review/solidityReferenceTypes";

export interface SolidityGovernedParameterListItem extends Omit<
  SolidityGovernedParameter,
  "normative_source"
> {
  readonly normative_source: SolidityGovernedParameter["normative_source"] & {
    readonly href: string;
  };
}

type GovernedInventory = SolidityAuditorEvidence["governedParameterInventory"];

const INPUT_CLASSES =
  "tw-min-h-11 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-base tw-text-iron-50 tw-outline-none focus:tw-border-primary-400 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/40";

function matchesQuery(
  item: SolidityGovernedParameterListItem,
  query: string
): boolean {
  return [
    item.name,
    item.constant_name,
    item.preimage,
    item.parameter_id,
    item.normative_source.path,
    ...item.guarded_consumers.consumers,
  ]
    .join(" ")
    .toLocaleLowerCase(DEFAULT_LOCALE)
    .includes(query);
}

export function SolidityGovernedParameterExplorer({
  candidateBinding,
  items,
  policy,
}: {
  readonly candidateBinding: GovernedInventory["candidate_binding"];
  readonly items: readonly SolidityGovernedParameterListItem[];
  readonly policy: GovernedInventory["governance_policy"];
}) {
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase(DEFAULT_LOCALE);
  const filteredItems = useMemo(
    () =>
      items.filter(
        (item) =>
          matchesQuery(item, normalizedQuery) &&
          (!family || item.family === family)
      ),
    [family, items, normalizedQuery]
  );

  return (
    <section
      aria-labelledby="solidity-governed-parameters"
      className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-5"
    >
      <h2
        id="solidity-governed-parameters"
        className="tw-m-0 tw-scroll-mt-28 tw-text-2xl tw-font-semibold tw-text-white"
      >
        {t(DEFAULT_LOCALE, "publicReview.reference.governedParameters")}
      </h2>
      <p className="tw-mb-0 tw-mt-2 tw-max-w-4xl tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(
          DEFAULT_LOCALE,
          "publicReview.reference.governedParametersDescription"
        )}
      </p>
      <dl className="tw-mb-0 tw-mt-5 tw-grid tw-gap-3 sm:tw-grid-cols-2 xl:tw-grid-cols-4">
        {[
          [
            t(DEFAULT_LOCALE, "publicReview.reference.candidateBinding"),
            candidateBinding.status,
          ],
          [
            t(DEFAULT_LOCALE, "publicReview.reference.mutationModel"),
            policy.mutation_model,
          ],
          [
            t(DEFAULT_LOCALE, "publicReview.reference.minimumDelay"),
            t(DEFAULT_LOCALE, "publicReview.reference.seconds", {
              count: formatInteger(
                DEFAULT_LOCALE,
                policy.minimum_delay_seconds
              ),
            }),
          ],
          [
            t(DEFAULT_LOCALE, "publicReview.reference.maximumRaise"),
            `${formatInteger(
              DEFAULT_LOCALE,
              policy.maximum_raise_multiplier.numerator
            )}/${formatInteger(
              DEFAULT_LOCALE,
              policy.maximum_raise_multiplier.denominator
            )}`,
          ],
        ].map(([label, value]) => (
          <div
            className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/60 tw-p-3"
            key={label}
          >
            <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
              {label}
            </dt>
            <dd className="tw-m-0 tw-mt-1 tw-break-words tw-font-mono tw-text-sm tw-text-white">
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
        {t(DEFAULT_LOCALE, "publicReview.reference.forbiddenSurfaces")}{" "}
        {policy.forbidden_surfaces.join(", ")}
      </p>
      <a
        className="tw-mt-2 tw-inline-flex tw-text-sm tw-text-sky-300 tw-no-underline hover:tw-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
        href={candidateBinding.blocked_by_issue}
        rel="noreferrer"
        target="_blank"
      >
        {t(DEFAULT_LOCALE, "publicReview.reference.candidateBindingIssue")}
        <span className="tw-sr-only">
          {" "}
          ({t(DEFAULT_LOCALE, "publicReview.markdown.externalLink")})
        </span>
      </a>
      <div className="tw-mt-5 tw-grid tw-gap-4 tw-rounded-xl tw-bg-iron-900/70 tw-p-4 md:tw-grid-cols-[minmax(0,2fr)_minmax(12rem,1fr)]">
        <label className="tw-block tw-text-sm tw-font-medium tw-text-iron-200">
          <span className="tw-mb-1.5 tw-block">
            {t(DEFAULT_LOCALE, "publicReview.reference.searchParameters")}
          </span>
          <input
            className={INPUT_CLASSES}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t(
              DEFAULT_LOCALE,
              "publicReview.reference.searchParametersPlaceholder"
            )}
            type="search"
            value={query}
          />
        </label>
        <label className="tw-block tw-text-sm tw-font-medium tw-text-iron-200">
          <span className="tw-mb-1.5 tw-block">
            {t(DEFAULT_LOCALE, "publicReview.reference.parameterFamily")}
          </span>
          <select
            className={INPUT_CLASSES}
            onChange={(event) => setFamily(event.target.value)}
            value={family}
          >
            <option value="">
              {t(DEFAULT_LOCALE, "publicReview.reference.all")}
            </option>
            <option value="GGP">GGP</option>
            <option value="GTP">GTP</option>
          </select>
        </label>
      </div>
      <p className="tw-mb-0 tw-mt-4 tw-text-sm tw-text-iron-400" role="status">
        {t(DEFAULT_LOCALE, "publicReview.reference.parameterResults", {
          total: formatInteger(DEFAULT_LOCALE, filteredItems.length),
        })}
      </p>
      <ul className="tw-mb-0 tw-mt-5 tw-list-none tw-space-y-3 tw-p-0">
        {filteredItems.map((item) => (
          <li key={item.parameter_id}>
            <details className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/60 tw-p-4">
              <summary className="tw-cursor-pointer tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white">
                <span className="tw-rounded-full tw-bg-sky-400/10 tw-px-2.5 tw-py-1 tw-text-xs tw-font-semibold tw-text-sky-200">
                  {item.family}
                </span>
                <code className="tw-ml-2 tw-break-all tw-text-sm tw-font-semibold">
                  {item.name}
                </code>
              </summary>
              <dl className="tw-mb-0 tw-mt-5 tw-grid tw-gap-4">
                <div>
                  <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
                    {t(DEFAULT_LOCALE, "publicReview.reference.parameterId")}
                  </dt>
                  <dd className="tw-m-0 tw-mt-1 tw-break-all tw-font-mono tw-text-xs tw-text-sky-300">
                    {item.parameter_id}
                  </dd>
                </div>
                <div>
                  <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
                    {t(
                      DEFAULT_LOCALE,
                      "publicReview.reference.parameterPreimage"
                    )}
                  </dt>
                  <dd className="tw-m-0 tw-mt-1 tw-break-all tw-font-mono tw-text-xs tw-text-iron-200">
                    {item.preimage}
                  </dd>
                </div>
                <div>
                  <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
                    {t(
                      DEFAULT_LOCALE,
                      "publicReview.reference.normativeSource"
                    )}
                  </dt>
                  <dd className="tw-m-0 tw-mt-1">
                    <a
                      className="tw-break-all tw-text-sm tw-text-sky-300 tw-no-underline hover:tw-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
                      href={item.normative_source.href}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {item.normative_source.path}#
                      {item.normative_source.anchor}
                      <span className="tw-sr-only">
                        {" "}
                        (
                        {t(
                          DEFAULT_LOCALE,
                          "publicReview.markdown.externalLink"
                        )}
                        )
                      </span>
                    </a>
                  </dd>
                </div>
                <div className="tw-grid tw-gap-4 sm:tw-grid-cols-2">
                  <div>
                    <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
                      {t(
                        DEFAULT_LOCALE,
                        "publicReview.reference.expectedHosts"
                      )}
                    </dt>
                    <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-text-iron-200">
                      {formatInteger(DEFAULT_LOCALE, item.expected_hosts.count)}{" "}
                      ({item.expected_hosts.status})
                    </dd>
                  </div>
                  <div>
                    <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
                      {t(DEFAULT_LOCALE, "publicReview.reference.consumers")}
                    </dt>
                    <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-text-iron-200">
                      {item.guarded_consumers.consumers.join(", ") ||
                        t(DEFAULT_LOCALE, "publicReview.reference.none")}
                    </dd>
                  </div>
                </div>
                <div className="tw-grid tw-gap-4 sm:tw-grid-cols-3">
                  {item.gas ? (
                    <>
                      <EvidenceValue
                        label={t(
                          DEFAULT_LOCALE,
                          "publicReview.reference.genesisGasValue"
                        )}
                        status={item.gas.genesis_value.status}
                        value={item.gas.genesis_value.value}
                      />
                      <EvidenceValue
                        label={t(
                          DEFAULT_LOCALE,
                          "publicReview.reference.immutableGasFloor"
                        )}
                        status={item.gas.immutable_floor.status}
                        value={item.gas.immutable_floor.value}
                      />
                      <EvidenceValue
                        label={t(
                          DEFAULT_LOCALE,
                          "publicReview.reference.failureClass"
                        )}
                        status={item.gas.failure_class.status}
                        value={item.gas.failure_class.name}
                      />
                    </>
                  ) : null}
                  {item.time ? (
                    <>
                      <EvidenceValue
                        label={t(
                          DEFAULT_LOCALE,
                          "publicReview.reference.genesisBlocks"
                        )}
                        status={item.time.genesis_value_blocks.status}
                        value={item.time.genesis_value_blocks.value}
                      />
                      <EvidenceValue
                        label={t(
                          DEFAULT_LOCALE,
                          "publicReview.reference.immutableBlockFloor"
                        )}
                        status={item.time.immutable_floor_blocks.status}
                        value={item.time.immutable_floor_blocks.value}
                      />
                      <EvidenceValue
                        label={t(
                          DEFAULT_LOCALE,
                          "publicReview.reference.wallClockFloor"
                        )}
                        status={item.time.wall_clock_floor_seconds.status}
                        value={item.time.wall_clock_floor_seconds.value}
                      />
                    </>
                  ) : null}
                </div>
                <div className="tw-grid tw-gap-4 sm:tw-grid-cols-2">
                  <EvidenceValue
                    label={t(
                      DEFAULT_LOCALE,
                      "publicReview.reference.measurementEvidence"
                    )}
                    status={item.measurement_evidence.status}
                    value={item.measurement_evidence.path}
                  />
                  <EvidenceValue
                    label={t(
                      DEFAULT_LOCALE,
                      "publicReview.reference.fixedStipendCompatibility"
                    )}
                    status={item.fixed_stipend_compatibility.status}
                    value={item.fixed_stipend_compatibility.disposition}
                  />
                </div>
              </dl>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}

function EvidenceValue({
  label,
  status,
  value,
}: {
  readonly label: string;
  readonly status: string;
  readonly value: number | string | null;
}) {
  let displayedValue: string;
  if (value === null) {
    displayedValue = t(DEFAULT_LOCALE, "publicReview.reference.none");
  } else if (typeof value === "number") {
    displayedValue = formatInteger(DEFAULT_LOCALE, value);
  } else {
    displayedValue = value;
  }
  return (
    <div>
      <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
        {label}
      </dt>
      <dd className="tw-m-0 tw-mt-1 tw-break-words tw-text-sm tw-text-iron-200">
        {displayedValue} <span className="tw-text-iron-500">({status})</span>
      </dd>
    </div>
  );
}
