"use client";

import useIsMobileScreen from "@/hooks/isMobileScreen";
import { ContractFilter, getNftActivityFilter } from "@/hooks/useActivityData";
import { useActivityFilters } from "@/hooks/useActivityFilters";
import {
  GRADIENT_CONTRACT,
  MEMELAB_CONTRACT,
  MEMES_CONTRACT,
} from "@/constants/constants";
import {
  NEXTGEN_CHAIN_ID,
  NEXTGEN_CORE,
} from "@/components/nextGen/nextgen_contracts";
import { usePathname } from "next/navigation";
import ActivityFilters from "./ActivityFilters";
import ActivityHeader from "./ActivityHeader";
import NftMarketActivity from "@/components/nft-market-activity/NftMarketActivity";

interface Props {
  page: number;
  pageSize: number;
  showMore?: boolean | undefined;
}

export default function LatestActivity(props: Readonly<Props>) {
  const isMobile = useIsMobileScreen();
  const pathname = usePathname();

  const { typeFilter, selectedContract, setTypeFilter, setSelectedContract } =
    useActivityFilters();

  const contract = {
    [ContractFilter.ALL]: undefined,
    [ContractFilter.MEMES]: MEMES_CONTRACT,
    [ContractFilter.MEMELAB]: MEMELAB_CONTRACT,
    [ContractFilter.NEXTGEN]: NEXTGEN_CORE[NEXTGEN_CHAIN_ID],
    [ContractFilter.GRADIENTS]: GRADIENT_CONTRACT,
  }[selectedContract];
  const filter = getNftActivityFilter(typeFilter);

  const showViewAll = !pathname.includes("nft-activity");

  return (
    <section className={`tw-p-0 ${showViewAll ? "tw-pt-4" : ""}`}>
      <div className="tw-flex tw-flex-wrap tw-items-center">
        <ActivityHeader showViewAll={showViewAll} fetching={false} />
        <ActivityFilters
          typeFilter={typeFilter}
          selectedContract={selectedContract}
          onTypeFilterChange={(nextFilter) => setTypeFilter(nextFilter)}
          onContractFilterChange={(nextContract) =>
            setSelectedContract(nextContract)
          }
          isMobile={isMobile}
        />
      </div>
      <NftMarketActivity
        contract={contract}
        filter={filter}
        pageSize={props.pageSize}
        compact={props.showMore}
      />
    </section>
  );
}
