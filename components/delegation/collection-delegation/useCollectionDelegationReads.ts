"use client";

import { useEffect, useState } from "react";
import { useReadContracts } from "wagmi";

import {
  getDelegationsFromSuccessfulData,
  type ContractDelegation,
  type ContractReadResult,
} from "../CollectionDelegation.utils";
import type { DelegationCollection } from "../delegation-constants";
import { CONSOLIDATION_USE_CASE } from "../delegation-constants";
import {
  getActiveDelegationsReadParams,
  getConsolidationReadParams,
} from "./collection-delegation-helpers";

export interface ActiveConsolidation {
  wallet: string;
  status: string;
}

function getConsolidationStatuses(
  wallets: readonly { readonly wallet: string }[],
  data: readonly ContractReadResult[]
) {
  return wallets.map((walletDelegation, index) => {
    const read = data[index];
    let status = "consolidation status unavailable";

    if (read !== undefined && read.status !== "failure") {
      status = Boolean(read.result)
        ? "consolidation active"
        : "consolidation incomplete";
    }

    return {
      wallet: walletDelegation.wallet,
      status,
    };
  });
}

/**
 * Contract reads for the collection-delegation screen: outgoing/incoming
 * delegations for every use case plus the consolidation status of each
 * consolidation counterparty wallet.
 */
export function useCollectionDelegationReads(options: {
  readonly address: string | undefined;
  readonly isConnected: boolean;
  readonly collection: DelegationCollection;
}) {
  const { address, isConnected, collection } = options;

  const [outgoingDelegations, setOutgoingDelegations] = useState<
    ContractDelegation[]
  >([]);
  const [outgoingActiveConsolidations, setOutgoingActiveConsolidations] =
    useState<ActiveConsolidation[]>([]);
  const [outgoingDelegationsLoaded, setOutgoingDelegationsLoaded] =
    useState(false);

  const [incomingDelegations, setIncomingDelegations] = useState<
    ContractDelegation[]
  >([]);
  const [incomingActiveConsolidations, setIncomingActiveConsolidations] =
    useState<ActiveConsolidation[]>([]);
  const [incomingDelegationsLoaded, setIncomingDelegationsLoaded] =
    useState(false);

  const retrieveOutgoingDelegations = useReadContracts({
    contracts: getActiveDelegationsReadParams(
      address as `0x${string}`,
      collection.contract,
      "retrieveDelegationAddressesTokensIDsandExpiredDates"
    ),
    query: {
      enabled: isConnected,
      refetchInterval: 10000,
    },
  });

  useEffect(() => {
    if (retrieveOutgoingDelegations.data) {
      const myDelegations = getDelegationsFromSuccessfulData(
        retrieveOutgoingDelegations.data
      );
      if (!myDelegations) {
        setOutgoingDelegations([]);
        setOutgoingDelegationsLoaded(false);
        return;
      }

      setOutgoingDelegations(myDelegations);
      setOutgoingDelegationsLoaded(true);
    }
  }, [retrieveOutgoingDelegations.data]);

  const retrieveOutgoingConsolidations = useReadContracts({
    contracts: getConsolidationReadParams(
      address as `0x${string}`,
      collection.contract,
      outgoingDelegations[CONSOLIDATION_USE_CASE.index]
    ),
    query: {
      enabled: isConnected && outgoingDelegations.length > 0,
      refetchInterval: 10000,
    },
  });

  useEffect(() => {
    if (!retrieveOutgoingConsolidations.data) {
      return;
    }

    const consolidationDelegations =
      outgoingDelegations[CONSOLIDATION_USE_CASE.index];

    if (!consolidationDelegations?.wallets.length) {
      setOutgoingActiveConsolidations([]);
      return;
    }

    const activeConsolidations = getConsolidationStatuses(
      consolidationDelegations.wallets,
      retrieveOutgoingConsolidations.data
    );

    setOutgoingActiveConsolidations(activeConsolidations);
  }, [outgoingDelegations, retrieveOutgoingConsolidations.data]);

  const retrieveIncomingDelegations = useReadContracts({
    contracts: getActiveDelegationsReadParams(
      address as `0x${string}`,
      collection.contract,
      "retrieveDelegatorsTokensIDsandExpiredDates"
    ),
    query: {
      enabled: isConnected,
      refetchInterval: 10000,
    },
  });

  useEffect(() => {
    if (retrieveIncomingDelegations.data) {
      const myDelegations = getDelegationsFromSuccessfulData(
        retrieveIncomingDelegations.data
      );
      if (!myDelegations) {
        setIncomingDelegations([]);
        setIncomingDelegationsLoaded(false);
        return;
      }

      setIncomingDelegations(myDelegations);
      setIncomingDelegationsLoaded(true);
    }
  }, [retrieveIncomingDelegations.data]);

  const retrieveIncomingConsolidations = useReadContracts({
    contracts: getConsolidationReadParams(
      address as `0x${string}`,
      collection.contract,
      incomingDelegations[CONSOLIDATION_USE_CASE.index]
    ),
    query: {
      enabled: isConnected && incomingDelegations.length > 0,
      refetchInterval: 10000,
    },
  });

  useEffect(() => {
    if (!retrieveIncomingConsolidations.data) {
      return;
    }

    const consolidationDelegations =
      incomingDelegations[CONSOLIDATION_USE_CASE.index];

    if (!consolidationDelegations?.wallets.length) {
      setIncomingActiveConsolidations([]);
      return;
    }

    const activeConsolidations = getConsolidationStatuses(
      consolidationDelegations.wallets,
      retrieveIncomingConsolidations.data
    );

    setIncomingActiveConsolidations(activeConsolidations);
  }, [incomingDelegations, retrieveIncomingConsolidations.data]);

  function resetDelegationReads() {
    setOutgoingDelegations([]);
    setOutgoingDelegationsLoaded(false);
    retrieveOutgoingDelegations.refetch();

    setIncomingDelegations([]);
    setIncomingDelegationsLoaded(false);
    retrieveIncomingDelegations.refetch();
  }

  return {
    outgoingDelegations,
    outgoingDelegationsLoaded,
    outgoingDelegationsError:
      retrieveOutgoingDelegations.data?.some(
        (entry) => entry.status === "failure"
      ) === true ||
      (!outgoingDelegationsLoaded &&
        Boolean(retrieveOutgoingDelegations.isError)),
    retryOutgoingDelegations: retrieveOutgoingDelegations.refetch,
    outgoingActiveConsolidations,
    incomingDelegations,
    incomingDelegationsLoaded,
    incomingDelegationsError:
      retrieveIncomingDelegations.data?.some(
        (entry) => entry.status === "failure"
      ) === true ||
      (!incomingDelegationsLoaded &&
        Boolean(retrieveIncomingDelegations.isError)),
    retryIncomingDelegations: retrieveIncomingDelegations.refetch,
    incomingActiveConsolidations,
    resetDelegationReads,
  };
}

export type CollectionDelegationReads = ReturnType<
  typeof useCollectionDelegationReads
>;
