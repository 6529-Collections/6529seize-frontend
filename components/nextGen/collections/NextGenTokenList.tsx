"use client";

import { Col, Container, Row } from "react-bootstrap";
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
                  className="pt-3 pb-3"
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
      {totalResults > pageSize && tokensLoaded && props.show_pagination && (
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
