"use client";

import { Col, Container, Row } from "react-bootstrap";
import { NextGenTokenImage } from "./nextgenToken/NextGenTokenImage";
import {
  NextGenCollection,
  NextGenToken,
  TraitValuePair,
} from "@/entities/INextgen";
import { useEffect, useEffectEvent, useState } from "react";
import Pagination from "@/components/pagination/Pagination";
import { commonApiFetch } from "@/services/api/common-api";
import DotLoader from "@/components/dotLoader/DotLoader";
import {
  NextGenListFilters,
  NextGenTokenListedType,
  NextGenTokenRarityType,
} from "../nextgen_helpers";
import { SortDirection } from "@/entities/ISort";
import { getRandomObjectId } from "@/helpers/AllowlistToolHelpers";

interface Props {
  collection: NextGenCollection;
  limit?: number;
  sort?: NextGenListFilters;
  sort_direction?: SortDirection;
  selected_traits?: TraitValuePair[];
  show_normalised?: boolean;
  show_trait_count?: boolean;
  listed_type?: NextGenTokenListedType;
  setTotalResults?: (totalResults: number) => void;
  show_pagination?: boolean;
}

export default function NextGenTokenList({
  collection,
  limit,
  sort,
  sort_direction: sortDirection,
  selected_traits: selectedTraits,
  show_normalised: showNormalised,
  show_trait_count: showTraitCount,
  listed_type: listedType,
  setTotalResults: notifyTotalResults,
  show_pagination: showPagination,
}: Readonly<Props>) {
  const pageSize = limit ?? 48;

  const [tokens, setTokens] = useState<NextGenToken[]>([]);
  const [tokensLoaded, setTokensLoaded] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [rarityType, setRarityType] = useState<NextGenTokenRarityType>();
  const fetchResults = useEffectEvent((mypage: number) => {
    setTokensLoaded(false);
    let endpoint = `nextgen/collections/${collection.id}/tokens?page_size=${pageSize}&page=${mypage}`;
    if (selectedTraits) {
      const traitsQ = selectedTraits
        .map((t) => `${t.trait}:${t.value}`)
        .join(",");
      endpoint += `&traits=${encodeURIComponent(traitsQ)}`;
    }
    if (showNormalised) {
      endpoint += `&show_normalised=true`;
    }
    if (showTraitCount) {
      endpoint += `&show_trait_count=true`;
    }
    if (listedType === NextGenTokenListedType.LISTED) {
      endpoint += `&listed=true`;
    } else if (listedType === NextGenTokenListedType.NOT_LISTED) {
      endpoint += `&listed=false`;
    }
    if (sort) {
      endpoint += `&sort=${sort.replaceAll(" ", "_").toLowerCase()}`;
    } else {
      endpoint += `&sort=random`;
    }
    if (sortDirection) {
      endpoint += `&sort_direction=${sortDirection.toLowerCase()}`;
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
      if (notifyTotalResults) {
        notifyTotalResults(response.count);
      }
      setTokens(response.data);
      setTokensLoaded(true);
    });
  });

  useEffect(() => {
    if (page === 1) {
      fetchResults(page);
    } else {
      setPage(1);
    }
  }, [
    selectedTraits,
    sort,
    sortDirection,
    showNormalised,
    showTraitCount,
    listedType,
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
    let newRarityType = undefined;
    switch (sort) {
      case NextGenListFilters.RARITY_SCORE:
        newRarityType = getRarityType(
          NextGenTokenRarityType.RARITY_SCORE,
          showNormalised,
          showTraitCount
        );
        break;
      case NextGenListFilters.STATISTICAL_SCORE:
        newRarityType = getRarityType(
          NextGenTokenRarityType.STATISTICAL_SCORE,
          showNormalised,
          showTraitCount
        );
        break;
      case NextGenListFilters.SINGLE_TRAIT_RARITY:
        newRarityType = getRarityType(
          NextGenTokenRarityType.SINGLE_TRAIT_RARITY_SCORE,
          showNormalised,
          showTraitCount
        );
        break;
    }
    setRarityType(newRarityType);
  }, [sort, showNormalised, showTraitCount]);

  return (
    <Container className="no-padding">
      <Row>
        {(() => {
          if (tokensLoaded) {
            if (tokens.length > 0) {
              return tokens.map((t) => (
                <Col
                  xs={6}
                  sm={4}
                  md={4}
                  key={getRandomObjectId()}
                  className="pt-3 pb-3">
                  <NextGenTokenImage
                    token={t}
                    rarity_type={rarityType}
                    show_listing={
                      sort === NextGenListFilters.LISTED_PRICE ||
                      listedType === NextGenTokenListedType.LISTED
                    }
                    show_max_sale={sort === NextGenListFilters.HIGHEST_SALE}
                    show_last_sale={sort === NextGenListFilters.LAST_SALE}
                    show_owner_info={true}
                  />
                </Col>
              ));
            } else {
              return <Col className="pt-2 pb-2">No results found</Col>;
            }
          } else {
            return (
              <Col className="pt-2 pb-2">
                <DotLoader />
              </Col>
            );
          }
        })()}
      </Row>
      {totalResults > pageSize && tokensLoaded && showPagination && (
        <Row className="text-center pt-4 pb-4">
          <Pagination
            page={page}
            pageSize={pageSize}
            totalResults={totalResults}
            setPage={function (newPage: number) {
              setPage(newPage);
              window.scrollTo(0, 0);
            }}
          />
        </Row>
      )}
    </Container>
  );
}
