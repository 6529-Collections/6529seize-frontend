"use client";

import EnsAddressInput from "@/components/utils/input/ens-address/EnsAddressInput";
import { useHasHydrated } from "@/hooks/useHasHydrated";
import Button from "@/components/utils/button/Button";
import SecondaryButton from "@/components/utils/button/SecondaryButton";
import { publicEnv } from "@/config/env";
import { DELEGATION_ALL_ADDRESS, MEMES_CONTRACT } from "@/constants/constants";
import type { DBResponse } from "@/entities/IDBResponse";
import type { Delegation, WalletConsolidation } from "@/entities/IDelegation";
import { areEqualAddresses, isValidEthAddress } from "@/helpers/Helpers";
import { fetchUrl } from "@/services/6529api";
import { useQuery } from "@tanstack/react-query";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useEnsName } from "wagmi";
import {
  MINTING_USE_CASE,
  SUB_DELEGATION_USE_CASE,
} from "../delegation-constants";
import WalletCheckerResults, {
  type ConsolidatedWallet,
  type ConsolidationDisplay,
} from "./WalletCheckerResults";
import {
  DELEGATION_CARD_CLASS_NAME,
  DELEGATION_PAGE_DESCRIPTION_CLASS_NAME,
  DELEGATION_PAGE_TITLE_CLASS_NAME,
} from "../delegation-ui";

// A consolidation holds at most four wallets, so a grouped wallet has at most
// three counterparties. The cap bounds requests for wallets that also carry
// stray or superseded links.
const MAX_LINKED_CONSOLIDATION_WALLETS = 6;

function getConsolidationsUrl(address: string) {
  return `${publicEnv.API_ENDPOINT}/api/consolidations/${address}?show_incomplete=true`;
}

async function fetchConsolidationRows(
  address: string
): Promise<WalletConsolidation[]> {
  const response: DBResponse<WalletConsolidation> = await fetchUrl(
    getConsolidationsUrl(address)
  );
  return response.data;
}

async function fetchLinkedConsolidationRows(
  address: string
): Promise<WalletConsolidation[]> {
  try {
    return await fetchConsolidationRows(address);
  } catch (error) {
    console.error(
      `Failed to fetch consolidations for related wallet: ${address}`,
      error
    );
    return [];
  }
}

function getLinkedConsolidationWallets(
  address: string,
  rows: WalletConsolidation[]
): string[] {
  const seen = new Set([address.toLowerCase()]);
  const linkedWallets: string[] = [];

  // Confirmed links first, so group members are fetched before stray links.
  const prioritizedRows = rows.toSorted(
    (a, b) => Number(b.confirmed) - Number(a.confirmed)
  );

  for (const row of prioritizedRows) {
    let counterparty: string | undefined;
    if (areEqualAddresses(address, row.wallet1)) {
      counterparty = row.wallet2;
    } else if (areEqualAddresses(address, row.wallet2)) {
      counterparty = row.wallet1;
    }

    if (!counterparty || seen.has(counterparty.toLowerCase())) {
      continue;
    }

    seen.add(counterparty.toLowerCase());
    linkedWallets.push(counterparty);
    if (linkedWallets.length >= MAX_LINKED_CONSOLIDATION_WALLETS) {
      break;
    }
  }

  return linkedWallets;
}

function getConsolidationPairKey(row: WalletConsolidation) {
  const wallet1 = row.wallet1.toLowerCase();
  const wallet2 = row.wallet2.toLowerCase();
  return wallet1 < wallet2 ? `${wallet1}-${wallet2}` : `${wallet2}-${wallet1}`;
}

// Every pair is returned by both of its wallets. Keep one row per pair and,
// when copies disagree, the one from the latest block (its newest state).
function dedupeConsolidationPairs(
  rows: WalletConsolidation[]
): WalletConsolidation[] {
  const rowsByPair = new Map<string, WalletConsolidation>();

  for (const row of rows) {
    const key = getConsolidationPairKey(row);
    const existing = rowsByPair.get(key);
    if (!existing || row.block > existing.block) {
      rowsByPair.set(key, row);
    }
  }

  return [...rowsByPair.values()];
}

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

function getInitialCheckedAddress(address: string) {
  return isValidEthAddress(address) ? address : "";
}

function getCheckedWalletDisplay(
  fetchedAddress: string,
  resolvedEns: string | null | undefined,
  walletInputValue: string
) {
  if (resolvedEns) {
    return `${resolvedEns} - ${fetchedAddress}`;
  }

  return walletInputValue.includes(" - ") ? walletInputValue : fetchedAddress;
}

function getWalletFeedback(
  showAddressError: boolean,
  walletInputValue: string
) {
  if (showAddressError) {
    return "Enter a valid Ethereum address or ENS name.";
  }

  return walletInputValue.trim()
    ? ""
    : "Enter an Ethereum address or ENS name.";
}

interface WalletCheckerViewProps {
  fetchedAddress: string;
  walletInputValue: string;
  checkedWalletDisplay: string;
  refreshing: boolean;
  checking: boolean;
  formDisabled: boolean;
  showAddressError: boolean;
  walletFeedback: string;
  hasRequestError: boolean;
  resultsLoaded: boolean;
  hasAnyRecords: boolean;
  delegationsLoaded: boolean;
  delegations: Delegation[];
  subDelegations: Delegation[];
  activeDelegation: Delegation | undefined;
  consolidationsLoaded: boolean;
  consolidations: ConsolidationDisplay[];
  consolidatedWallets: ConsolidatedWallet[];
  consolidationActions: ConsolidationDisplay[];
  onClear(): void;
  onSubmit(): void;
  onRefresh(): void;
  onAddressChange(address: string): void;
  onValueChange(value: string): void;
  onLoadingChange(loading: boolean): void;
  onError(hasError: boolean): void;
}

function WalletCheckerView(props: Readonly<WalletCheckerViewProps>) {
  const hasHydrated = useHasHydrated();
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!props.formDisabled) {
      props.onSubmit();
    }
  }

  return (
    <div className="tw-w-full">
      <header className="tw-mb-10 sm:tw-mb-12">
        <h1 className={DELEGATION_PAGE_TITLE_CLASS_NAME}>Wallet Checker</h1>
        <p className={DELEGATION_PAGE_DESCRIPTION_CLASS_NAME}>
          Check delegation, delegation manager, and consolidation records for a
          wallet. This is read-only and does not require wallet connection.
        </p>
      </header>

      <form onSubmit={handleSubmit}>
        {!props.fetchedAddress ? (
          <section className={`${DELEGATION_CARD_CLASS_NAME} tw-p-5 sm:tw-p-6`}>
            <label
              htmlFor="wallet-checker-address"
              className="tw-mb-2 tw-block tw-text-sm tw-font-semibold tw-text-iron-200"
            >
              Wallet address or ENS name
            </label>
            <div className="tw-flex tw-flex-col tw-gap-3 sm:tw-flex-row sm:tw-items-center">
              <EnsAddressInput
                id="wallet-checker-address"
                disabled={!hasHydrated}
                autoFocus
                placeholder="0x... or ENS"
                variant="dark"
                className="tw-flex-1"
                ariaDescribedBy="wallet-checker-feedback"
                value={props.walletInputValue}
                onAddressChange={(address) =>
                  props.onAddressChange(address.trim())
                }
                onValueChange={props.onValueChange}
                onLoadingChange={props.onLoadingChange}
                onError={props.onError}
              />
              <div className="tw-flex tw-flex-col-reverse tw-gap-3 sm:tw-flex-none sm:tw-flex-row sm:tw-items-center">
                <SecondaryButton
                  onClicked={props.onClear}
                  disabled={!props.walletInputValue.trim()}
                  className="tw-h-11 tw-w-full sm:tw-w-auto"
                >
                  Clear
                </SecondaryButton>
                <Button
                  type="submit"
                  variant="action"
                  size="lg"
                  loading={props.checking}
                  disabled={props.formDisabled || !hasHydrated}
                  className="tw-w-full sm:tw-w-auto sm:tw-min-w-32"
                >
                  {props.checking ? "Checking..." : "Check Wallet"}
                </Button>
              </div>
            </div>
            <div
              id="wallet-checker-feedback"
              className={`tw-mt-2 tw-min-h-5 tw-text-xs tw-font-normal tw-leading-5 ${
                props.showAddressError
                  ? "tw-font-medium tw-text-error"
                  : "tw-text-iron-500"
              }`}
              role={props.showAddressError ? "alert" : undefined}
              aria-live={props.showAddressError ? "assertive" : undefined}
            >
              {props.walletFeedback}
            </div>
          </section>
        ) : (
          <section className={`${DELEGATION_CARD_CLASS_NAME} tw-p-5 sm:tw-p-6`}>
            <div className="tw-flex tw-flex-col tw-gap-4 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
              <div className="tw-min-w-0">
                <p className="tw-mb-1.5 tw-text-[11px] tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-widest tw-text-primary-300">
                  Viewing wallet
                </p>
                <p className="tw-mb-0 tw-break-all tw-text-base tw-font-medium tw-leading-6 tw-text-iron-100">
                  {props.checkedWalletDisplay}
                </p>
                {props.refreshing && (
                  <output className="tw-mb-0 tw-mt-2 tw-block tw-text-sm tw-font-normal tw-text-iron-400">
                    Refreshing delegation records...
                  </output>
                )}
                {props.hasRequestError && !props.checking && (
                  <p
                    className="tw-mb-0 tw-mt-2 tw-text-sm tw-font-medium tw-text-error"
                    role="alert"
                  >
                    Some delegation records could not be loaded. Try refreshing.
                  </p>
                )}
                {props.resultsLoaded &&
                  !props.hasAnyRecords &&
                  !props.hasRequestError && (
                    <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-font-normal tw-leading-6 tw-text-iron-400">
                      No delegation, delegation manager, or consolidation
                      records found for this wallet.
                    </p>
                  )}
              </div>
              <div className="tw-flex tw-w-full tw-flex-col-reverse tw-gap-3 sm:tw-w-auto sm:tw-flex-row">
                <SecondaryButton
                  onClicked={props.onClear}
                  className="tw-w-full sm:tw-w-auto"
                >
                  Clear
                </SecondaryButton>
                <Button
                  type="button"
                  variant="action"
                  size="md"
                  loading={props.refreshing}
                  disabled={props.refreshing}
                  onClick={props.onRefresh}
                  className="tw-w-full sm:tw-w-auto"
                >
                  {props.refreshing ? "Refreshing..." : "Refresh"}
                </Button>
              </div>
            </div>
          </section>
        )}

        <WalletCheckerResults
          fetchedAddress={props.fetchedAddress}
          delegationsLoaded={props.delegationsLoaded}
          delegations={props.delegations}
          subDelegations={props.subDelegations}
          activeDelegation={props.activeDelegation}
          consolidationsLoaded={props.consolidationsLoaded}
          consolidations={props.consolidations}
          consolidatedWallets={props.consolidatedWallets}
          consolidationActions={props.consolidationActions}
        />
      </form>
    </div>
  );
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
  const initialCheckedAddress = getInitialCheckedAddress(initialAddressQuery);

  const [submittedAddress, setSubmittedAddress] = useState(
    initialCheckedAddress
  );
  const [fetchedAddress, setFetchedAddress] = useState(initialCheckedAddress);
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
        const firstData = await fetchConsolidationRows(submittedAddress);
        // Load every linked wallet's rows so pairs between the other members
        // of a group (e.g. C<->D when checking A) are shown too.
        const linkedWallets = getLinkedConsolidationWallets(
          submittedAddress,
          firstData
        );
        const linkedData = await Promise.all(
          linkedWallets.map((wallet) => fetchLinkedConsolidationRows(wallet))
        );

        return dedupeConsolidationPairs([firstData, ...linkedData].flat());
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

    // Only suggest completing links between wallets that belong with the
    // checked wallet: itself, its active consolidation, or wallets it links
    // to. Completing another member's link to an unrelated wallet would move
    // that member out of the group, because the newest confirmed link wins.
    const isKnownWallet = (address: string) =>
      areEqualAddresses(address, fetchedAddress) ||
      consolidatedWallets.some((wallet) =>
        areEqualAddresses(wallet.address, address)
      ) ||
      consolidations.some(
        (row) =>
          (areEqualAddresses(row.from, fetchedAddress) &&
            areEqualAddresses(row.to, address)) ||
          (areEqualAddresses(row.to, fetchedAddress) &&
            areEqualAddresses(row.from, address))
      );

    return consolidations.filter(
      (candidate) =>
        isKnownWallet(candidate.from) &&
        isKnownWallet(candidate.to) &&
        !consolidations.some(
          (comparison) =>
            areEqualAddresses(comparison.to, candidate.from) &&
            areEqualAddresses(comparison.from, candidate.to)
        )
    );
  }, [
    consolidationsLoaded,
    consolidations,
    consolidatedWallets,
    fetchedAddress,
  ]);

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
  const checkedWalletDisplay = getCheckedWalletDisplay(
    fetchedAddress,
    checkedWalletEns.data,
    walletInputValue
  );

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

  const walletFeedback = getWalletFeedback(showAddressError, walletInputValue);

  return (
    <WalletCheckerView
      fetchedAddress={fetchedAddress}
      walletInputValue={walletInputValue}
      checkedWalletDisplay={checkedWalletDisplay}
      refreshing={refreshing}
      checking={checking}
      formDisabled={formDisabled}
      showAddressError={showAddressError}
      walletFeedback={walletFeedback}
      hasRequestError={hasRequestError}
      resultsLoaded={resultsLoaded}
      hasAnyRecords={hasAnyRecords}
      delegationsLoaded={delegationsLoaded}
      delegations={delegations}
      subDelegations={subDelegations}
      activeDelegation={activeDelegation}
      consolidationsLoaded={consolidationsLoaded}
      consolidations={consolidations}
      consolidatedWallets={consolidatedWallets}
      consolidationActions={consolidationActions}
      onClear={clearWalletChecker}
      onSubmit={submitWalletCheck}
      onRefresh={refreshWalletChecker}
      onAddressChange={(address) => {
        setWalletAddress(address);
        setAddressError(false);
      }}
      onValueChange={setWalletInputValue}
      onLoadingChange={setEnsLoading}
      onError={setAddressError}
    />
  );
}
