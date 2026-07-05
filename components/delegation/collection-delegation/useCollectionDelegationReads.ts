"use client";

import { useEffect, useState } from "react";
import { useReadContracts } from "wagmi";

import {
  getDelegationsFromData,
  type ContractDelegation,
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
      const myDelegations = getDelegationsFromData(
        retrieveOutgoingDelegations.data
      );
      setOutgoingDelegations(myDelegations);
      setOutgoingDelegationsLoaded(true);
    }
  }, [retrieveOutgoingDelegations.data]);

  const retrieveOutgoingConsolidations = useReadContracts({
    contracts: getConsolidationReadParams(
      address as `0x${string}`,
      collection.contract,
      outgoingDelegations[CONSOLIDATION_USE_CASE.index]!
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

    const activeConsolidations = consolidationDelegations.wallets.map(
      (walletDelegation, index) => ({
        wallet: walletDelegation.wallet,
        status: retrieveOutgoingConsolidations.data?.[index]?.result
          ? "consolidation active"
          : "consolidation incomplete",
      })
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
      const myDelegations = getDelegationsFromData(
        retrieveIncomingDelegations.data
      );
      setIncomingDelegations(myDelegations);
      setIncomingDelegationsLoaded(true);
    }
  }, [retrieveIncomingDelegations.data]);

  const retrieveIncomingConsolidations = useReadContracts({
    contracts: getConsolidationReadParams(
      address as `0x${string}`,
      collection.contract,
      incomingDelegations[CONSOLIDATION_USE_CASE.index]!
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

    const activeConsolidations = consolidationDelegations.wallets.map(
      (walletDelegation, index) => ({
        wallet: walletDelegation.wallet,
        status: retrieveIncomingConsolidations.data?.[index]?.result
          ? "consolidation active"
          : "consolidation incomplete",
      })
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
    outgoingActiveConsolidations,
    incomingDelegations,
    incomingDelegationsLoaded,
    incomingActiveConsolidations,
    resetDelegationReads,
  };
}

export type CollectionDelegationReads = ReturnType<
  typeof useCollectionDelegationReads
>;
