"use client";

import EnsAddressInput from "@/components/utils/input/ens-address/EnsAddressInput";
import PrimaryButton from "@/components/utils/button/PrimaryButton";
import SecondaryButton from "@/components/utils/button/SecondaryButton";
import { publicEnv } from "@/config/env";
import { DELEGATION_ALL_ADDRESS, MEMES_CONTRACT } from "@/constants/constants";
import type { DBResponse } from "@/entities/IDBResponse";
import type { Delegation, WalletConsolidation } from "@/entities/IDelegation";
import { areEqualAddresses, isValidEthAddress } from "@/helpers/Helpers";
import { fetchUrl } from "@/services/6529api";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useEnsName } from "wagmi";
import {
  MINTING_USE_CASE,
  SUB_DELEGATION_USE_CASE,
} from "../delegation-constants";
import WalletCheckerResults, {
  type ConsolidatedWallet,
  type ConsolidationDisplay,
} from "./WalletCheckerResults";

function resolveConsolidationDisplay(
  wallet: string,
  candidates: ConsolidationDisplay[]
): string | undefined {
  let fallback: string | undefined;

  for (const candidate of candidates) {
    if (areEqualAddresses(candidate.from, wallet)) {
      return candidate.from_display;
    }

    if (!fallback && areEqualAddresses(candidate.to, wallet)) {
      fallback = candidate.to_display;
    }
  }

  return fallback;
}

export default function WalletCheckerComponent(
  props: Readonly<{
    address_query: string;
    setAddressQuery(address: string): void;
  }>
) {
  const { address_query, setAddressQuery } = props;
  const initialAddressQuery = address_query;
  const initialAddressIsValid = isValidEthAddress(initialAddressQuery);

  const [submittedAddress, setSubmittedAddress] = useState(
    initialAddressIsValid ? initialAddressQuery : ""
  );
  const [fetchedAddress, setFetchedAddress] = useState(
    initialAddressIsValid ? initialAddressQuery : ""
  );
  const [walletInputValue, setWalletInputValue] = useState(initialAddressQuery);
  const [walletAddress, setWalletAddress] = useState(initialAddressQuery);
  const [ensLoading, setEnsLoading] = useState(false);

  const [checking, setChecking] = useState(initialAddressIsValid);
  const [refreshing, setRefreshing] = useState(false);
  const [addressError, setAddressError] = useState(false);

  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [subDelegations, setSubDelegations] = useState<Delegation[]>([]);
  const [delegationsLoaded, setDelegationsLoaded] = useState(false);

  const [consolidations, setConsolidations] = useState<ConsolidationDisplay[]>(
    []
  );
  const [consolidatedWallets, setConsolidatedWallets] = useState<
    ConsolidatedWallet[]
  >([]);
  const [consolidationsLoaded, setConsolidationsLoaded] = useState(false);

  const shouldFetchDelegations =
    checking && isValidEthAddress(submittedAddress);

  const {
    data: delegationsResponse,
    status: delegationsStatus,
    refetch: refetchDelegations,
  } = useQuery<DBResponse>({
    queryKey: ["delegations", submittedAddress],
    queryFn: async () => {
      try {
        const url = `${publicEnv.API_ENDPOINT}/api/delegations/${submittedAddress}`;
        return await fetchUrl(url);
      } catch (error) {
        console.error(
          `Failed to fetch delegations for ${submittedAddress}`,
          error
        );
        throw error;
      }
    },
    enabled: shouldFetchDelegations,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (delegationsStatus === "success" && delegationsResponse) {
      const allDelegations = Array.isArray(delegationsResponse.data)
        ? (delegationsResponse.data as Delegation[])
        : [];
      setDelegations(
        allDelegations.filter(
          (delegation) =>
            delegation.use_case !== SUB_DELEGATION_USE_CASE.use_case
        )
      );
      setSubDelegations(
        allDelegations.filter(
          (delegation) =>
            delegation.use_case === SUB_DELEGATION_USE_CASE.use_case
        )
      );
      setDelegationsLoaded(true);
      return;
    }

    if (delegationsStatus === "error") {
      setDelegations([]);
      setSubDelegations([]);
      setDelegationsLoaded(true);
    }
  }, [delegationsStatus, delegationsResponse]);

  const setAllConsolidations = useCallback(
    (nextConsolidations: WalletConsolidation[]) => {
      const normalized: ConsolidationDisplay[] = [];

      for (const consolidation of nextConsolidations) {
        const primary: ConsolidationDisplay = {
          from: consolidation.wallet1,
          from_display: consolidation.wallet1_display,
          to: consolidation.wallet2,
          to_display: consolidation.wallet2_display,
        };

        if (
          !normalized.some(
            (existing) =>
              areEqualAddresses(existing.from, primary.from) &&
              areEqualAddresses(existing.to, primary.to)
          )
        ) {
          normalized.push(primary);
        }

        if (consolidation.confirmed) {
          const reciprocal: ConsolidationDisplay = {
            from: consolidation.wallet2,
            from_display: consolidation.wallet2_display,
            to: consolidation.wallet1,
            to_display: consolidation.wallet1_display,
          };

          if (
            !normalized.some(
              (existing) =>
                areEqualAddresses(existing.from, reciprocal.from) &&
                areEqualAddresses(existing.to, reciprocal.to)
            )
          ) {
            normalized.push(reciprocal);
          }
        }
      }

      setConsolidations(normalized);
      setConsolidationsLoaded(true);
    },
    []
  );

  const {
    data: consolidationsResponse,
    status: consolidationsStatus,
    refetch: refetchConsolidations,
  } = useQuery<WalletConsolidation[]>({
    queryKey: ["consolidations", submittedAddress],
    queryFn: async () => {
      try {
        const baseUrl = `${publicEnv.API_ENDPOINT}/api/consolidations/${submittedAddress}?show_incomplete=true`;
        const firstResponse: DBResponse<WalletConsolidation> =
          await fetchUrl(baseUrl);
        const firstData = firstResponse.data;

        if (firstData.length > 0) {
          const firstConsolidation = firstData[0];
          if (!firstConsolidation) {
            return firstData;
          }
          const newWallet = areEqualAddresses(
            submittedAddress,
            firstConsolidation.wallet1
          )
            ? firstConsolidation.wallet2
            : firstConsolidation.wallet1;
          const nextUrl = `${publicEnv.API_ENDPOINT}/api/consolidations/${newWallet}?show_incomplete=true`;
          try {
            const secondResponse: DBResponse<WalletConsolidation> =
              await fetchUrl(nextUrl);
            return [...firstData, ...secondResponse.data];
          } catch {
            console.error(
              `Failed to fetch consolidations for related wallet: ${newWallet}`
            );
            return firstData;
          }
        }

        return firstData;
      } catch (error) {
        console.error(
          `Failed to fetch consolidations for ${submittedAddress}`,
          error
        );
        throw error;
      }
    },
    enabled: shouldFetchDelegations,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (consolidationsStatus === "success" && consolidationsResponse) {
      setAllConsolidations(consolidationsResponse);
      return;
    }

    if (consolidationsStatus === "error") {
      setConsolidations([]);
      setConsolidationsLoaded(true);
    }
  }, [consolidationsStatus, consolidationsResponse, setAllConsolidations]);

  const {
    refetch: refetchConsolidatedWalletsRaw,
    data: consolidatedWalletsResponse,
    status: consolidatedWalletsStatus,
  } = useQuery<ConsolidatedWallet[]>({
    queryKey: ["consolidated-wallets", fetchedAddress],
    queryFn: async () => {
      try {
        const url = `${publicEnv.API_ENDPOINT}/api/consolidations/${fetchedAddress}`;
        const response: DBResponse<string> = await fetchUrl(url);
        const wallets = response.data;

        const mappedWallets: ConsolidatedWallet[] = [];

        for (const wallet of wallets) {
          mappedWallets.push({
            address: wallet,
            display: resolveConsolidationDisplay(wallet, consolidations),
          });
        }

        return mappedWallets;
      } catch (error) {
        console.error(
          `Failed to fetch consolidated wallets for ${fetchedAddress}`,
          error
        );
        throw error;
      }
    },
    enabled: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (
      consolidatedWalletsStatus === "success" &&
      consolidatedWalletsResponse
    ) {
      setConsolidatedWallets(consolidatedWalletsResponse);
      return;
    }

    if (consolidatedWalletsStatus === "error") {
      setConsolidatedWallets([]);
    }
  }, [consolidatedWalletsStatus, consolidatedWalletsResponse]);

  const refetchConsolidatedWallets = refetchConsolidatedWalletsRaw;

  const activeDelegation = useMemo(() => {
    if (!delegationsLoaded) {
      return undefined;
    }

    const searchTargets: Array<[string, string, number]> = [
      [fetchedAddress, MEMES_CONTRACT, MINTING_USE_CASE.use_case],
      [fetchedAddress, MEMES_CONTRACT, 1],
      [fetchedAddress, DELEGATION_ALL_ADDRESS, MINTING_USE_CASE.use_case],
      [fetchedAddress, DELEGATION_ALL_ADDRESS, 1],
    ];

    for (const [address, collection, useCase] of searchTargets) {
      const match = delegations.find(
        (delegation) =>
          areEqualAddresses(address, delegation.from_address) &&
          areEqualAddresses(collection, delegation.collection) &&
          delegation.use_case === useCase
      );

      if (match) {
        return match;
      }
    }

    return undefined;
  }, [delegationsLoaded, delegations, fetchedAddress]);

  const consolidationActions = useMemo<ConsolidationDisplay[]>(() => {
    if (!consolidationsLoaded) {
      return [];
    }

    return consolidations.filter(
      (candidate) =>
        !consolidations.some(
          (comparison) =>
            areEqualAddresses(comparison.to, candidate.from) &&
            areEqualAddresses(comparison.from, candidate.to)
        )
    );
  }, [consolidationsLoaded, consolidations]);

  const resultsLoaded =
    !!fetchedAddress && delegationsLoaded && consolidationsLoaded;
  const hasAnyRecords =
    delegations.length > 0 ||
    subDelegations.length > 0 ||
    consolidations.length > 0 ||
    consolidatedWallets.length > 0;
  const hasRequestError =
    delegationsStatus === "error" ||
    consolidationsStatus === "error" ||
    consolidatedWalletsStatus === "error";

  useEffect(() => {
    if (!consolidationsLoaded || !fetchedAddress) {
      return;
    }

    if (!consolidations.length) {
      setConsolidatedWallets([]);
      return;
    }

    refetchConsolidatedWallets().catch((error) => {
      console.error("Failed to refetch consolidated wallets", error);
    });
  }, [
    consolidationsLoaded,
    consolidations,
    fetchedAddress,
    refetchConsolidatedWallets,
  ]);

  useEffect(() => {
    if (delegationsLoaded && consolidationsLoaded) {
      setChecking(false);
    }
  }, [delegationsLoaded, consolidationsLoaded]);

  const normalizedWalletAddress = walletAddress.trim();
  const normalizedWalletAddressLower = normalizedWalletAddress.toLowerCase();
  const walletAddressIsValidEthAddress = isValidEthAddress(
    normalizedWalletAddress
  );
  const walletAddressLooksLikeEns =
    normalizedWalletAddressLower.endsWith(".eth");

  const formDisabled =
    checking ||
    !normalizedWalletAddress ||
    (!walletAddressIsValidEthAddress && !walletAddressLooksLikeEns) ||
    ensLoading;
  const showAddressError =
    addressError ||
    (!!normalizedWalletAddress &&
      !walletAddressIsValidEthAddress &&
      !walletAddressLooksLikeEns &&
      !ensLoading);
  const checkedWalletEns = useEnsName({
    address: isValidEthAddress(fetchedAddress)
      ? (fetchedAddress as `0x${string}`)
      : undefined,
    chainId: 1,
  });
  let checkedWalletDisplay = fetchedAddress;
  if (checkedWalletEns.data) {
    checkedWalletDisplay = `${checkedWalletEns.data} - ${fetchedAddress}`;
  } else if (walletInputValue.includes(" - ")) {
    checkedWalletDisplay = walletInputValue;
  }

  function clearWalletChecker() {
    setWalletInputValue("");
    setWalletAddress("");
    setSubmittedAddress("");
    setFetchedAddress("");
    setAddressError(false);
    setDelegationsLoaded(false);
    setDelegations([]);
    setSubDelegations([]);
    setConsolidationsLoaded(false);
    setConsolidations([]);
    setConsolidatedWallets([]);
    setChecking(false);
    setRefreshing(false);
    setAddressQuery("");
  }

  function submitWalletCheck() {
    const nextAddress = walletAddress.trim();
    if (ensLoading || !isValidEthAddress(nextAddress)) {
      setAddressError(true);
      return;
    }

    setAddressError(false);
    setSubmittedAddress(nextAddress);
    setFetchedAddress(nextAddress);
    setDelegationsLoaded(false);
    setDelegations([]);
    setSubDelegations([]);
    setConsolidationsLoaded(false);
    setConsolidations([]);
    setConsolidatedWallets([]);
    setChecking(true);
    setAddressQuery(nextAddress);
  }

  async function refreshWalletChecker() {
    setAddressError(false);
    setRefreshing(true);
    try {
      await Promise.all([
        refetchDelegations(),
        refetchConsolidations(),
        refetchConsolidatedWallets(),
      ]);
    } catch (error) {
      console.error("Failed to refresh wallet checker records", error);
    } finally {
      setRefreshing(false);
    }
  }

  let walletFeedback = "Enter an Ethereum address or ENS name.";
  if (showAddressError) {
    walletFeedback = "Enter a valid Ethereum address or ENS name.";
  } else if (walletInputValue.trim()) {
    walletFeedback = "";
  }

  return (
    <div className="tw-w-full">
      <header className="tw-mb-6">
        <h1 className="tw-mb-2 tw-mt-0 tw-text-3xl tw-font-bold tw-text-white">
          Wallet Checker
        </h1>
        <p className="tw-mb-0 tw-max-w-4xl tw-text-base tw-leading-6 tw-text-iron-300">
          Check delegation, delegation manager, and consolidation records for a
          wallet. This is read-only and does not require wallet connection.
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!formDisabled) {
            submitWalletCheck();
          }
        }}
      >
        {!fetchedAddress ? (
          <section className="tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900 tw-p-5 sm:tw-p-6">
            <label
              htmlFor="wallet-checker-address"
              className="tw-mb-2 tw-block tw-text-sm tw-font-semibold tw-text-iron-100"
            >
              Wallet address or ENS name
            </label>
            <EnsAddressInput
              id="wallet-checker-address"
              autoFocus
              placeholder="0x... or ENS"
              className="tw-rounded-lg tw-border-iron-600 tw-px-4 tw-py-3"
              ariaDescribedBy="wallet-checker-feedback"
              value={walletInputValue}
              onAddressChange={(addr) => {
                setWalletAddress(addr.trim());
                setAddressError(false);
              }}
              onValueChange={setWalletInputValue}
              onLoadingChange={setEnsLoading}
              onError={setAddressError}
            />
            <div
              id="wallet-checker-feedback"
              className={`tw-mt-2 tw-min-h-5 tw-text-sm ${
                showAddressError
                  ? "tw-font-medium tw-text-error"
                  : "tw-text-iron-400"
              }`}
              role={showAddressError ? "alert" : undefined}
              aria-live={showAddressError ? "assertive" : undefined}
            >
              {walletFeedback}
            </div>
            <div className="tw-mt-6 tw-flex tw-flex-col-reverse tw-gap-3 sm:tw-flex-row sm:tw-justify-end">
              <SecondaryButton
                onClicked={clearWalletChecker}
                disabled={!walletInputValue.trim()}
                className="tw-w-full sm:tw-w-auto"
              >
                Clear
              </SecondaryButton>
              <PrimaryButton
                loading={checking}
                disabled={formDisabled}
                onClicked={submitWalletCheck}
                className="tw-w-full sm:tw-w-auto"
              >
                {checking ? `Checking...` : `Check Wallet`}
              </PrimaryButton>
            </div>
          </section>
        ) : (
          <section className="tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900 tw-p-5 sm:tw-p-6">
            <div className="tw-flex tw-flex-col tw-gap-5 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
              <div className="tw-min-w-0">
                <p className="tw-mb-1 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
                  Viewing wallet
                </p>
                <p className="tw-mb-0 tw-break-all tw-text-lg tw-font-semibold tw-text-white">
                  {checkedWalletDisplay}
                </p>
                {refreshing && (
                  <p
                    className="tw-mb-0 tw-mt-2 tw-text-sm tw-text-iron-300"
                    role="status"
                  >
                    Refreshing delegation records...
                  </p>
                )}
                {hasRequestError && !checking && (
                  <p
                    className="tw-mb-0 tw-mt-2 tw-text-sm tw-font-medium tw-text-error"
                    role="alert"
                  >
                    Some delegation records could not be loaded. Try refreshing.
                  </p>
                )}
                {resultsLoaded && !hasAnyRecords && !hasRequestError && (
                  <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-text-iron-300">
                    No delegation, delegation manager, or consolidation records
                    found for this wallet.
                  </p>
                )}
              </div>
              <div className="tw-flex tw-w-full tw-flex-col-reverse tw-gap-3 sm:tw-w-auto sm:tw-flex-row">
                <SecondaryButton
                  onClicked={clearWalletChecker}
                  className="tw-w-full sm:tw-w-auto"
                >
                  Clear
                </SecondaryButton>
                <PrimaryButton
                  loading={refreshing}
                  disabled={refreshing}
                  onClicked={refreshWalletChecker}
                  className="tw-w-full sm:tw-w-auto"
                >
                  {refreshing ? "Refreshing..." : "Refresh"}
                </PrimaryButton>
              </div>
            </div>
          </section>
        )}

        <WalletCheckerResults
          fetchedAddress={fetchedAddress}
          delegationsLoaded={delegationsLoaded}
          delegations={delegations}
          subDelegations={subDelegations}
          activeDelegation={activeDelegation}
          consolidationsLoaded={consolidationsLoaded}
          consolidations={consolidations}
          consolidatedWallets={consolidatedWallets}
          consolidationActions={consolidationActions}
        />
      </form>
    </div>
  );
}
