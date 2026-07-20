"use client";

import type {
  NextGenCollection,
  NextGenToken,
  NextGenTrait,
} from "@/entities/INextgen";

import Link from "next/link";
import { useState } from "react";
import Toggle from "react-toggle";
import { formatNameForUrl } from "@/components/nextGen/nextgen_helpers";

interface Props {
  collection: NextGenCollection;
  token: NextGenToken;
  traits: NextGenTrait[];
  tokenCount: number;
}

export function displayScore(number: number) {
  const precision = 3;
  if (number >= 0.01) {
    return number.toLocaleString(undefined, {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    });
  }

  if (0.001 > number) {
    return number.toExponential(precision);
  }

  return number.toPrecision(precision);
}

function TraitAccordion(
  props: Readonly<{
    title: string;
    score: number;
    rank: number;
    token_count: number;
    collection: NextGenCollection;
    traits?:
      | {
          trait: string;
          value: string;
          score: number;
          score_dps?: number | undefined;
          rank: number;
          trait_count: number;
          value_count: number;
        }[]
      | undefined;
  }>
) {
  return (
    <details className="tw-group tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/80">
      <summary className="tw-cursor-pointer tw-list-none tw-p-4 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400">
        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
          <span className="tw-flex tw-items-center tw-gap-3 tw-font-semibold tw-text-white before:tw-text-xl before:tw-text-iron-400 before:tw-transition-transform before:tw-content-['›'] group-open:before:tw-rotate-90">
            {props.title}
          </span>
          <span className="tw-grid tw-grid-cols-2 tw-gap-4 tw-text-sm sm:tw-gap-8">
            <span>
              <span className="tw-text-iron-400">Rank:</span> #
              {props.rank.toLocaleString()}
            </span>
            <span>
              <span className="tw-text-iron-400">Score:</span>{" "}
              {displayScore(props.score)}
            </span>
          </span>
        </div>
      </summary>
      {props.traits && (
        <div className="tw-overflow-x-auto tw-border-0 tw-border-t tw-border-solid tw-border-white/10 tw-bg-black/20">
          <table className="tw-w-full tw-min-w-[720px] tw-border-collapse">
            <thead>
              <tr className="tw-border-b tw-border-solid tw-border-white/10 tw-text-sm tw-text-iron-400">
                <th
                  scope="col"
                  className="tw-w-5/12 tw-px-3 tw-py-2 tw-text-left tw-font-normal"
                >
                  Trait
                </th>
                <th
                  scope="col"
                  className="tw-w-1/6 tw-px-3 tw-py-2 tw-text-center tw-font-normal"
                >
                  Quantity
                </th>
                <th
                  scope="col"
                  className="tw-w-1/6 tw-px-3 tw-py-2 tw-text-center tw-font-normal"
                >
                  Rank
                </th>
                <th
                  scope="col"
                  className="tw-w-1/6 tw-px-3 tw-py-2 tw-text-center tw-font-normal"
                >
                  Score
                </th>
              </tr>
            </thead>
            <tbody>
              {props.traits
                .filter((t) => t.score !== -1)
                .map((t) => (
                  <tr
                    className="tw-border-0 tw-border-b tw-border-solid tw-border-white/5 last:tw-border-b-0"
                    key={`trait-${t.trait.replaceAll(
                      " ",
                      "-"
                    )}-${t.value.replaceAll(" ", "-")}`}
                  >
                    <td className="tw-w-5/12 tw-px-3 tw-py-2">
                      <span className="tw-text-iron-400">{t.trait}:</span>{" "}
                      <Link
                        href={`/nextgen/collection/${formatNameForUrl(
                          props.collection.name
                        )}/art?traits=${t.trait}:${t.value}`}
                      >
                        {t.value}
                      </Link>
                    </td>
                    <td className="tw-w-1/6 tw-px-3 tw-py-2 tw-text-center">
                      {t.value_count.toLocaleString()} (
                      {((t.value_count / props.token_count) * 100).toFixed(1)}
                      %)
                    </td>
                    <td className="tw-w-1/6 tw-px-3 tw-py-2 tw-text-center">
                      {t.rank}/{t.trait_count}
                    </td>
                    <td className="tw-w-1/6 tw-px-3 tw-py-2 tw-text-center">
                      {displayScore(t.score)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </details>
  );
}

export default function NextgenTokenRarity(props: Readonly<Props>) {
  const [showNormalised, setShowNormalised] = useState(true);
  const [showTraitCount, setShowTraitCount] = useState(true);

  function getRarityScore() {
    if (showNormalised && showTraitCount) {
      return props.token.rarity_score_trait_count_normalised;
    }
    if (showNormalised) {
      return props.token.rarity_score_normalised;
    }
    if (showTraitCount) {
      return props.token.rarity_score_trait_count;
    }
    return props.token.rarity_score;
  }

  function getStatisticalScore() {
    if (showNormalised && showTraitCount) {
      return props.token.statistical_score_trait_count_normalised;
    }
    if (showNormalised) {
      return props.token.statistical_score_normalised;
    }
    if (showTraitCount) {
      return props.token.statistical_score_trait_count;
    }
    return props.token.statistical_score;
  }

  function getSingleTraitRarityScore() {
    if (showNormalised && showTraitCount) {
      return props.token.single_trait_rarity_score_trait_count_normalised;
    }
    if (showNormalised) {
      return props.token.single_trait_rarity_score_normalised;
    }
    if (showTraitCount) {
      return props.token.single_trait_rarity_score_trait_count;
    }
    return props.token.single_trait_rarity_score;
  }

  function getRarityRank() {
    if (showNormalised && showTraitCount) {
      return props.token.rarity_score_trait_count_normalised_rank;
    }
    if (showNormalised) {
      return props.token.rarity_score_normalised_rank;
    }
    if (showTraitCount) {
      return props.token.rarity_score_trait_count_rank;
    }
    return props.token.rarity_score_rank;
  }

  function getStatisticalRank() {
    if (showNormalised && showTraitCount) {
      return props.token.statistical_score_trait_count_normalised_rank;
    }
    if (showNormalised) {
      return props.token.statistical_score_normalised_rank;
    }
    if (showTraitCount) {
      return props.token.statistical_score_trait_count_rank;
    }
    return props.token.statistical_score_rank;
  }

  function getSingleTraitRarityRank() {
    if (showNormalised && showTraitCount) {
      return props.token.single_trait_rarity_score_trait_count_normalised_rank;
    }
    if (showNormalised) {
      return props.token.single_trait_rarity_score_normalised_rank;
    }
    if (showTraitCount) {
      return props.token.single_trait_rarity_score_trait_count_rank;
    }
    return props.token.single_trait_rarity_score_rank;
  }

  function getTraitRarityScore(t: NextGenTrait) {
    if (showNormalised && showTraitCount) {
      return t.rarity_score_trait_count_normalised;
    }
    if (showNormalised) {
      return t.rarity_score_normalised;
    }
    return t.rarity_score;
  }

  function getTraitRarityRank(t: NextGenTrait) {
    if (showNormalised && showTraitCount) {
      return t.rarity_score_trait_count_normalised_rank;
    }
    if (showNormalised) {
      return t.rarity_score_normalised_rank;
    }
    return t.rarity_score_rank;
  }

  function getTraitStatisticalScore(t: NextGenTrait) {
    if (showNormalised) {
      return t.statistical_rarity_normalised;
    }
    return t.statistical_rarity;
  }

  function getTraitStatisticalRank(t: NextGenTrait) {
    if (showNormalised) {
      return t.statistical_rarity_normalised_rank;
    }
    return t.statistical_rarity_rank;
  }

  function getTraitSingleRarityScore(t: NextGenTrait) {
    if (showNormalised) {
      return t.single_trait_rarity_score_normalised;
    }
    return t.statistical_rarity;
  }

  function getTraitSingleRarityRank(t: NextGenTrait) {
    if (showNormalised) {
      return t.single_trait_rarity_score_normalised_rank;
    }
    return t.statistical_rarity_rank;
  }

  return (
    <section>
      <div>
        <h2 className="tw-mb-3 tw-mt-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-white sm:tw-text-2xl">
          Rarity
        </h2>
        <p className="tw-text-base tw-text-white">
          Please be careful with rarity in generative collections.
        </p>
        <p className="tw-mb-0 tw-text-base tw-leading-7 tw-text-iron-300">
          While it can be interesting to know, rarity does not necessarily
          correlate with aesthetic quality or the value of generative art.
        </p>
      </div>

      <div className="tw-mt-6">
        <div className="tw-mb-4 tw-flex tw-flex-col tw-gap-3 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
          <h3 className="tw-m-0 tw-text-lg tw-font-semibold tw-text-white">
            {props.token.name}
          </h3>
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-5 tw-gap-y-3">
            <span className="tw-flex tw-items-center tw-gap-2">
              <NextgenRarityToggle
                title={"Trait Normalization"}
                show={showNormalised}
                setShow={setShowNormalised}
              />
            </span>
            <span className="tw-flex tw-items-center tw-gap-2">
              <NextgenRarityToggle
                title={"Trait Count"}
                show={showTraitCount}
                setShow={setShowTraitCount}
              />
            </span>
            <span className="tw-text-sm tw-text-iron-400">
              Token count: {props.tokenCount.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="tw-grid tw-gap-3">
          <TraitAccordion
            title={"Rarity"}
            score={getRarityScore()}
            rank={getRarityRank()}
            collection={props.collection}
            token_count={props.tokenCount}
            traits={props.traits
              .map((t) => ({
                trait: t.trait,
                value: t.value,
                score: getTraitRarityScore(t),
                rank: getTraitRarityRank(t),
                trait_count: t.trait_count,
                value_count: t.value_count,
              }))
              .sort((a, b) => b.score - a.score)}
          />
          <TraitAccordion
            title={"Statistical Rarity"}
            score={getStatisticalScore()}
            rank={getStatisticalRank()}
            collection={props.collection}
            token_count={props.tokenCount}
            traits={props.traits
              .map((t) => ({
                trait: t.trait,
                value: t.value,
                score: getTraitStatisticalScore(t),
                rank: getTraitStatisticalRank(t),
                trait_count: t.trait_count,
                value_count: t.value_count,
              }))
              .sort((a, b) => b.score - a.score)}
          />
          <TraitAccordion
            title={"Single Trait Rarity"}
            score={getSingleTraitRarityScore()}
            rank={getSingleTraitRarityRank()}
            collection={props.collection}
            token_count={props.tokenCount}
            traits={props.traits.map((t) => ({
              trait: t.trait,
              value: t.value,
              score: getTraitSingleRarityScore(t),
              rank: getTraitSingleRarityRank(t),
              trait_count: t.trait_count,
              value_count: t.value_count,
            }))}
          />
        </div>
      </div>
    </section>
  );
}

export function NextgenTokenTraits(props: Readonly<Props>) {
  return (
    <section>
      <h3 className="tw-mb-3 tw-mt-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-white">
        Traits
      </h3>
      <dl className="tw-m-0 tw-divide-y tw-divide-white/10">
        {props.traits.map((t) => (
          <div
            className="tw-grid tw-gap-1 tw-py-3 sm:tw-grid-cols-[minmax(9rem,0.38fr)_minmax(0,0.62fr)] sm:tw-gap-4"
            key={`trait-${t.trait.replaceAll(" ", "-")}`}
          >
            <dt className="tw-text-sm tw-font-medium tw-text-iron-400">
              {t.trait}:
            </dt>
            <dd className="tw-m-0 tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
              <Link
                href={`/nextgen/collection/${formatNameForUrl(
                  props.collection.name
                )}/art?traits=${t.trait}:${t.value}`}
              >
                {t.value}
              </Link>
              <span className="tw-text-sm tw-text-iron-400">
                {t.value_count.toLocaleString()}/
                {t.token_count.toLocaleString()}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function NextgenRarityToggle(
  props: Readonly<{
    title: string;
    show: boolean;
    disabled?: boolean | undefined;
    setShow?: ((show: boolean) => void) | undefined;
  }>
) {
  const label = props.title.replaceAll(" ", "-").toLowerCase();
  return (
    <>
      <Toggle
        disabled={props.disabled}
        id={label}
        checked={props.show}
        onChange={() => props.setShow?.(!props.show)}
      />
      <label
        htmlFor={label}
        className={`tw-font-medium ${
          props.disabled ? "tw-text-iron-500" : "tw-text-white"
        }`}
      >
        {props.title}
      </label>
    </>
  );
}
