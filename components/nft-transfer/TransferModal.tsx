"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTransfer } from "./TransferState";

import { CommunityMemberMinimal } from "@/entities/IProfile";
import { useIdentity } from "@/hooks/useIdentity";
import {
  faAnglesDown,
  faAnglesUp,
  faXmarkCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import TransferModalPfp from "./TransferModalPfp";

import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import { publicEnv } from "@/config/env";
import { commonApiFetch } from "@/services/api/common-api";
import Link from "next/link";
import { Address, isAddress } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";

// DEMO: set to true to simulate transfers locally without opening wallet or sending txs
const MOCK_TRANSFERS = false;
const MOCK_TRANSFER_END_FLOW: "success" | "error" = "success";
const MIN_SEARCH_LENGTH = 3;

const ERC721_ABI = [
  {
    type: "function",
    name: "safeTransferFrom",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

const ERC1155_ABI = [
  {
    type: "function",
    name: "safeBatchTransferFrom",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "ids", type: "uint256[]" },
      { name: "amounts", type: "uint256[]" },
      { name: "data", type: "bytes" },
    ],
    outputs: [],
  },
] as const;

export default function TransferModal({
  open,
  onClose,
}: {
  readonly open: boolean;
  readonly onClose: (opts?: { completed?: boolean }) => void;
}) {
  const enableMockTransfers = publicEnv.NODE_ENV !== "production";
  const t = useTransfer();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<CommunityMemberMinimal[]>([]);
  const [selectedProfile, setSelectedProfile] =
    useState<CommunityMemberMinimal | null>(null);

  const handleOrWallet =
    selectedProfile?.handle ?? selectedProfile?.wallet ?? null;
  const { profile, isLoading: isIdentityLoading } = useIdentity({
    handleOrWallet: handleOrWallet ?? "",
    initialProfile: null,
  });

  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  const leftListRef = useRef<HTMLUListElement | null>(null);
  const resultsListRef = useRef<HTMLDivElement | null>(null);
  const walletsListRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [leftHasOverflow, setLeftHasOverflow] = useState(false);
  const [resultsHasOverflow, setResultsHasOverflow] = useState(false);
  const [walletsHasOverflow, setWalletsHasOverflow] = useState(false);

  const [leftAtEnd, setLeftAtEnd] = useState(false);
  const [resultsAtEnd, setResultsAtEnd] = useState(false);
  const [walletsAtEnd, setWalletsAtEnd] = useState(false);

  const [isClosing, setIsClosing] = useState(false);

  // UI-driven mock controls (default to constants above)
  const [mockTransfers, setMockTransfers] = useState<boolean>(MOCK_TRANSFERS);
  const [mockEndFlow, setMockEndFlow] = useState<"success" | "error">(
    MOCK_TRANSFER_END_FLOW
  );

  type FlowState = "review" | "wallet" | "submitted" | "success" | "error";
  const [flow, setFlow] = useState<FlowState>("review");
  const [txHashes, setTxHashes] = useState<
    {
      hash: string;
      label: string;
    }[]
  >([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();
  const trimmedQuery = query.trim();
  const needsMoreSearchCharacters =
    trimmedQuery.length > 0 && trimmedQuery.length < MIN_SEARCH_LENGTH;
  const remainingSearchCharacters = Math.max(
    MIN_SEARCH_LENGTH - trimmedQuery.length,
    0
  );

  // --- helpers to reduce complexity (kept types light on purpose) ---
  const groupByContract = useCallback((items: any[]) => {
    const by = new Map<
      string,
      { is1155: boolean; items: any[]; label: string }
    >();
    for (const it of items) {
      const existing = by.get(it.contract);
      if (existing) {
        existing.items.push(it);
      } else {
        by.set(it.contract, {
          is1155: it.contractType === "ERC1155",
          items: [it],
          label: it.label,
        });
      }
    }
    return by;
  }, []);

  const makeMockHashes = useCallback(
    (
      byContract: Map<string, { is1155: boolean; items: any[]; label: string }>
    ) => {
      const hashes: { hash: string; label: string }[] = [];
      for (const [, { is1155, items: citems }] of Array.from(
        byContract.entries()
      )) {
        if (is1155) {
          const rand = Array.from(
            { length: 64 },
            () => "0123456789abcdef"[Math.floor(Math.random() * 16)]
          ).join("");
          hashes.push({
            hash: `0x${rand}`,
            label: citems.map((x) => x.label).join(", "),
          });
        } else {
          for (const x of citems) {
            const rand = Array.from(
              { length: 64 },
              () => "0123456789abcdef"[Math.floor(Math.random() * 16)]
            ).join("");
            hashes.push({ hash: `0x${rand}`, label: x.label });
          }
        }
      }
      return hashes;
    },
    []
  );

  // --- lifecycle & effects ---
  useEffect(() => {
    if (!open) {
      setQuery("");
      setIsSearching(false);
      setResults([]);
      setSelectedProfile(null);
      setSelectedWallet(null);
      setFlow("review");
      setTxHashes([]);
      setErrorMsg(null);
      setMockTransfers(MOCK_TRANSFERS);
      setMockEndFlow(MOCK_TRANSFER_END_FLOW);
      setLeftHasOverflow(false);
      setResultsHasOverflow(false);
      setWalletsHasOverflow(false);
      setLeftAtEnd(false);
      setResultsAtEnd(false);
      setWalletsAtEnd(false);
      setIsClosing(false);
    }
  }, [open]);

  useEffect(() => {
    if (open) setIsClosing(false);
  }, [open]);

  // lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ESC to close (no keyboard listener on <dialog>/<div>)
  useEffect(() => {
    if (!open) return;
    if (flow === "wallet" || flow === "submitted") return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape" || ev.key === "Esc") {
        ev.preventDefault();
        handleClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, flow, isClosing]);

  useEffect(() => {
    if (!open) return;

    setSelectedProfile(null);
    setSelectedWallet(null);

    if (trimmedQuery.length < MIN_SEARCH_LENGTH) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    const abortController = new AbortController();
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const arr = await commonApiFetch<CommunityMemberMinimal[]>({
          endpoint: "community-members",
          params: {
            param: trimmedQuery,
          },
          signal: abortController.signal,
        });
        if (!cancelled) setResults(arr || []);
      } catch (err) {
        console.warn("Search failed", err);
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      abortController.abort();
      clearTimeout(timer);
    };
  }, [open, trimmedQuery]);

  const items = useMemo(
    () =>
      Array.from(t.selected.values()).map((it) => ({
        key: it.key,
        qty: Math.min(Math.max(1, it.qty ?? 1), Math.max(1, it.max ?? 1)),
        title: it.title,
        thumbUrl: it.thumbUrl,
      })),
    [t.selected]
  );

  useEffect(() => {
    const hasOverflow = (el: HTMLElement | null) =>
      !!el && el.scrollHeight > el.clientHeight;

    const check = () => {
      setLeftHasOverflow(hasOverflow(leftListRef.current));
      setResultsHasOverflow(hasOverflow(resultsListRef.current));
      setWalletsHasOverflow(hasOverflow(walletsListRef.current));

      const nearBottom = (el: HTMLElement | null) => {
        if (!el) return false;
        const threshold = 4; // px tolerance
        return el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
      };

      setLeftAtEnd(nearBottom(leftListRef.current));
      setResultsAtEnd(nearBottom(resultsListRef.current));
      setWalletsAtEnd(nearBottom(walletsListRef.current));
    };

    check();
    globalThis.addEventListener("resize", check);

    const leftEl = leftListRef.current;
    const resultsEl = resultsListRef.current;
    const walletsEl = walletsListRef.current;

    const onScrollLeft = () => {
      const el = leftListRef.current;
      if (!el) return;
      const threshold = 4;
      setLeftAtEnd(
        el.scrollTop + el.clientHeight >= el.scrollHeight - threshold
      );
    };
    const onScrollResults = () => {
      const el = resultsListRef.current;
      if (!el) return;
      const threshold = 4;
      setResultsAtEnd(
        el.scrollTop + el.clientHeight >= el.scrollHeight - threshold
      );
    };
    const onScrollWallets = () => {
      const el = walletsListRef.current;
      if (!el) return;
      const threshold = 4;
      setWalletsAtEnd(
        el.scrollTop + el.clientHeight >= el.scrollHeight - threshold
      );
    };

    leftEl?.addEventListener("scroll", onScrollLeft);
    resultsEl?.addEventListener("scroll", onScrollResults);
    walletsEl?.addEventListener("scroll", onScrollWallets);

    return () => {
      globalThis.removeEventListener("resize", check);
      leftEl?.removeEventListener("scroll", onScrollLeft);
      resultsEl?.removeEventListener("scroll", onScrollResults);
      walletsEl?.removeEventListener("scroll", onScrollWallets);
    };
  }, [open, items, results, profile?.wallets, isIdentityLoading]);

  const totalUnits = t.totalQty;
  const canConfirm = open && selectedWallet && totalUnits > 0;

  const handleClose = useCallback(() => {
    if (flow === "wallet" || flow === "submitted") return;
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose(
        flow === "success" || flow === "error" ? { completed: true } : undefined
      );
    }, 150);
  }, [flow, isClosing, onClose]);

  const handleConfirm = useCallback(async () => {
    if (!publicClient || !address) {
      setErrorMsg("Client not ready. Please reconnect.");
      setFlow("error");
      return;
    }

    try {
      setErrorMsg(null);
      setTxHashes([]);
      setFlow("wallet");

      const selItems = Array.from(t.selected.values()).map((it) => ({
        contract: it.contract as Address,
        tokenId: BigInt(it.tokenId),
        label: (it.key as string).replace(":", " #"),
        qty: BigInt(
          Math.min(Math.max(1, it.qty ?? 1), Math.max(1, it.max ?? 1))
        ),
        key: it.key,
        contractType: it.contractType,
      }));

      const byContract = groupByContract(selItems);

      if (mockTransfers) {
        const hashes = makeMockHashes(byContract);
        await new Promise((r) => setTimeout(r, 2000));
        setTxHashes(hashes);
        setFlow("submitted");
        for (let i = 0; i < hashes.length; i++) {
          await new Promise((r) => setTimeout(r, 3000));
        }
        setFlow(mockEndFlow as FlowState);
        return;
      }

      if (!walletClient) {
        setErrorMsg("Wallet not ready. Please reconnect.");
        setFlow("error");
        return;
      }

      if (!selectedWallet || !isAddress(selectedWallet)) {
        setErrorMsg(
          "Invalid destination wallet. Please choose another wallet."
        );
        setFlow("error");
        return;
      }

      const destinationWallet = selectedWallet as Address;

      // avoid TS complaining about writeContract on {}
      const write = (
        walletClient as unknown as {
          writeContract: (req: any) => Promise<`0x${string}`>;
        }
      ).writeContract;

      const hashes: { hash: string; label: string }[] = [];

      for (const [contract, { is1155, items: citems }] of Array.from(
        byContract.entries()
      )) {
        if (is1155) {
          const ids = citems.map((x) => x.tokenId);
          const amts = citems.map((x) => x.qty);
          const { request } = await publicClient.simulateContract({
            account: address,
            address: contract as Address,
            abi: ERC1155_ABI,
            functionName: "safeBatchTransferFrom",
            args: [address as Address, destinationWallet, ids, amts, "0x"],
          });
          const label = citems.map((x) => x.label).join(", ");
          const hash = await write(request);
          hashes.push({ hash, label });
        } else {
          for (const x of citems) {
            const { request } = await publicClient.simulateContract({
              account: address,
              address: contract as Address,
              abi: ERC721_ABI,
              functionName: "safeTransferFrom",
              args: [address as Address, destinationWallet, x.tokenId],
            });
            const hash = await write(request);
            hashes.push({ hash, label: x.label });
          }
        }
      }

      setTxHashes(hashes);
      setFlow("submitted");

      for (const h of hashes) {
        await publicClient.waitForTransactionReceipt({
          hash: h.hash as `0x${string}`,
        });
      }

      setFlow("success");
    } catch (err: any) {
      const msg = err?.shortMessage || err?.message || "Transaction failed";
      setErrorMsg(msg);
      setFlow("error");
    }
  }, [
    publicClient,
    address,
    t.selected,
    selectedWallet,
    walletClient,
    mockTransfers,
    mockEndFlow,
    groupByContract,
    makeMockHashes,
  ]);

  if (!open) return null;

  const getFlowTitle = () => {
    if (flow === "review")
      return <span>Review transfer and select recipient</span>;
    if (flow === "success")
      return (
        <span className="tw-flex tw-items-center tw-gap-1.5">
          <span className="tw-text-green">Transfer Successful!</span>
          <img
            src="/emojis/sgt_saluting_face.webp"
            alt="sgt_saluting_face"
            className="tw-w-6 tw-h-6"
          />
        </span>
      );
    if (flow === "error")
      return (
        <span className="tw-flex tw-items-center tw-gap-1.5">
          <span className="tw-text-red">Transfer Failed</span>
          <img
            src="/emojis/sgt_sob.webp"
            alt="sgt_sob"
            className="tw-w-6 tw-h-6"
          />
        </span>
      );
    if (flow === "wallet")
      return (
        <span className="tw-flex tw-items-center tw-gap-1.5">
          <span>Confirm in your wallet</span>
          <CircleLoader size={CircleLoaderSize.MEDIUM} />
        </span>
      );
    if (flow === "submitted")
      return (
        <span className="tw-flex tw-items-center tw-gap-1.5">
          <span>Transfer submitted</span>
          <CircleLoader size={CircleLoaderSize.MEDIUM} />
        </span>
      );
  };

  // Derive search helper text without nested ternaries (Sonar fix)
  let searchStatusText = "Type to search.";
  if (isSearching) {
    searchStatusText = "Searching…";
  } else if (needsMoreSearchCharacters) {
    const plural = remainingSearchCharacters === 1 ? "" : "s";
    searchStatusText = `Keep typing ${remainingSearchCharacters} more character${plural}`;
  } else if (results.length > 0) {
    const plural = results.length === 1 ? "" : "s";
    searchStatusText = `Found ${results.length} result${plural}`;
  } else if (trimmedQuery) {
    searchStatusText = "No results.";
  }

  // Backdrop + modal content; no role on non-interactive with key/mouse listeners on it
  return (
    <div
      className={[
        "tw-fixed tw-inset-0 tw-z-[100] tw-bg-white/10 tw-backdrop-blur-sm tw-flex tw-items-start tw-justify-center tw-p-4 md:tw-p-8",
        isClosing
          ? "tw-opacity-0 tw-transition-opacity tw-duration-150"
          : "tw-opacity-100 tw-transition-opacity tw-duration-150",
      ].join(" ")}
      onMouseDown={(e) => {
        if (flow === "wallet" || flow === "submitted") return;
        if (e.target === e.currentTarget) handleClose();
      }}
      aria-modal="true"
      aria-label="Transfer dialog">
      <div
        className={[
          "tw-w-[70vw] tw-max-w-[1100px] tw-h-[75vh] tw-max-h-[900px] tw-rounded-2xl tw-bg-[#0c0c0d] tw-ring-[3px] tw-ring-white/30 tw-text-white tw-shadow-xl tw-overflow-hidden tw-flex tw-flex-col",
          isClosing
            ? "tw-scale-95 tw-opacity-0 tw-transition-all tw-duration-150"
            : "tw-scale-100 tw-opacity-100 tw-transition-all tw-duration-150",
        ].join(" ")}
        onMouseDown={(e) => e.stopPropagation()}>
        {/* header */}
        <div className="tw-flex tw-items-center tw-justify-between tw-border-0 tw-border-b-[3px] tw-border-solid tw-border-white/30 tw-p-4">
          <div className="tw-text-lg tw-font-semibold">{getFlowTitle()}</div>
          <div className="tw-flex tw-items-center tw-gap-3">
            {flow === "review" && enableMockTransfers && (
              <div className="tw-flex tw-items-center tw-gap-2 tw-text-[12px] tw-opacity-80">
                <label className="tw-flex tw-items-center tw-gap-1">
                  <input
                    type="checkbox"
                    checked={mockTransfers}
                    onChange={(e) => setMockTransfers(e.target.checked)}
                  />
                  <span>Mock</span>
                </label>
                <select
                  value={mockEndFlow}
                  onChange={(e) =>
                    setMockEndFlow(e.target.value as "success" | "error")
                  }
                  disabled={!mockTransfers}
                  className="tw-bg-white/10 tw-rounded tw-border tw-border-white/20 tw-px-2 tw-py-1 tw-text-[12px] focus:tw-outline-none">
                  <option value="success">success</option>
                  <option value="error">error</option>
                </select>
              </div>
            )}
            {(flow === "review" || flow === "success" || flow === "error") && (
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close"
                className="tw-bg-transparent tw-border-none tw-p-0 tw-flex tw-items-center tw-justify-center">
                <FontAwesomeIcon icon={faXmarkCircle} className="tw-size-6" />
              </button>
            )}
          </div>
        </div>

        {/* body */}
        {flow === "review" ? (
          <div className="tw-flex-1 tw-overflow-hidden tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6 tw-px-4 tw-py-2">
            {/* left: recap selected NFTs */}
            <div className="tw-flex tw-flex-col tw-space-y-2 tw-min-h-0">
              <div className="tw-font-semibold">
                You're transferring{" "}
                <span className="tw-font-bold">{t.count}</span>{" "}
                {t.count === 1 ? "NFT" : "NFTs"} ·{" "}
                <span className="tw-font-bold">{t.totalQty}</span>{" "}
                {t.totalQty === 1 ? "item" : "items"}
              </div>
              <ul
                ref={leftListRef}
                className="tw-flex-1 tw-min-h-0 tw-overflow-auto tw-space-y-2 tw-pl-0 tw-pr-3 tw-[scrollbar-gutter:stable] tw-scrollbar-thin tw-scrollbar-thumb-white/30 tw-scrollbar-track-transparent hover:tw-scrollbar-thumb-white/50">
                {items.map((it) => {
                  const [collection, tokenId] = it.key.split(":");
                  return (
                    <li
                      key={it.key}
                      className="tw-flex tw-items-center tw-gap-3 tw-rounded-lg tw-bg-white/10 tw-p-2">
                      {it.thumbUrl ? (
                        <div className="tw-relative tw-h-10 tw-w-10 tw-rounded-md tw-overflow-hidden tw-bg-white/10">
                          <Image
                            alt={it.title ?? it.key}
                            src={it.thumbUrl}
                            fill
                            sizes="40px"
                            className="tw-object-contain"
                            quality={90}
                          />
                        </div>
                      ) : (
                        <div className="tw-h-10 tw-w-10 tw-rounded-md tw-bg-white/10" />
                      )}
                      <div className="tw-min-w-0 tw-flex-1">
                        <div className="tw-truncate tw-text-sm">
                          {it.title ?? `${collection} #${tokenId}`}
                        </div>
                        <div className="tw-truncate tw-text-xs tw-opacity-70">
                          {collection} #{tokenId}
                        </div>
                      </div>
                      <div className="tw-text-xs tw-font-medium">x{it.qty}</div>
                    </li>
                  );
                })}
              </ul>
              {leftHasOverflow && (
                <div className="tw-text-xs tw-opacity-75 tw-text-center">
                  <FontAwesomeIcon
                    icon={leftAtEnd ? faAnglesUp : faAnglesDown}
                  />{" "}
                  Scroll for more
                </div>
              )}
            </div>

            {/* right: search + select target */}
            <div className="tw-flex tw-flex-col tw-space-y-2 tw-min-h-0">
              <div
                className={`tw-font-semibold ${
                  selectedProfile ? "tw-mb-2" : "tw-mb-0"
                }`}>
                Recipient
              </div>
              {selectedProfile ? (
                <>
                  <div className="tw-flex tw-items-center tw-justify-between tw-rounded-lg tw-bg-white/10 tw-px-3 tw-py-2">
                    <div className="tw-flex tw-items-center tw-gap-3 tw-min-w-0">
                      <TransferModalPfp
                        src={selectedProfile.pfp}
                        alt={
                          selectedProfile.display ||
                          selectedProfile.handle ||
                          selectedProfile.wallet
                        }
                        level={selectedProfile.level}
                      />
                      <div className="tw-min-w-0">
                        <div className="tw-truncate tw-text-sm tw-font-medium">
                          {selectedProfile.display || selectedProfile.handle}
                        </div>
                        <div className="tw-truncate tw-text-[11px] tw-opacity-60">
                          TDH: {selectedProfile.tdh.toLocaleString()} - Level:{" "}
                          {selectedProfile.level}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="!tw-text-xs tw-rounded-md tw-bg-white/10 hover:tw-bg-white/15 tw-px-2 tw-py-1 tw-border-1 tw-border-solid tw-border-[#444] tw-font-medium"
                      onClick={() => {
                        setSelectedProfile(null);
                        setSelectedWallet(null);
                        setResults([]);
                        setQuery("");
                        setTimeout(() => searchInputRef.current?.focus(), 0);
                      }}>
                      Change
                    </button>
                  </div>

                  <div className="tw-pt-4 tw-space-y-2 tw-flex tw-flex-col tw-min-h-0">
                    <div className="tw-text-sm">Choose destination wallet</div>
                    <div
                      ref={walletsListRef}
                      className="tw-space-y-2 tw-flex-1 tw-min-h-0 tw-overflow-auto tw-pr-3 tw-[scrollbar-gutter:stable] tw-scrollbar-thin tw-scrollbar-thumb-white/30 tw-scrollbar-track-transparent hover:tw-scrollbar-thumb-white/50">
                      {(() => {
                        if (isIdentityLoading) {
                          return (
                            <div className="tw-text-xs tw-opacity-60">
                              Loading wallets…
                            </div>
                          );
                        }

                        const wallets = profile?.wallets ?? [];
                        if (wallets.length === 0) {
                          return (
                            <div className="tw-text-xs tw-opacity-60">
                              No wallets found for{" "}
                              {selectedProfile.display ||
                                selectedProfile.handle}
                              .
                            </div>
                          );
                        }

                        return wallets.map(
                          (w: {
                            wallet: string;
                            display: string;
                            tdh: number;
                          }) => {
                            const isSel =
                              selectedWallet?.toLowerCase() ===
                              w.wallet.toLowerCase();
                            return (
                              <button
                                key={w.wallet}
                                type="button"
                                onClick={() => setSelectedWallet(w.wallet)}
                                className={[
                                  "tw-w-full tw-text-left tw-rounded-lg tw-border tw-border-white/10 tw-bg-white/10 hover:tw-bg-white/15 tw-p-2",
                                  isSel
                                    ? "tw-border-2 tw-border-solid tw-border-emerald-400"
                                    : "",
                                ].join(" ")}>
                                <div className="tw-text-sm tw-font-medium">
                                  {w.display || w.wallet}
                                </div>
                                <div className="tw-text-[11px] tw-opacity-60">
                                  {w.wallet}
                                </div>
                              </button>
                            );
                          }
                        );
                      })()}
                    </div>
                    {walletsHasOverflow && (
                      <div className="tw-text-xs tw-opacity-75 tw-text-center">
                        <FontAwesomeIcon
                          icon={walletsAtEnd ? faAnglesUp : faAnglesDown}
                        />{" "}
                        Scroll for more
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <input
                    autoFocus
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by handle, ens or wallet"
                    className="tw-h-14 tw-w-full tw-rounded-lg tw-border-none tw-bg-white/10 tw-px-3 tw-py-2 focus:tw-outline-none focus:tw-bg-white/20"
                    ref={searchInputRef}
                  />
                  <div className="tw-text-[12px] tw-opacity-60">
                    {searchStatusText}
                  </div>
                  <div
                    ref={resultsListRef}
                    className="tw-space-y-2 tw-flex-1 tw-min-h-0 tw-overflow-auto tw-pr-3 tw-[scrollbar-gutter:stable] tw-scrollbar-thin tw-scrollbar-thumb-white/30 tw-scrollbar-track-transparent hover:tw-scrollbar-thumb-white/50">
                    {results.map((r: CommunityMemberMinimal) => (
                      <button
                        key={r.profile_id}
                        type="button"
                        onClick={() => {
                          setSelectedProfile(r);
                          setSelectedWallet(null);
                        }}
                        className="tw-w-full tw-text-left tw-rounded-lg tw-border tw-border-white/10 tw-bg-white/10 hover:tw-bg-white/15 tw-p-2 tw-flex tw-items-center tw-gap-3">
                        <TransferModalPfp
                          src={r.pfp}
                          alt={r.display || r.handle || r.wallet}
                          level={r.level}
                        />
                        <div className="tw-min-w-0 tw-flex-1">
                          <div className="tw-truncate tw-text-sm tw-font-medium">
                            {r.display || r.handle}
                          </div>
                          <div className="tw-truncate tw-text-[11px] tw-opacity-60">
                            TDH: {r.tdh.toLocaleString()} - Level: {r.level}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  {resultsHasOverflow && (
                    <div className="tw-text-xs tw-opacity-75 tw-text-center">
                      <FontAwesomeIcon
                        icon={resultsAtEnd ? faAnglesUp : faAnglesDown}
                      />{" "}
                      Scroll for more
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="tw-flex-1 tw-overflow-auto tw-p-6 tw-space-y-4">
            {flow === "wallet" && (
              <div className="tw-text-center">
                <div>Approve the transaction to continue.</div>
              </div>
            )}
            {flow === "submitted" && (
              <div className="tw-space-y-2">
                <div>Waiting for confirmation…</div>
                <ul className="tw-space-y-1">
                  {txHashes.map((h) => (
                    <li key={h.hash}>
                      {h.label}
                      <Link
                        href={`${publicClient?.chain?.blockExplorers?.default.url}/tx/${h.hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="tw-underline">
                        <button
                          type="button"
                          className="tw-ml-2 tw-text-md tw-rounded-lg tw-bg-white hover:tw-bg-white/95 tw-text-black tw-font-medium tw-text-sm tw-px-2 tw-py-1">
                          View Tx
                        </button>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {flow === "success" && (
              <div className="tw-space-y-2">
                <div className="tw-font-semibold tw-text-lg">
                  {txHashes.length > 1
                    ? "All transfers confirmed"
                    : "Transfer confirmed"}
                </div>
                <ul className="tw-space-y-1">
                  {txHashes.map((h) => (
                    <li key={h.hash}>
                      {h.label}
                      <Link
                        href={`${publicClient?.chain?.blockExplorers?.default.url}/tx/${h.hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="tw-underline">
                        <button
                          type="button"
                          className="tw-ml-2 tw-text-md tw-rounded-lg tw-bg-white hover:tw-bg-white/95 tw-text-black tw-font-medium tw-text-sm tw-px-2 tw-py-1">
                          View Tx
                        </button>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {flow === "error" && (
              <div className="tw-space-y-2">
                <div>{errorMsg}</div>
                {txHashes.length > 0 && (
                  <ul className="tw-space-y-1">
                    {txHashes.map((h) => (
                      <li key={h.hash}>
                        {h.label}
                        <Link
                          href={`${publicClient?.chain?.blockExplorers?.default.url}/tx/${h.hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="tw-underline">
                          <button
                            type="button"
                            className="tw-ml-2 tw-text-md tw-rounded-lg tw-bg-white hover:tw-bg-white/95 tw-text-black tw-font-medium tw-text-sm tw-px-2 tw-py-1">
                            View Tx
                          </button>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {/* footer */}
        <div className="tw-flex tw-justify-end tw-gap-3 tw-border-0 tw-border-t-[3px] tw-border-solid tw-border-white/30 tw-p-4">
          {(() => {
            if (flow === "review") {
              return (
                <>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="tw-rounded-lg tw-bg-white/10 hover:tw-bg-white/15 tw-px-4 tw-py-2 tw-border-1 tw-border-solid tw-border-[#444] tw-font-medium">
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!canConfirm}
                    onClick={handleConfirm}
                    className="tw-rounded-lg tw-bg-white tw-text-black tw-px-4 tw-py-2 tw-border-1 tw-border-solid tw-border-[#444] disabled:tw-opacity-60 disabled:tw-cursor-not-allowed tw-font-medium">
                    Transfer
                  </button>
                </>
              );
            }

            if (flow === "wallet" || flow === "submitted") {
              return (
                <button
                  type="button"
                  disabled
                  className="tw-rounded-lg tw-bg-white/10 tw-px-4 tw-py-2 tw-opacity-60 tw-font-medium">
                  Processing…
                </button>
              );
            }

            if (flow === "error") {
              return (
                <>
                  <button
                    type="button"
                    onClick={() => setFlow("review")}
                    className="tw-rounded-lg tw-bg-white/10 hover:tw-bg-white/15 tw-px-4 tw-py-2 tw-border-1 tw-border-solid tw-border-[#444] tw-font-medium">
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="tw-rounded-lg tw-bg-white hover:tw-bg-white/95 tw-text-black tw-px-4 tw-py-2 tw-font-medium">
                    Close
                  </button>
                </>
              );
            }

            return (
              <button
                type="button"
                onClick={handleClose}
                className="tw-rounded-lg tw-bg-white tw-text-black tw-px-4 tw-py-2">
                Close
              </button>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
