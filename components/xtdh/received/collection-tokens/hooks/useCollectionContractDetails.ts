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
    const normalized = normalizedContract?.trim();
    const raw = contract?.trim();
    return normalized || raw || "";
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
    const trimmed = contract?.trim();
    if (normalizedAddress) {
      return shortenAddress(normalizedAddress);
    }
    if (trimmed) {
      return trimmed;
    }
    return "Selected collection";
  }, [contractOverview, normalizedAddress, contract]);

  return {
    contractParam,
    normalizedAddress,
    contractDisplayName,
  };
}
