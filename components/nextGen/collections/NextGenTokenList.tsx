"use client";

import { NextGenTokenImage } from "./nextgenToken/NextGenTokenImage";
import type {
  NextGenCollection,
  NextGenToken,
  TraitValuePair,
} from "@/entities/INextgen";
import { useEffect, useState } from "react";
import Pagination from "@/components/pagination/Pagination";
import { commonApiFetch } from "@/services/api/common-api";
import DotLoader from "@/components/dotLoader/DotLoader";
import {
  NextGenListFilters,
  NextGenTokenListedType,
  NextGenTokenRarityType,
} from "../nextgen_helpers";
import type { SortDirection } from "@/entities/ISort";
import { getRandomObjectId } from "@/helpers/AllowlistToolHelpers";

interface Props {
  collection: NextGenCollection;
  limit?: number | undefined;
  sort?: NextGenListFilters | undefined;
  sort_direction?: SortDirection | undefined;
  selected_traits?: TraitValuePair[] | undefined;
  show_normalised?: boolean | undefined;
  show_trait_count?: boolean | undefined;
  listed_type?: NextGenTokenListedType | undefined;
  setTotalResults?: ((totalResults: number) => void) | undefined;
  show_pagination?: boolean | undefined;
}

export default function NextGenTokenList(props: Readonly<Props>) {
  const pageSize = props.limit ?? 48;

  const [tokens, setTokens] = useState<NextGenToken[]>([]);
  const [tokensLoaded, setTokensLoaded] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [rarityType, setRarityType] = useState<NextGenTokenRarityType>();

  function fetchResults(mypage: number) {
    setTokensLoaded(false);
    let endpoint = `nextgen/collections/${props.collection.id}/tokens?page_size=${pageSize}&page=${mypage}`;
    if (props.selected_traits) {
      const traitsQ = props.selected_traits
        .map((t) => `${t.trait}:${t.value}`)
        .join(",");
      endpoint += `&traits=${encodeURIComponent(traitsQ)}`;
    }
    if (props.show_normalised) {
      endpoint += `&show_normalised=true`;
    }
    if (props.show_trait_count) {
      endpoint += `&show_trait_count=true`;
    }
    if (props.listed_type === NextGenTokenListedType.LISTED) {
      endpoint += `&listed=true`;
    } else if (props.listed_type === NextGenTokenListedType.NOT_LISTED) {
      endpoint += `&listed=false`;
    }
    if (props.sort) {
      endpoint += `&sort=${props.sort.replaceAll(" ", "_").toLowerCase()}`;
    } else {
      endpoint += `&sort=random`;
    }
    if (props.sort_direction) {
      endpoint += `&sort_direction=${props.sort_direction.toLowerCase()}`;
    }
    commonApiFetch<{
      count: number;
      page: number;
      next: any;
      data: NextGenToken[];
    }>({
      endpoint: endpoint,
    }).then((response) => {
      setTotalResults(response.count);
      if (props.setTotalResults) {
        props.setTotalResults(response.count);
      }
      setTokens(response.data);
      setTokensLoaded(true);
    });
  }

  useEffect(() => {
    if (page === 1) {
      fetchResults(page);
    } else {
      setPage(1);
    }
  }, [
    props.selected_traits,
    props.sort,
    props.sort_direction,
    props.show_normalised,
    props.show_trait_count,
    props.listed_type,
  ]);

  useEffect(() => {
    fetchResults(page);
  }, [page]);

  function getRarityType(
    baseType:
      | NextGenTokenRarityType.RARITY_SCORE
      | NextGenTokenRarityType.STATISTICAL_SCORE
      | NextGenTokenRarityType.SINGLE_TRAIT_RARITY_SCORE,
    show_normalised?: boolean,
    show_trait_count?: boolean
  ): NextGenTokenRarityType {
    return NextGenTokenRarityType[
      `${baseType}${show_trait_count ? "_TRAIT_COUNT" : ""}${
        show_normalised ? "_NORMALISED" : ""
      }`
    ] as NextGenTokenRarityType;
  }

  useEffect(() => {
    const { sort, show_normalised, show_trait_count } = props;
    let newRarityType = undefined;
    switch (sort) {
      case NextGenListFilters.RARITY_SCORE:
        newRarityType = getRarityType(
          NextGenTokenRarityType.RARITY_SCORE,
          show_normalised,
          show_trait_count
        );
        break;
      case NextGenListFilters.STATISTICAL_SCORE:
        newRarityType = getRarityType(
          NextGenTokenRarityType.STATISTICAL_SCORE,
          show_normalised,
          show_trait_count
        );
        break;
      case NextGenListFilters.SINGLE_TRAIT_RARITY:
        newRarityType = getRarityType(
          NextGenTokenRarityType.SINGLE_TRAIT_RARITY_SCORE,
          show_normalised,
          show_trait_count
        );
        break;
    }
    setRarityType(newRarityType);
  }, [props.sort, props.show_normalised, props.show_trait_count]);

  return (
    <div className="tw-mx-auto tw-w-full !tw-p-0 tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        {(() => {
          if (tokensLoaded) {
            if (tokens.length > 0) {
              return tokens.map((t) => (
                <div
                  key={getRandomObjectId()}
                  className="tw-relative tw-w-1/2 tw-shrink-0 tw-grow-0 tw-basis-auto tw-px-3 tw-pb-4 tw-pt-4 min-[576px]:tw-w-1/3 min-[576px]:tw-shrink-0 min-[576px]:tw-grow-0 min-[576px]:tw-basis-auto md:tw-w-1/3 md:tw-shrink-0 md:tw-grow-0 md:tw-basis-auto"
                  style={{ maxWidth: "100%" }}
                >
                  <NextGenTokenImage
                    token={t}
                    rarity_type={rarityType}
                    show_listing={
                      props.sort === NextGenListFilters.LISTED_PRICE ||
                      props.listed_type === NextGenTokenListedType.LISTED
                    }
                    show_max_sale={
                      props.sort === NextGenListFilters.HIGHEST_SALE
                    }
                    show_last_sale={props.sort === NextGenListFilters.LAST_SALE}
                    show_owner_info={true}
                  />
                </div>
              ));
            } else {
              return (
                <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3 tw-pb-2 tw-pt-2">
                  No results found
                </div>
              );
            }
          } else {
            return (
              <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3 tw-pb-2 tw-pt-2">
                <DotLoader />
              </div>
            );
          }
        })()}
      </div>
      {totalResults > pageSize && tokensLoaded && props.show_pagination && (
        <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pb-6 tw-pt-6 tw-text-center">
          <Pagination
            page={page}
            pageSize={pageSize}
            totalResults={totalResults}
            setPage={function (newPage: number) {
              setPage(newPage);
              window.scrollTo(0, 0);
            }}
          />
        </div>
      )}
    </div>
  );
}
