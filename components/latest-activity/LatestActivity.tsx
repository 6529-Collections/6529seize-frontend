"use client";

import type { NFT } from "@/entities/INFT";
import type { NextGenCollection } from "@/entities/INextgen";
import type { Transaction } from "@/entities/ITransaction";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import { useActivityData } from "@/hooks/useActivityData";
import { useActivityFilters } from "@/hooks/useActivityFilters";
import { useNFTCollections } from "@/hooks/useNFTCollections";
import { usePathname } from "next/navigation";
import Pagination from "../pagination/Pagination";
import ActivityFilters from "./ActivityFilters";
import ActivityHeader from "./ActivityHeader";
import ActivityTable from "./ActivityTable";

interface Props {
  page: number;
  pageSize: number;
  showMore?: boolean | undefined;
  // Optional props for SSR
  initialActivity?: Transaction[] | undefined;
  initialTotalResults?: number | undefined;
  initialNfts?: NFT[] | undefined;
  initialNextgenCollections?: NextGenCollection[] | undefined;
}

export default function LatestActivity(props: Readonly<Props>) {
  const isMobile = useIsMobileScreen();
  const pathname = usePathname();

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

  const showViewAll = !pathname.includes("nft-activity");

  return (
    <section className="tw-p-0 tw-pt-4">
      <div className="tw-flex tw-flex-wrap tw-items-center">
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
      </div>
      <ActivityTable
        activity={activity}
        nfts={nfts}
        nextgenCollections={nextgenCollections}
      />
      {props.showMore && totalResults > 0 && (
        <div className="tw-pb-3 tw-pt-2 tw-text-center">
          <Pagination
            page={page}
            pageSize={props.pageSize}
            totalResults={totalResults}
            setPage={function (newPage: number) {
              setPage(newPage);
              window.scrollTo(0, 0);
            }}
          />
        </div>
      )}
    </section>
  );
}
