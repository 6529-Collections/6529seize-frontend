"use client";

import EnsAddressInput from "@/components/utils/input/ens-address/EnsAddressInput";
import { publicEnv } from "@/config/env";
import { DELEGATION_ALL_ADDRESS, MEMES_CONTRACT } from "@/constants/constants";
import type { DBResponse } from "@/entities/IDBResponse";
import type { Delegation, WalletConsolidation } from "@/entities/IDelegation";
import { areEqualAddresses, isValidEthAddress } from "@/helpers/Helpers";
import { fetchUrl } from "@/services/6529api";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MINTING_USE_CASE,
  SUB_DELEGATION_USE_CASE,
} from "../delegation-constants";
import styles from "./WalletChecker.module.css";
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
  const initialAddressQuery = address_query ?? "";

  const [fetchedAddress, setFetchedAddress] = useState<string>("");
  const [walletInputValue, setWalletInputValue] = useState(initialAddressQuery);
  const [walletAddress, setWalletAddress] = useState(initialAddressQuery);
  const [ensLoading, setEnsLoading] = useState(false);

  const [checking, setChecking] = useState(!!initialAddressQuery);
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

  const shouldFetchDelegations = checking && isValidEthAddress(walletAddress);

  const { data: delegationsResponse, status: delegationsStatus } =
    useQuery<DBResponse>({
      queryKey: ["delegations", walletAddress],
      queryFn: async () => {
        try {
          const url = `${publicEnv.API_ENDPOINT}/api/delegations/${walletAddress}`;
          return await fetchUrl(url);
        } catch (error) {
          console.error(
            `Failed to fetch delegations for ${walletAddress}`,
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

  const { data: consolidationsResponse, status: consolidationsStatus } =
    useQuery<WalletConsolidation[]>({
      queryKey: ["consolidations", walletAddress],
      queryFn: async () => {
        try {
          const baseUrl = `${publicEnv.API_ENDPOINT}/api/consolidations/${walletAddress}?show_incomplete=true`;
          const firstResponse: DBResponse<WalletConsolidation> =
            await fetchUrl(baseUrl);
          const firstData = firstResponse.data;

          if (firstData.length > 0) {
            const newWallet = areEqualAddresses(
              walletAddress,
              firstData[0]?.wallet1
            )
              ? firstData[0]?.wallet2
              : firstData[0]?.wallet1;
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
            `Failed to fetch consolidations for ${walletAddress}`,
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
      [walletAddress, MEMES_CONTRACT, MINTING_USE_CASE.use_case],
      [walletAddress, MEMES_CONTRACT, 1],
      [walletAddress, DELEGATION_ALL_ADDRESS, MINTING_USE_CASE.use_case],
      [walletAddress, DELEGATION_ALL_ADDRESS, 1],
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
  }, [delegationsLoaded, delegations, walletAddress]);

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
    const nextAddressQuery = address_query ?? "";

    setWalletInputValue(nextAddressQuery);
    setWalletAddress(nextAddressQuery);
    setFetchedAddress("");
    setAddressError(false);
    setDelegations([]);
    setDelegationsLoaded(false);
    setSubDelegations([]);
    setConsolidations([]);
    setConsolidationsLoaded(false);
    setConsolidatedWallets([]);
    setChecking(!!nextAddressQuery);
  }, [address_query]);

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
    if (!checking) {
      return;
    }

    if (ensLoading) {
      return;
    }

    if (!walletAddress || !isValidEthAddress(walletAddress)) {
      setFetchedAddress("");
      setDelegations([]);
      setDelegationsLoaded(false);
      setConsolidations([]);
      setConsolidationsLoaded(false);
      setConsolidatedWallets([]);
      setAddressError(true);
      setChecking(false);
      return;
    }

    setAddressQuery(walletAddress);
    setAddressError(false);
    setFetchedAddress(walletAddress);
    setDelegationsLoaded(false);
    setDelegations([]);
    setConsolidationsLoaded(false);
    setConsolidations([]);
    setConsolidatedWallets([]);
  }, [checking, walletAddress, ensLoading, setAddressQuery]);

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

  return (
    <div className="tw-w-full tw-py-3">
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-w-full tw-px-3">
          <h1>Wallet Checker</h1>
          <p className={styles["intro"]}>
            Check delegation, delegation manager, and consolidation records for
            a wallet. This is read-only and does not require wallet connection.
          </p>
        </div>
      </div>
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-w-full tw-px-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!formDisabled) {
                setChecking(true);
              }
            }}
          >
            <div className="-tw-mx-3 tw-flex tw-flex-wrap">
              <label
                htmlFor="wallet-checker-address"
                className="tw-flex tw-w-full tw-items-center tw-px-3"
              >
                Wallet address or ENS name
              </label>
              <div className="tw-w-full tw-px-3">
                <EnsAddressInput
                  id="wallet-checker-address"
                  disabled={delegationsLoaded || consolidationsLoaded}
                  autoFocus
                  placeholder="0x... or ENS"
                  className={styles["formInput"] ?? ""}
                  ariaDescribedBy="wallet-checker-help"
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
                  id="wallet-checker-help"
                  className="tw-text-sm tw-text-iron-400"
                >
                  Enter an Ethereum address or ENS name.
                </div>
              </div>
            </div>
            {showAddressError && (
              <div className="-tw-mx-3 tw-flex tw-flex-wrap">
                <div
                  className={`${styles["error"]} tw-w-full tw-px-3`}
                  role="alert"
                  aria-live="assertive"
                >
                  Enter a valid Ethereum address or ENS name.
                </div>
              </div>
            )}
            {!fetchedAddress && !showAddressError && !checking && (
              <p className={styles["statusText"]}>
                Enter a wallet to review current delegation records.
              </p>
            )}
            {checking && (
              <p className={styles["statusText"]} role="status">
                Checking delegation records...
              </p>
            )}
            {hasRequestError && (
              <p className={styles["error"]} role="alert">
                Some delegation records could not be loaded. Try again in a
                moment.
              </p>
            )}
            {resultsLoaded && !hasAnyRecords && !hasRequestError && (
              <p className={styles["statusText"]}>
                No delegation, delegation manager, or consolidation records
                found for this wallet.
              </p>
            )}
            <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pt-3 tw-text-center">
              <div className="tw-flex tw-w-full tw-items-center tw-justify-center tw-gap-3 tw-px-3">
                <button
                  type="button"
                  onClick={() => {
                    setWalletInputValue("");
                    setWalletAddress("");
                    setFetchedAddress("");
                    setAddressError(false);
                    setDelegationsLoaded(false);
                    setDelegations([]);
                    setSubDelegations([]);
                    setConsolidationsLoaded(false);
                    setConsolidations([]);
                    setConsolidatedWallets([]);
                    setChecking(false);
                    setAddressQuery("");
                  }}
                  className={styles["clearBtn"]}
                >
                  Clear
                </button>
                <button
                  type="button"
                  disabled={formDisabled}
                  onClick={() => setChecking(true)}
                  className={styles["checkBtn"]}
                >
                  {checking ? `Checking...` : `Check Wallet`}
                </button>
              </div>
            </div>
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
      </div>
    </div>
  );
}
