"use client";

import { NFT } from "@/entities/INFT";
import { NextGenCollection } from "@/entities/INextgen";
import { Transaction } from "@/entities/ITransaction";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import { useActivityData } from "@/hooks/useActivityData";
import { useActivityFilters } from "@/hooks/useActivityFilters";
import { useNFTCollections } from "@/hooks/useNFTCollections";
import { useEffect, useState } from "react";
import { Container, Row } from "react-bootstrap";
import Pagination from "../pagination/Pagination";
import ActivityFilters from "./ActivityFilters";
import ActivityHeader from "./ActivityHeader";
import ActivityTable from "./ActivityTable";

interface Props {
  page: number;
  pageSize: number;
  showMore?: boolean;
  // Optional props for SSR
  initialActivity?: Transaction[];
  initialTotalResults?: number;
  initialNfts?: NFT[];
  initialNextgenCollections?: NextGenCollection[];
}

export default function LatestActivity(props: Readonly<Props>) {
  const isMobile = useIsMobileScreen();

  const { typeFilter, selectedContract, setTypeFilter, setSelectedContract } =
    useActivityFilters();

  const { activity, totalResults, fetching, page, setPage } = useActivityData(
    props.page,
    props.pageSize,
    typeFilter,
    selectedContract,
    props.initialActivity && props.initialTotalResults !== undefined
      ? {
          activity: props.initialActivity,
          totalResults: props.initialTotalResults,
        }
      : undefined
  );

  const { nfts, nextgenCollections } = useNFTCollections(
    props.initialNfts && props.initialNextgenCollections
      ? {
          nfts: props.initialNfts,
          nextgenCollections: props.initialNextgenCollections,
        }
      : undefined
  );

  const [showViewAll, setShowViewAll] = useState(false);

  useEffect(() => {
    setShowViewAll(!window.location.pathname.includes("nft-activity"));
  }, []);

  return (
    <Container className={`no-padding pt-4`}>
      <Row className="d-flex align-items-center">
        <ActivityHeader showViewAll={showViewAll} fetching={fetching} />
        <ActivityFilters
          typeFilter={typeFilter}
          selectedContract={selectedContract}
          onTypeFilterChange={(filter) =>
            setTypeFilter(filter, () => setPage(1))
          }
          onContractFilterChange={(contract) =>
            setSelectedContract(contract, () => setPage(1))
          }
          isMobile={isMobile}
        />
      </Row>
      <ActivityTable
        activity={activity}
        nfts={nfts}
        nextgenCollections={nextgenCollections}
      />
      {props.showMore && totalResults > 0 && (
        <Row className="text-center pt-2 pb-3">
          <Pagination
            page={page}
            pageSize={props.pageSize}
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
