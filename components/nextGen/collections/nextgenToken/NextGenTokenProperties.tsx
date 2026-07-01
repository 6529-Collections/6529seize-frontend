"use client";

import styles from "./NextGenToken.module.scss";

import { Accordion } from "react-bootstrap";
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
    <Accordion>
      <Accordion.Item defaultChecked={true} eventKey={"0"}>
        <Accordion.Button className="d-flex justify-content-between">
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
                className="text-center tw-relative tw-w-1/6 tw-shrink-0 tw-grow-0 tw-basis-auto tw-px-3"
                style={{ maxWidth: "100%" }}
              >
                <span className="font-color-h">Rank:</span> #
                {props.rank.toLocaleString()}
              </div>
              <div
                className="text-center tw-relative tw-w-1/6 tw-shrink-0 tw-grow-0 tw-basis-auto tw-px-3"
                style={{ maxWidth: "100%" }}
              >
                <span className="font-color-h">Score:</span>{" "}
                {displayScore(props.score)}
              </div>
            </div>
          </div>
        </Accordion.Button>
        {props.traits && (
          <Accordion.Body className={styles["tokenPropertiesAccordionBody"]}>
            <div className="tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
              <div className="pt-2 pb-2 -tw-mx-3 tw-flex tw-flex-wrap">
                <div
                  className="tw-relative tw-w-5/12 tw-shrink-0 tw-grow-0 tw-basis-auto tw-px-3"
                  style={{ maxWidth: "100%" }}
                >
                  Trait
                </div>
                <div
                  className="text-center tw-relative tw-w-1/6 tw-shrink-0 tw-grow-0 tw-basis-auto tw-px-3"
                  style={{ maxWidth: "100%" }}
                >
                  Quantity
                </div>
                <div
                  className="text-center tw-relative tw-w-1/6 tw-shrink-0 tw-grow-0 tw-basis-auto tw-px-3"
                  style={{ maxWidth: "100%" }}
                >
                  Rank
                </div>
                <div
                  className="text-center tw-relative tw-w-1/6 tw-shrink-0 tw-grow-0 tw-basis-auto tw-px-3"
                  style={{ maxWidth: "100%" }}
                >
                  Score
                </div>
              </div>
              <hr className="mb-1 mt-0" />
              {props.traits
                .filter((t) => t.score !== -1)
                .map((t) => (
                  <div
                    className="pt-2 pb-2 -tw-mx-3 tw-flex tw-flex-wrap"
                    key={`trait-${t.trait.replaceAll(
                      " ",
                      "-"
                    )}-${t.value.replaceAll(" ", "-")}`}
                  >
                    <div
                      className="tw-relative tw-w-5/12 tw-shrink-0 tw-grow-0 tw-basis-auto tw-px-3"
                      style={{ maxWidth: "100%" }}
                    >
                      <span className="font-color-h">{t.trait}:</span>{" "}
                      <Link
                        href={`/nextgen/collection/${formatNameForUrl(
                          props.collection.name
                        )}/art?traits=${t.trait}:${t.value}`}
                      >
                        {t.value}
                      </Link>
                    </div>
                    <div
                      className="text-center tw-relative tw-w-1/6 tw-shrink-0 tw-grow-0 tw-basis-auto tw-px-3"
                      style={{ maxWidth: "100%" }}
                    >
                      {t.value_count.toLocaleString()} (
                      {((t.value_count / props.token_count) * 100).toFixed(1)}%)
                    </div>
                    <div
                      className="text-center tw-relative tw-w-1/6 tw-shrink-0 tw-grow-0 tw-basis-auto tw-px-3"
                      style={{ maxWidth: "100%" }}
                    >
                      {t.rank}/{t.trait_count}
                    </div>
                    <div
                      className="text-center tw-relative tw-w-1/6 tw-shrink-0 tw-grow-0 tw-basis-auto tw-px-3"
                      style={{ maxWidth: "100%" }}
                    >
                      {displayScore(t.score)}
                    </div>
                  </div>
                ))}
            </div>
          </Accordion.Body>
        )}
      </Accordion.Item>
    </Accordion>
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
    <div className="no-padding tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div className="pb-3 tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
          <h3 className="mb-0">Rarity</h3>
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
      <div className="pt-3 pb-3 -tw-mx-3 tw-flex tw-flex-wrap">
        <div className="font-larger font-bolder tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
          {props.token.name}
        </div>
      </div>
      <div className="pt-2 pb-2 -tw-mx-3 tw-flex tw-flex-wrap">
        <div className="d-flex justify-content-between align-items-center tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
          <span className="d-flex gap-3">
            <span className="d-flex align-items-center gap-1">
              <NextgenRarityToggle
                title={"Trait Normalization"}
                show={showNormalised}
                setShow={setShowNormalised}
              />
            </span>
            <span className="d-flex align-items-center gap-1">
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
      <div className="pt-2 pb-2 -tw-mx-3 tw-flex tw-flex-wrap">
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
      <div className="pt-2 pb-2 -tw-mx-3 tw-flex tw-flex-wrap">
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
      <div className="pt-2 pb-2 -tw-mx-3 tw-flex tw-flex-wrap">
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
    <div className="no-padding tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div className="pb-3 tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
          <h3 className="mb-0">Traits</h3>
        </div>
      </div>
      {props.traits.map((t) => (
        <div
          className="-tw-mx-3 tw-flex tw-flex-wrap"
          key={`trait-${t.trait.replaceAll(" ", "-")}`}
        >
          <div className="pb-3 d-flex gap-2 tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
            <span className="font-color-h">{t.trait}:</span>
            <span>
              <Link
                href={`/nextgen/collection/${formatNameForUrl(
                  props.collection.name
                )}/art?traits=${t.trait}:${t.value}`}
              >
                {t.value}
              </Link>
            </span>
            <span className="font-color-h">
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
        className={props.disabled ? "font-color-h" : "font-color"}
      >
        <b>{props.title}</b>
      </label>
    </>
  );
}
