import { useMemo } from "react";

import { shortenAddress } from "@/helpers/address.helpers";
import { isValidEthAddress } from "@/helpers/Helpers";
import { useContractOverviewQuery } from "@/hooks/useAlchemyNftQueries";
import {
  formatCount,
  formatXtdhRate,
  formatXtdhValue,
} from "../../utils/formatters";
import {
  formatFloorPrice,
  formatTotalSupply,
} from "@/components/user/xtdh/granted-list/UserPageXtdhGrantListItem/formatters";

import type {
  ApiXtdhCollection,
  CollectionMetricDatum,
} from "../types";

interface UseCollectionContractDetailsArgs {
  readonly contract: string | null;
  readonly normalizedContract: string | null;
  readonly collection?: ApiXtdhCollection;
}

interface UseCollectionContractDetailsResult {
  readonly contractParam: string;
  readonly normalizedAddress: `0x${string}` | null;
  readonly contractDisplayName: string;
  readonly subtitleLabel: string;
  readonly headerMetrics: CollectionMetricDatum[];
  readonly contractImageUrl?: string;
}

export function useCollectionContractDetails({
  contract,
  normalizedContract,
  collection,
}: Readonly<UseCollectionContractDetailsArgs>): UseCollectionContractDetailsResult {
  const contractParam = useMemo(() => {
    return normalizedContract?.trim() ?? contract?.trim() ?? "";
  }, [normalizedContract, contract]);

  const normalizedAddress = useMemo(() => {
    if (!contractParam) {
      return null;
    }
    return isValidEthAddress(contractParam)
      ? (contractParam.toLowerCase() as `0x${string}`)
      : null;
  }, [contractParam]);

  const { data: contractOverview } = useContractOverviewQuery({
    address: normalizedAddress ?? undefined,
    enabled: Boolean(normalizedAddress),
  });

  const contractDisplayName = useMemo(() => {
    if (contractOverview?.name) {
      return contractOverview.name;
    }
    if (normalizedAddress) {
      return shortenAddress(normalizedAddress);
    }
    if (contract?.trim()) {
      return contract;
    }
    return "Selected collection";
  }, [contractOverview?.name, normalizedAddress, contract]);

  const subtitleLabel = useMemo(() => {
    if (normalizedAddress) {
      return normalizedAddress;
    }
    return contract ?? normalizedContract ?? "";
  }, [normalizedAddress, contract, normalizedContract]);

  const headerMetrics = useMemo<CollectionMetricDatum[]>(() => {
    return [
      { label: "Token type", value: contractOverview?.tokenType ?? "Unknown" },
      {
        label: "Total supply",
        value: formatTotalSupply(contractOverview?.totalSupply),
      },
      {
        label: "Floor price",
        value: formatFloorPrice(contractOverview?.floorPriceEth),
      },
      {
        label: "Tokens granted",
        value: collection ? formatCount(collection.token_count) : "—",
      },
      {
        label: "Grants count",
        value: collection ? formatCount(collection.grant_count) : "—",
      },
      {
        label: "xTDH",
        value: collection ? formatXtdhValue(collection.xtdh) : "—",
      },
      {
        label: "xTDH rate",
        value: collection ? formatXtdhRate(collection.xtdh_rate) : "—",
      },
    ];
  }, [collection, contractOverview]);

  return {
    contractParam,
    normalizedAddress,
    contractDisplayName,
    subtitleLabel,
    headerMetrics,
    contractImageUrl: contractOverview?.imageUrl,
  };
}
