"use client";

import styles from "./NextGenToken.module.css";

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
    <details>
      <summary className="tw-cursor-pointer tw-py-2 focus:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-primary-400">
        <div className="tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
          <div className="-tw-mx-3 tw-flex tw-flex-wrap">
            <div
              className="tw-relative tw-w-5/12 tw-shrink-0 tw-grow-0 tw-basis-auto tw-px-3"
              style={{ maxWidth: "100%" }}
            >
              {props.title}
            </div>
            <div
              className="tw-relative tw-w-1/6 tw-shrink-0 tw-grow-0 tw-basis-auto tw-px-3"
              style={{ maxWidth: "100%" }}
            ></div>
            <div
              className="tw-relative tw-w-1/6 tw-shrink-0 tw-grow-0 tw-basis-auto tw-px-3 tw-text-center"
              style={{ maxWidth: "100%" }}
            >
              <span className="tw-text-[#9a9a9a]">Rank:</span> #
              {props.rank.toLocaleString()}
            </div>
            <div
              className="tw-relative tw-w-1/6 tw-shrink-0 tw-grow-0 tw-basis-auto tw-px-3 tw-text-center"
              style={{ maxWidth: "100%" }}
            >
              <span className="tw-text-[#9a9a9a]">Score:</span>{" "}
              {displayScore(props.score)}
            </div>
          </div>
        </div>
      </summary>
      {props.traits && (
        <div className={styles["tokenPropertiesAccordionBody"]}>
          <div className="tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
            <table className="tw-w-full tw-border-collapse">
              <thead>
                <tr className="tw-border-b tw-border-solid tw-border-iron-700">
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
                      key={`trait-${t.trait.replaceAll(
                        " ",
                        "-"
                      )}-${t.value.replaceAll(" ", "-")}`}
                    >
                      <td className="tw-w-5/12 tw-px-3 tw-py-2">
                        <span className="tw-text-[#9a9a9a]">{t.trait}:</span>{" "}
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
    <div className="tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3 tw-pb-4">
          <h3 className="tw-mb-0">Rarity</h3>
        </div>
      </div>
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
          <p>Please be careful with rarity in generative collections.</p>
          <p>
            While it can be an interesting thing to know, many less experienced
            collectors over-estimate its importance. A piece of generative art
            can be rare but not aesthetically pleasing. Rarity also does not
            necessarily correlate to the value of a piece of generative art.
          </p>
        </div>
      </div>
      <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-py-4">
        <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3 tw-text-lg tw-font-bold">
          {props.token.name}
        </div>
      </div>
      <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-py-2">
        <div className="tw-relative tw-flex tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-items-center tw-justify-between tw-px-3">
          <span className="tw-flex tw-gap-4">
            <span className="tw-flex tw-items-center tw-gap-1">
              <NextgenRarityToggle
                title={"Trait Normalization"}
                show={showNormalised}
                setShow={setShowNormalised}
              />
            </span>
            <span className="tw-flex tw-items-center tw-gap-1">
              <NextgenRarityToggle
                title={"Trait Count"}
                show={showTraitCount}
                setShow={setShowTraitCount}
              />
            </span>
          </span>
          <span>Token Count: {props.tokenCount.toLocaleString()}</span>
        </div>
      </div>
      <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-py-2">
        <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
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
        </div>
      </div>
      <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-py-2">
        <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
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
        </div>
      </div>
      <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-py-2">
        <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
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
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3"></div>
      </div>
    </div>
  );
}

export function NextgenTokenTraits(props: Readonly<Props>) {
  return (
    <div className="tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3 tw-pb-4">
          <h3 className="tw-mb-0">Traits</h3>
        </div>
      </div>
      {props.traits.map((t) => (
        <div
          className="-tw-mx-3 tw-flex tw-flex-wrap"
          key={`trait-${t.trait.replaceAll(" ", "-")}`}
        >
          <div className="tw-relative tw-flex tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-gap-2 tw-px-3 tw-pb-4">
            <span className="tw-text-[#9a9a9a]">{t.trait}:</span>
            <span>
              <Link
                href={`/nextgen/collection/${formatNameForUrl(
                  props.collection.name
                )}/art?traits=${t.trait}:${t.value}`}
              >
                {t.value}
              </Link>
            </span>
            <span className="tw-text-[#9a9a9a]">
              {t.value_count.toLocaleString()}/{t.token_count.toLocaleString()}
            </span>
          </div>
        </div>
      ))}
    </div>
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
        className={props.disabled ? "tw-text-[#9a9a9a]" : "tw-text-white"}
      >
        <b>{props.title}</b>
      </label>
    </>
  );
}
