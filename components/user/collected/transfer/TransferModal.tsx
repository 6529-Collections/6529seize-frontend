"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTransfer } from "./TransferState";

import { CommunityMemberMinimal } from "@/entities/IProfile";
import { useIdentity } from "@/hooks/useIdentity";
import { faXmarkCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import TransferModalPfp from "./TransferModalPfp";

// wagmi / viem
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import { Address } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";

// DEMO: set to true to simulate transfers locally without opening wallet or sending txs
const MOCK_TRANSFERS = false;
const MOCK_TRANSFER_END_FLOW = "success";

// Minimal ABIs
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
  open: boolean;
  onClose: (opts?: { completed?: boolean }) => void;
}) {
  const t = useTransfer();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<CommunityMemberMinimal[]>([]);
  const [selectedProfile, setSelectedProfile] =
    useState<CommunityMemberMinimal | null>(null);

  // call your identity hook once a profile is selected
  const handleOrWallet =
    selectedProfile?.handle ?? selectedProfile?.wallet ?? null;
  const { profile, isLoading: isIdentityLoading } = useIdentity({
    handleOrWallet: handleOrWallet ?? "",
    initialProfile: null,
  });

  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  // refs to detect overflow for scroll hint
  const leftListRef = useRef<HTMLUListElement | null>(null);
  const resultsListRef = useRef<HTMLDivElement | null>(null);
  const walletsListRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [leftHasOverflow, setLeftHasOverflow] = useState(false);
  const [resultsHasOverflow, setResultsHasOverflow] = useState(false);
  const [walletsHasOverflow, setWalletsHasOverflow] = useState(false);

  // animation state for open/close transitions
  const [isClosing, setIsClosing] = useState(false);

  type FlowState = "review" | "wallet" | "submitted" | "success" | "error";
  const [flow, setFlow] = useState<FlowState>("review");
  const [txHashes, setTxHashes] = useState<
    {
      hash: string;
      label: string;
    }[]
  >([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [retryable, setRetryable] = useState(false);

  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();

  // reset ephemeral state when opening/closing
  useEffect(() => {
    if (!open) {
      setQuery("");
      setIsSearching(false);
      setResults([]);
      setSelectedProfile(null);
      setSelectedWallet(null);
    }
  }, [open]);

  // reset closing state when opening
  useEffect(() => {
    if (open) setIsClosing(false);
  }, [open]);

  // lock background scroll when modal is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // debounce search + clear selection on query change
  useEffect(() => {
    if (!open) return;

    // clear selection whenever query changes
    setSelectedProfile(null);
    setSelectedWallet(null);

    const q = query.trim();
    if (q.length === 0) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api.6529.io/api/community-members?param=${encodeURIComponent(
            q
          )}`
        );
        if (!res.ok) throw new Error(`Search failed with ${res.status}`);
        const arr: CommunityMemberMinimal[] = await res.json();
        if (!cancelled) setResults(arr || []);
      } catch (e) {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, query]);

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
    const check = () => {
      const hasOverflow = (el: HTMLElement | null) =>
        !!el && el.scrollHeight > el.clientHeight;
      setLeftHasOverflow(hasOverflow(leftListRef.current));
      setResultsHasOverflow(hasOverflow(resultsListRef.current));
      setWalletsHasOverflow(hasOverflow(walletsListRef.current));
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [open, items, results, profile?.wallets, isIdentityLoading]);

  const totalUnits = t.totalQty;

  const canConfirm = open && selectedWallet && totalUnits > 0;

  const handleClose = useCallback(() => {
    if (flow === "wallet" || flow === "submitted") return; // non-closable during tx
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
      setRetryable(true);
      return;
    }

    try {
      setErrorMsg(null);
      setTxHashes([]);
      setRetryable(false);
      setFlow("wallet");

      // Prepare items expanded with contract & tokenId/qty & contractType
      const selItems = Array.from(t.selected.values()).map((it) => ({
        contract: it.contract as Address,
        tokenId: BigInt(it.tokenId),
        label: it.key.replace(":", " #"),
        qty: BigInt(
          Math.min(Math.max(1, it.qty ?? 1), Math.max(1, it.max ?? 1))
        ),
        key: it.key,
        contractType: it.contractType,
      }));

      // Group by contract
      const byContract = new Map<
        string,
        { is1155: boolean; items: typeof selItems; label: string }
      >();
      for (const it of selItems) {
        if (!byContract.has(it.contract)) {
          const is1155 = it.contractType === "ERC1155";
          byContract.set(it.contract, {
            is1155,
            items: [] as any,
            label: it.label,
          });
        }
        byContract.get(it.contract)!.items.push(it);
      }

      // If mocking, synthesize hashes and progress the flow without sending txs
      if (MOCK_TRANSFERS) {
        const hashes: {
          hash: string;
          label: string;
        }[] = [];
        // for ERC1155 one hash per contract, for ERC721 one per token
        for (const [_, { is1155, items: citems }] of Array.from(
          byContract.entries()
        )) {
          if (is1155) {
            // one hash
            const rand = Array.from(
              { length: 66 },
              () => "0123456789abcdef"[Math.floor(Math.random() * 16)]
            ).join("");
            const label = citems.map((x) => x.label).join(", ");
            hashes.push({
              hash: "0x" + rand.slice(0, 64),
              label,
            });
          } else {
            for (const x of citems) {
              const rand = Array.from(
                { length: 66 },
                () => "0123456789abcdef"[Math.floor(Math.random() * 16)]
              ).join("");
              const label = x.label;
              hashes.push({
                hash: "0x" + rand.slice(0, 64),
                label,
              });
            }
          }
        }

        // simulate async timing: wallet prompt -> submitted -> mined
        await new Promise((r) => setTimeout(r, 2000));
        setTxHashes(hashes);
        setFlow("submitted");

        // simulate confirmation delays per tx
        for (const _h of hashes) {
          // small wait per tx
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 3000));
        }

        setFlow(MOCK_TRANSFER_END_FLOW as FlowState);
        return;
      }

      // Real path (non-mock)
      const hashes: {
        hash: string;
        label: string;
      }[] = [];

      const { data: walletClientLocal } = { data: walletClient } as any;

      if (!walletClientLocal) {
        setErrorMsg("Wallet not ready. Please reconnect.");
        setFlow("error");
        setRetryable(true);
        return;
      }

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
            args: [
              address as Address,
              selectedWallet as string as Address,
              ids,
              amts,
              "0x",
            ],
          });
          const label = citems.map((x) => x.label).join(", ");
          const hash = await walletClientLocal.writeContract(request);
          hashes.push({
            hash,
            label,
          });
        } else {
          for (const x of citems) {
            const { request } = await publicClient.simulateContract({
              account: address,
              address: contract as Address,
              abi: ERC721_ABI,
              functionName: "safeTransferFrom",
              args: [
                address as Address,
                selectedWallet as string as Address,
                x.tokenId,
              ],
            });
            const hash = await walletClientLocal.writeContract(request);
            hashes.push({
              hash,
              label: x.label,
            });
          }
        }
      }

      setTxHashes(hashes);
      setFlow("submitted");

      // Wait for all receipts
      for (const h of hashes) {
        await publicClient.waitForTransactionReceipt({
          hash: h.hash as `0x${string}`,
        });
      }

      setFlow("success");
    } catch (err: any) {
      const msg = err?.shortMessage || err?.message || "Transaction failed";
      setErrorMsg(msg);
      const code = err?.code;
      const name = err?.name || "";
      const sm = String(err?.shortMessage || "").toLowerCase();
      const m = String(err?.message || "").toLowerCase();
      const looksRejected =
        code === 4001 ||
        name.includes("UserRejected") ||
        sm.includes("rejected") ||
        m.includes("rejected");
      setRetryable(looksRejected && txHashes.length === 0);
      setFlow("error");
    }
  }, [
    publicClient,
    address,
    t.selected,
    selectedWallet,
    walletClient,
    txHashes.length,
  ]);

  if (!open) return null;

  const getFlowTitle = () => {
    if (flow === "review")
      return <span>Review transfer and select recipient</span>;
    if (flow === "success")
      return (
        <span className="tw-flex tw-items-center tw-gap-1">
          <span className="tw-text-green">Success!</span>
          <img
            src="/emojis/sgt_saluting_face.webp"
            alt="sgt_saluting_face"
            className="tw-w-6 tw-h-6"
          />
        </span>
      );
    if (flow === "error")
      return (
        <span className="tw-flex tw-items-center tw-gap-1">
          <span className="tw-text-red">Transfer failed</span>
          <img
            src="/emojis/sgt_sob.webp"
            alt="sgt_sob"
            className="tw-w-6 tw-h-6"
          />
        </span>
      );
    if (flow === "wallet")
      return (
        <span className="tw-flex tw-items-center tw-gap-1">
          <span>Confirm in your wallet</span>
          <CircleLoader />
        </span>
      );
    if (flow === "submitted")
      return (
        <span className="tw-flex tw-items-center tw-gap-1">
          <span>Transfer submitted</span>
          <CircleLoader />
        </span>
      );
  };

  return (
    <div
      className={[
        "tw-fixed tw-inset-0 tw-z-[100] tw-bg-white/10 tw-backdrop-blur-sm tw-flex tw-items-start tw-justify-center tw-p-4 md:tw-p-8",
        isClosing
          ? "tw-opacity-0 tw-transition-opacity tw-duration-150"
          : "tw-opacity-100 tw-transition-opacity tw-duration-150",
      ].join(" ")}
      onClick={(e) => {
        if (flow === "wallet" || flow === "submitted") return;
        if (e.target === e.currentTarget) handleClose();
      }}
      role="dialog"
      aria-modal="true">
      <div
        className={[
          "tw-w-full tw-max-w-5xl tw-rounded-2xl tw-bg-[#0c0c0d] tw-ring-[3px] tw-ring-white/30 tw-text-white tw-shadow-xl tw-overflow-hidden",
          isClosing
            ? "tw-scale-95 tw-opacity-0 tw-transition-all tw-duration-150"
            : "tw-scale-100 tw-opacity-100 tw-transition-all tw-duration-150",
        ].join(" ")}>
        {/* header */}
        <div className="tw-flex tw-items-center tw-justify-between tw-border-b tw-border-white/10 tw-px-4 tw-py-3">
          <div className="tw-text-lg tw-font-semibold">{getFlowTitle()}</div>
          {(flow === "review" || flow === "success" || flow === "error") && (
            <FontAwesomeIcon
              icon={faXmarkCircle}
              type="button"
              onClick={handleClose}
              size="xl"
            />
          )}
        </div>

        {/* body */}
        {flow === "review" ? (
          <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6 tw-p-4">
            {/* left: recap selected NFTs */}
            <div className="tw-space-y-3">
              <div>
                You're transferring <b>{t.count}</b>{" "}
                {t.count === 1 ? "NFT" : "NFTs"} · <b>{t.totalQty}</b>{" "}
                {t.totalQty === 1 ? "item" : "items"}
              </div>
              <ul
                ref={leftListRef}
                className="tw-max-h-[50vh] tw-overflow-auto tw-space-y-2 tw-pr-3 tw-p-1 tw-[scrollbar-gutter:stable] tw-scrollbar-thin tw-scrollbar-thumb-white/30 tw-scrollbar-track-transparent hover:tw-scrollbar-thumb-white/50">
                {items.map((it) => {
                  const [collection, tokenId] = it.key.split(":");
                  return (
                    <li
                      key={it.key}
                      className="tw-flex tw-items-center tw-gap-3 tw-rounded-lg tw-border tw-border-white/10 tw-bg-white/5 tw-p-2">
                      {it.thumbUrl ? (
                        <Image
                          alt={it.title ?? it.key}
                          src={it.thumbUrl}
                          width={40}
                          height={40}
                          className="tw-rounded-md tw-object-cover"
                        />
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
                  Scroll for more
                </div>
              )}
            </div>

            {/* right: search + select target */}
            <div className="tw-space-y-3">
              {!selectedProfile ? (
                <>
                  <label className="tw-text-sm tw-opacity-90">
                    Search recipient
                  </label>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="handle, ens or wallet"
                    className="tw-w-full tw-rounded-lg tw-border tw-border-white/10 tw-bg-white/5 tw-px-3 tw-py-2 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-white/20"
                    ref={searchInputRef}
                  />
                  <div className="tw-text-[12px] tw-opacity-60">
                    {isSearching
                      ? "Searching…"
                      : results.length > 0
                      ? `Found ${results.length} result${
                          results.length === 1 ? "" : "s"
                        }`
                      : query
                      ? "No results."
                      : "Type to search."}
                  </div>
                  <div
                    ref={resultsListRef}
                    className="tw-space-y-2 tw-max-h-[38vh] tw-overflow-auto tw-pr-3 tw-p-1 tw-[scrollbar-gutter:stable] tw-scrollbar-thin tw-scrollbar-thumb-white/30 tw-scrollbar-track-transparent hover:tw-scrollbar-thumb-white/50">
                    {results.map((r: CommunityMemberMinimal) => (
                      <button
                        key={r.profile_id}
                        type="button"
                        onClick={() => {
                          setSelectedProfile(r);
                          setSelectedWallet(null);
                        }}
                        className="tw-w-full tw-text-left tw-rounded-lg tw-border tw-border-white/10 tw-bg-white/5 hover:tw-bg-white/10 tw-p-2 tw-flex tw-items-center tw-gap-3">
                        {r.pfp ? (
                          <TransferModalPfp
                            src={r.pfp}
                            alt={r.display || r.handle || r.wallet}
                          />
                        ) : (
                          <div className="tw-h-9 tw-w-9 tw-rounded-full tw-bg-white/10" />
                        )}
                        <div className="tw-min-w-0 tw-flex-1">
                          <div className="tw-truncate tw-text-sm tw-font-medium">
                            {r.display || r.handle}
                          </div>
                          <div className="tw-truncate tw-text-[11px] tw-opacity-60">
                            {r.wallet}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  {resultsHasOverflow && (
                    <div className="tw-text-xs tw-opacity-75 tw-text-center">
                      Scroll for more
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="tw-flex tw-items-center tw-justify-between tw-rounded-lg tw-border tw-border-white/10 tw-bg-white/5 tw-px-3 tw-py-2">
                    <div className="tw-flex tw-items-center tw-gap-3 tw-min-w-0">
                      {selectedProfile.pfp ? (
                        <TransferModalPfp
                          src={selectedProfile.pfp}
                          alt={
                            selectedProfile.display ||
                            selectedProfile.handle ||
                            selectedProfile.wallet
                          }
                        />
                      ) : (
                        <div className="tw-h-9 tw-w-9 tw-rounded-full tw-bg-white/10" />
                      )}
                      <div className="tw-min-w-0">
                        <div className="tw-truncate tw-text-sm tw-font-medium">
                          {selectedProfile.display || selectedProfile.handle}
                        </div>
                        <div className="tw-truncate tw-text-[11px] tw-opacity-60">
                          {selectedProfile.wallet}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="tw-text-xs tw-rounded-md tw-bg-white/10 hover:tw-bg-white/20 tw-px-2 tw-py-1 tw-border-1 tw-border-solid tw-border-[#444]"
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

                  <div className="tw-pt-2 tw-space-y-2">
                    <div className="tw-text-sm">Choose destination wallet</div>
                    <div
                      ref={walletsListRef}
                      className="tw-space-y-2 tw-max-h-[30vh] tw-overflow-auto tw-pr-3 tw-p-1 tw-[scrollbar-gutter:stable] tw-scrollbar-thin tw-scrollbar-thumb-white/30 tw-scrollbar-track-transparent hover:tw-scrollbar-thumb-white/50">
                      {isIdentityLoading ? (
                        <div className="tw-text-xs tw-opacity-60">
                          Loading wallets…
                        </div>
                      ) : (profile?.wallets ?? []).length === 0 ? (
                        <div className="tw-text-xs tw-opacity-60">
                          No wallets found for{" "}
                          {selectedProfile.display || selectedProfile.handle}.
                        </div>
                      ) : (
                        profile!.wallets!.map(
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
                                  "tw-w-full tw-text-left tw-rounded-lg tw-border tw-border-white/10 tw-bg-white/5 hover:tw-bg-white/10 tw-p-2",
                                  isSel
                                    ? "tw-ring-inset tw-ring-2 tw-ring-emerald-400/60"
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
                        )
                      )}
                    </div>
                    {walletsHasOverflow && (
                      <div className="tw-text-xs tw-opacity-75 tw-text-center">
                        Scroll for more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          // TX status views
          <div className="tw-p-6 tw-space-y-4">
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
                    <li key={h.hash} className="tw-text-sm">
                      {h.label} {" - "}
                      <a
                        href={`${publicClient?.chain?.blockExplorers?.default.url}/tx/${h.hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="tw-underline">
                        View Tx
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {flow === "success" && (
              <div className="tw-space-y-2">
                <div>
                  {txHashes.length > 1
                    ? "All transfers confirmed"
                    : "Transfer confirmed"}
                </div>
                <ul className="tw-space-y-1">
                  {txHashes.map((h) => (
                    <li key={h.hash} className="tw-text-sm">
                      {h.label} {" - "}
                      <a
                        href={`${publicClient?.chain?.blockExplorers?.default.url}/tx/${h.hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="tw-underline">
                        View Tx
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {flow === "error" && (
              <div className="tw-space-y-2">
                <div className="tw-text-sm tw-text-red-400">{errorMsg}</div>
                {txHashes.length > 0 && (
                  <ul className="tw-space-y-1">
                    {txHashes.map((h) => (
                      <li key={h.hash} className="tw-text-sm">
                        {h.label} {" - "}
                        <a
                          href={`${publicClient?.chain?.blockExplorers?.default.url}/tx/${h.hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="tw-underline">
                          View Tx
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {/* footer */}
        <div className="tw-flex tw-justify-end tw-gap-3 tw-border-t tw-border-white/10 tw-px-4 tw-py-3">
          {flow === "review" ? (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="tw-rounded-lg tw-bg-white/10 hover:tw-bg-white/15 tw-px-4 tw-py-2 tw-border-1 tw-border-solid tw-border-[#444]">
                Cancel
              </button>
              <button
                type="button"
                disabled={!canConfirm}
                onClick={handleConfirm}
                className="tw-rounded-lg tw-bg-white tw-text-black tw-px-4 tw-py-2 tw-border-1 tw-border-solid tw-border-[#444] disabled:tw-opacity-60 disabled:tw-cursor-not-allowed">
                Transfer
              </button>
            </>
          ) : flow === "wallet" || flow === "submitted" ? (
            <button
              type="button"
              disabled
              className="tw-rounded-lg tw-bg-white/10 tw-px-4 tw-py-2 tw-opacity-60">
              Processing…
            </button>
          ) : flow === "error" ? (
            <>
              <button
                type="button"
                onClick={() => setFlow("review")}
                className="tw-rounded-lg tw-bg-white/10 hover:tw-bg-white/15 tw-px-4 tw-py-2 tw-border-1 tw-border-solid tw-border-[#444]">
                Back
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="tw-rounded-lg tw-bg-white tw-text-black tw-px-4 tw-py-2">
                Close
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleClose}
              className="tw-rounded-lg tw-bg-white tw-text-black tw-px-4 tw-py-2">
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
