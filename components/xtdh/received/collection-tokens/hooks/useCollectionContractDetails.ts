import { useMemo } from "react";

import { shortenAddress } from "@/helpers/address.helpers";
import { isValidEthAddress } from "@/helpers/Helpers";
import { useContractOverviewQuery } from "@/hooks/useAlchemyNftQueries";
interface UseCollectionContractDetailsArgs {
  readonly contract: string | null;
  readonly normalizedContract: string | null;
}

interface UseCollectionContractDetailsResult {
  readonly contractParam: string;
  readonly normalizedAddress: `0x${string}` | null;
  readonly contractDisplayName: string;
}

export function useCollectionContractDetails({
  contract,
  normalizedContract,
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

  return {
    contractParam,
    normalizedAddress,
    contractDisplayName,
  };
}
