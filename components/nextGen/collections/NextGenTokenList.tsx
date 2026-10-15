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
import NextGenLoadError from "@/components/nextGen/NextGenLoadError";
import {
  NextGenListFilters,
  NextGenTokenListedType,
  NextGenTokenRarityType,
} from "../nextgen_helpers";
import type { SortDirection } from "@/entities/ISort";

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
  setLoadFailed?: ((failed: boolean) => void) | undefined;
  show_pagination?: boolean | undefined;
}

interface TokensResponse {
  count: number;
  page: number;
  next: unknown;
  data: NextGenToken[];
}

function getTokensEndpoint(
  props: Readonly<Props>,
  pageSize: number,
  page: number
): string {
  let endpoint = `nextgen/collections/${props.collection.id}/tokens?page_size=${pageSize}&page=${page}`;
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
  return endpoint;
}

export default function NextGenTokenList(props: Readonly<Props>) {
  const pageSize = props.limit ?? 48;

  const [tokens, setTokens] = useState<NextGenToken[]>([]);
  const [tokensLoaded, setTokensLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [rarityType, setRarityType] = useState<NextGenTokenRarityType>();

  const endpoint = getTokensEndpoint(props, pageSize, page);

  useEffect(() => {
    setPage(1);
  }, [
    props.selected_traits,
    props.sort,
    props.sort_direction,
    props.show_normalised,
    props.show_trait_count,
    props.listed_type,
  ]);

  // One request per effective query. A newer query (or unmount) aborts the
  // previous one, and a late response from an aborted request is ignored.
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setTokensLoaded(false);
      setLoadFailed(false);
      props.setLoadFailed?.(false);
      let response: TokensResponse;
      try {
        response = await commonApiFetch<TokensResponse>({
          endpoint,
          signal: controller.signal,
        });
      } catch {
        if (!controller.signal.aborted) {
          setLoadFailed(true);
          props.setLoadFailed?.(true);
        }
        return;
      }
      if (controller.signal.aborted) {
        return;
      }
      setTotalResults(response.count);
      props.setTotalResults?.(response.count);
      setTokens(response.data);
      setTokensLoaded(true);
    };
    void load();
    return () => controller.abort();
  }, [endpoint, attempt]);

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
    <div className="tw-w-full">
      <div className="tw-grid tw-grid-cols-2 tw-gap-x-4 tw-gap-y-6 sm:tw-grid-cols-3 sm:tw-gap-x-6">
        {(() => {
          if (loadFailed) {
            return (
              <NextGenLoadError
                className="tw-col-span-full"
                message="nextgen.loadError.tokens"
                onRetry={() => setAttempt((current) => current + 1)}
              />
            );
          }
          if (tokensLoaded) {
            if (tokens.length > 0) {
              return tokens.map((t) => (
                <div key={t.id} className="tw-min-w-0">
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
                <p className="tw-col-span-full tw-m-0 tw-py-4 tw-text-sm tw-text-iron-300">
                  No results found
                </p>
              );
            }
          } else {
            return (
              <output
                aria-label="Loading tokens"
                className="tw-col-span-full tw-flex tw-min-h-24 tw-items-start tw-py-4"
              >
                <DotLoader />
              </output>
            );
          }
        })()}
      </div>
      {totalResults > pageSize && tokensLoaded && props.show_pagination && (
        <div className="tw-flex tw-justify-center tw-pb-6 tw-pt-8 tw-text-center">
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
