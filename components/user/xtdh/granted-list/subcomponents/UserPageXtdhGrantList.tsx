import { useMemo } from "react";

import type { ApiXTdhGrantsPage } from "@/generated/models/ApiXTdhGrantsPage";
import {
  getContractOverviewLookupKey,
  type ContractOverviewBatchRequest,
  useContractOverviewsQuery,
} from "@/hooks/useAlchemyNftQueries";
import { UserPageXtdhGrantListItem } from "./UserPageXtdhGrantListItem";
import {
  getContractAddress,
  mapGrantChainToSupportedChain,
} from "./UserPageXtdhGrantListItem/formatters";
import type { GrantContractOverviewState } from "./UserPageXtdhGrantListItem/types";

interface UserPageXtdhGrantListProps {
  readonly grants: ApiXTdhGrantsPage["data"];
  readonly isSelf: boolean;
}

type Grant = ApiXTdhGrantsPage["data"][number];

function getGrantContractRequest(
  grant: Grant
): ContractOverviewBatchRequest | null {
  const address = getContractAddress(grant.target_contract);
  if (!address) {
    return null;
  }

  try {
    return {
      address,
      chain: mapGrantChainToSupportedChain(grant.target_chain),
    };
  } catch {
    return null;
  }
}

export function UserPageXtdhGrantList({
  grants,
  isSelf,
}: Readonly<UserPageXtdhGrantListProps>) {
  const contractRequests = useMemo(() => {
    const seen = new Set<string>();
    const requests: ContractOverviewBatchRequest[] = [];

    for (const grant of grants) {
      const request = getGrantContractRequest(grant);
      if (!request) {
        continue;
      }

      const key = getContractOverviewLookupKey(
        request.address,
        request.chain ?? "ethereum"
      );
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      requests.push(request);
    }

    return requests;
  }, [grants]);
  const contractBatchQuery = useContractOverviewsQuery({
    contracts: contractRequests,
    enabled: grants.length > 0,
  });

  const contractOverviewStates = useMemo(() => {
    const states = new Map<string, GrantContractOverviewState>();

    for (const request of contractRequests) {
      const chain = request.chain ?? "ethereum";
      const key = getContractOverviewLookupKey(request.address, chain);
      const hasContractResult = contractBatchQuery.contractsByKey.has(key);
      const contract = hasContractResult
        ? (contractBatchQuery.contractsByKey.get(key) ?? null)
        : null;
      const errorMessage =
        contractBatchQuery.errorsByKey.get(key) ??
        (contractBatchQuery.isError
          ? "Unable to load contract metadata."
          : null);

      states.set(key, {
        contract,
        isLoading: contractBatchQuery.isLoading,
        errorMessage,
      });
    }

    return states;
  }, [
    contractBatchQuery.contractsByKey,
    contractBatchQuery.errorsByKey,
    contractBatchQuery.isError,
    contractBatchQuery.isLoading,
    contractRequests,
  ]);

  return (
    <ul className="tw-m-0 tw-flex tw-flex-col tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-iron-800 tw-p-0">
      {grants.map((grant) => {
        const request = getGrantContractRequest(grant);
        const state =
          request !== null
            ? contractOverviewStates.get(
                getContractOverviewLookupKey(
                  request.address,
                  request.chain ?? "ethereum"
                )
              )
            : undefined;

        return (
          <UserPageXtdhGrantListItem
            key={grant.id}
            grant={grant}
            isSelf={isSelf}
            contractOverviewState={state}
          />
        );
      })}
    </ul>
  );
}
