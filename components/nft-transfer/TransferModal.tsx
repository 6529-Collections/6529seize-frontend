"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTransfer } from "./TransferState";

import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import { CommunityMemberMinimal } from "@/entities/IProfile";
import { ContractType } from "@/enums";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { getUserProfile } from "@/helpers/server.helpers";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useIdentity } from "@/hooks/useIdentity";
import { commonApiFetch } from "@/services/api/common-api";
import {
  faAnglesDown,
  faAnglesUp,
  faExclamationTriangle,
  faXmarkCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { createPortal } from "react-dom";
import {
  Address,
  isAddress,
  PublicClient,
  type WriteContractParameters,
} from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import TransferModalPfp from "./TransferModalPfp";

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
    name: "safeTransferFrom",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "id", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "data", type: "bytes" },
    ],
    outputs: [],
  },
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

const MANIFOLD_CORE_ABI = [
  {
    type: "function",
    name: "tokenExtension",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ type: "address" }],
  },
] as const;

type FlowState = "review" | "submission";
type TxState =
  | "pending"
  | "awaiting_approval"
  | "submitted"
  | "success"
  | "error";

type TxEntry = {
  id: string;
  originKey: string;
  label: string;
  state: TxState;
  hash?: `0x${string}`;
  error?: string;
};

type TxItem = {
  key: string;
  tokenId: bigint;
  qty: bigint;
  contractType: ContractType;
  contract: Address;
};

type WalletClientWithWrite = {
  writeContract: (req: WriteContractParameters) => Promise<`0x${string}`>;
};

const waitForPaint = async () => {
  if (!globalThis.window) return;
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
};

function hasWriteContract(client: any): client is WalletClientWithWrite {
  return client && typeof client.writeContract === "function";
}

function computeFlowTitle(
  total: number,
  successCount: number,
  errorCount: number
): { label: string; icon: string } {
  const allSuccess = total > 0 && successCount === total;
  const allFail = total > 0 && errorCount === total;

  if (total === 1 && allSuccess) {
    return {
      label: "Transfer Successful",
      icon: "/emojis/sgt_saluting_face.webp",
    };
  }
  if (total === 1 && allFail) {
    return { label: "Transfer Failed", icon: "/emojis/sgt_sob.webp" };
  }
  if (total === 1) {
    return { label: "Transfer Complete", icon: "/emojis/sgt_grimacing.webp" };
  }
  if (allSuccess) {
    return {
      label: `All ${total} Transactions Successful`,
      icon: "/emojis/sgt_saluting_face.webp",
    };
  }
  if (allFail) {
    return {
      label: `All ${total} Transactions Failed`,
      icon: "/emojis/sgt_sob.webp",
    };
  }
  return {
    label: `Transfer Complete: ${successCount} successful, ${errorCount} failed`,
    icon: "/emojis/sgt_grimacing.webp",
  };
}

function FlowTitle({
  flow,
  txs,
}: {
  readonly flow: FlowState;
  readonly txs: TxEntry[];
}) {
  if (flow === "review") {
    return <span>Review transfer and select recipient</span>;
  }

  const anyPending = anyTxsPending(txs);
  if (anyPending) {
    return (
      <span className="tw-flex tw-items-center tw-gap-1.5">
        <span>
          Executing {txs.length} Transaction{txs.length > 1 ? "s" : ""}
        </span>
        <CircleLoader size={CircleLoaderSize.MEDIUM} />
      </span>
    );
  }

  const total = txs.length;
  const successCount = txs.filter((t) => t.state === "success").length;
  const errorCount = txs.filter((t) => t.state === "error").length;

  const { label, icon } = computeFlowTitle(total, successCount, errorCount);

  return (
    <span className="tw-flex tw-items-center tw-gap-1.5">
      <span>{label}</span>
      <img src={icon} alt="status" className="tw-w-6 tw-h-6" />
    </span>
  );
}

function SelectedSummaryList({
  items,
  leftListRef,
  leftHasOverflow,
  leftAtEnd,
}: {
  readonly items: {
    key: string;
    qty: number;
    title?: string;
    thumbUrl?: string;
  }[];
  readonly leftListRef: React.RefObject<HTMLUListElement | null>;
  readonly leftHasOverflow: boolean;
  readonly leftAtEnd: boolean;
}) {
  return (
    <div className="tw-flex tw-flex-col tw-space-y-2 tw-min-h-0 tw-max-h-full tw-overflow-hidden">
      <div className="tw-font-semibold tw-flex-shrink-0">
        You're transferring <span className="tw-font-bold">{items.length}</span>{" "}
        {items.length === 1 ? "NFT" : "NFTs"} ·{" "}
        <span className="tw-font-bold">
          {items.reduce((sum, it) => sum + (it.qty || 0), 0)}
        </span>{" "}
        {items.reduce((sum, it) => sum + (it.qty || 0), 0) === 1
          ? "item"
          : "items"}
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
        <div className="tw-text-xs tw-opacity-75 tw-text-center tw-flex-shrink-0">
          <FontAwesomeIcon icon={leftAtEnd ? faAnglesUp : faAnglesDown} />{" "}
          Scroll for more
        </div>
      )}
    </div>
  );
}

function RecipientSelected({
  selectedProfile,
  profile,
  isIdentityLoading,
  setSelectedProfile,
  setSelectedWallet,
  setResults,
  setQuery,
  searchInputRef,
  walletsListRef,
  walletsHasOverflow,
  walletsAtEnd,
  selectedWallet,
}: {
  readonly selectedProfile: CommunityMemberMinimal;
  readonly profile: ApiIdentity | null;
  readonly isIdentityLoading: boolean;
  readonly setSelectedProfile: (v: CommunityMemberMinimal | null) => void;
  readonly setSelectedWallet: (v: string | null) => void;
  readonly setResults: (v: CommunityMemberMinimal[]) => void;
  readonly setQuery: (v: string) => void;
  readonly searchInputRef: React.RefObject<HTMLInputElement | null>;
  readonly walletsListRef: React.RefObject<HTMLDivElement | null>;
  readonly walletsHasOverflow: boolean;
  readonly walletsAtEnd: boolean;
  readonly selectedWallet: string | null;
}) {
  const wallets = profile?.wallets ?? [];
  let walletsContent;
  if (isIdentityLoading) {
    walletsContent = (
      <div className="tw-text-xs tw-opacity-60">Loading wallets…</div>
    );
  } else if (wallets.length === 0) {
    walletsContent = (
      <div className="tw-text-xs tw-opacity-60">
        No wallets found for {selectedProfile.display || selectedProfile.handle}
        .
      </div>
    );
  } else {
    walletsContent = wallets.map(
      (w: { wallet: string; display: string; tdh: number }) => {
        const isSel = selectedWallet?.toLowerCase() === w.wallet.toLowerCase();
        return (
          <button
            key={w.wallet}
            type="button"
            onClick={() => setSelectedWallet(w.wallet)}
            className={[
              "tw-w-full tw-rounded-lg tw-border tw-border-white/10 tw-bg-white/10 hover:tw-bg-white/15 tw-p-2 tw-flex tw-flex-col tw-items-start tw-justify-between",
              isSel ? "tw-border-2 tw-border-solid !tw-border-emerald-400" : "",
            ].join(" ")}>
            <div className="tw-text-sm tw-font-medium">
              {w.display || w.wallet}
            </div>
            <div className="tw-text-[11px] tw-opacity-60">{w.wallet}</div>
          </button>
        );
      }
    );
  }

  return (
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
          className="!tw-text-xs tw-rounded-md tw-bg-white/10 hover:tw-bg-white/15 tw-px-2 tw-py-1 tw-border-2 tw-border-solid tw-border-[#444] tw-font-medium"
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
          {walletsContent}
        </div>
        {walletsHasOverflow && (
          <div className="tw-text-xs tw-opacity-75 tw-text-center">
            <FontAwesomeIcon icon={walletsAtEnd ? faAnglesUp : faAnglesDown} />{" "}
            Scroll for more
          </div>
        )}
      </div>
    </>
  );
}

function RecipientSearch({
  query,
  setQuery,
  searchStatusText,
  results,
  onPick,
  resultsListRef,
  resultsHasOverflow,
  resultsAtEnd,
  searchInputRef,
}: {
  readonly query: string;
  readonly setQuery: (v: string) => void;
  readonly searchStatusText: string;
  readonly results: CommunityMemberMinimal[];
  readonly onPick: (r: CommunityMemberMinimal) => void;
  readonly resultsListRef: React.RefObject<HTMLDivElement | null>;
  readonly resultsHasOverflow: boolean;
  readonly resultsAtEnd: boolean;
  readonly searchInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
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
      <div className="tw-text-[12px] tw-opacity-60">{searchStatusText}</div>
      <div
        ref={resultsListRef}
        className="tw-space-y-2 tw-flex-1 tw-min-h-0 tw-overflow-auto tw-pr-3 tw-[scrollbar-gutter:stable] tw-scrollbar-thin tw-scrollbar-thumb-white/30 tw-scrollbar-track-transparent hover:tw-scrollbar-thumb-white/50">
        {results.map((r) => (
          <button
            key={r.profile_id ?? r.wallet}
            type="button"
            onClick={() => onPick(r)}
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
          <FontAwesomeIcon icon={resultsAtEnd ? faAnglesUp : faAnglesDown} />{" "}
          Scroll for more
        </div>
      )}
    </>
  );
}

function TxStatusList({
  txs,
  publicClient,
}: {
  readonly txs: TxEntry[];
  readonly publicClient: PublicClient | undefined;
}) {
  const explorer = publicClient?.chain?.blockExplorers?.default.url;

  const getBgColor = (state: TxState) => {
    switch (state) {
      case "awaiting_approval":
        return "#406AFE";
      case "submitted":
        return "#a1e1ff";
      case "error":
        return "#ffcccc";
      case "success":
        return "#ccffcc";
      default:
        return "rgba(255, 255, 255, 0.9)";
    }
  };
  const getTextColor = (state: TxState) => {
    if (state === "awaiting_approval") return "#fff";
    return "#000";
  };

  const txLink = (hash: string) => {
    if (!explorer) return null;
    return (
      <Link
        href={`${explorer}/tx/${hash}`}
        target="_blank"
        rel="noreferrer"
        className="tw-inline-block tw-no-underline tw-ml-2 !tw-text-sm tw-rounded-md tw-bg-white hover:tw-bg-white/80 tw-text-black hover:tw-text-black tw-px-2 tw-py-1 tw-border tw-border-solid tw-border-black">
        View Tx
      </Link>
    );
  };

  return (
    <>
      {txs.map((t, index) => (
        <div
          key={t.id}
          className="tw-rounded-lg tw-p-4"
          style={{
            backgroundColor: getBgColor(t.state),
            color: getTextColor(t.state),
          }}>
          <div className="tw-font-medium">
            {index + 1}/ {t.label}
          </div>
          <div className="tw-text-xs tw-opacity-60">
            Originator: {t.originKey}
          </div>
          <div className="tw-text-sm tw-mt-2">
            {t.state === "pending" && <span>Pending</span>}
            {t.state === "awaiting_approval" && (
              <span>Approve in your wallet</span>
            )}
            {t.state === "error" && (
              <span>
                Error: {t.error || "Transaction failed"}
                {t.hash && txLink(t.hash)}
              </span>
            )}
            {t.state === "submitted" && (
              <span>
                Submitted — waiting for confirmation
                {t.hash && txLink(t.hash)}
              </span>
            )}
            {t.state === "success" && (
              <span>
                Successful
                {t.hash && txLink(t.hash)}
              </span>
            )}
          </div>
        </div>
      ))}
    </>
  );
}

// --- Helper functions/components to offload branching logic ---
function getSearchStatusText(
  isSearching: boolean,
  needsMoreSearchCharacters: boolean,
  remainingSearchCharacters: number,
  resultsLen: number,
  trimmedQuery: string
): string {
  if (isSearching) return "Searching…";
  if (needsMoreSearchCharacters) {
    const plural = remainingSearchCharacters === 1 ? "" : "s";
    return `Type ${remainingSearchCharacters} more character${plural}`;
  }
  if (resultsLen > 0) {
    const plural = resultsLen === 1 ? "" : "s";
    return `Found ${resultsLen} result${plural}`;
  }
  if (trimmedQuery) return "No results.";
  return "Type to search.";
}

function HeaderRight({
  flow,
  trxPending,
  onClose,
}: {
  readonly flow: FlowState;
  readonly trxPending: boolean;
  readonly onClose: () => void;
}) {
  return (
    <div className="tw-flex tw-items-center tw-gap-3">
      {(flow === "review" || !trxPending) && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="tw-bg-transparent tw-border-none tw-p-0 tw-flex tw-items-center tw-justify-center">
          <FontAwesomeIcon icon={faXmarkCircle} className="tw-size-6" />
        </button>
      )}
    </div>
  );
}

function FooterActions({
  flow,
  canConfirm,
  onCancel,
  onConfirm,
  onClose,
  txs,
}: {
  readonly flow: FlowState;
  readonly canConfirm: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
  readonly onClose: () => void;
  readonly txs: TxEntry[];
}) {
  if (flow === "review") {
    return (
      <div className="tw-flex tw-items-center tw-gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="tw-rounded-lg tw-bg-white/10 hover:tw-bg-white/15 tw-px-4 tw-py-2 tw-border-2 tw-border-solid tw-border-[#444] tw-font-medium">
          Cancel
        </button>
        <button
          type="button"
          disabled={!canConfirm}
          onClick={onConfirm}
          className="tw-rounded-lg tw-bg-white tw-text-black tw-px-4 tw-py-2 tw-border-2 tw-border-solid tw-border-[#444] disabled:tw-opacity-60 disabled:tw-cursor-not-allowed tw-font-medium">
          Transfer
        </button>
      </div>
    );
  }

  const anyPending = anyTxsPending(txs);
  if (anyPending) {
    return (
      <button
        type="button"
        disabled
        className="tw-rounded-lg tw-bg-white/10 tw-px-4 tw-py-2 tw-opacity-60 tw-font-medium">
        Processing…
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClose}
      className="tw-rounded-lg tw-bg-white hover:tw-bg-white/80 tw-text-black hover:tw-text-black tw-px-4 tw-py-2">
      Close
    </button>
  );
}

function BodyByFlow({
  flow,
  items,
  leftListRef,
  leftHasOverflow,
  leftAtEnd,
  selectedProfile,
  profile,
  isIdentityLoading,
  setSelectedProfile,
  setSelectedWallet,
  setResults,
  setQuery,
  searchInputRef,
  walletsListRef,
  walletsHasOverflow,
  walletsAtEnd,
  selectedWallet,
  query,
  setQueryExternal,
  searchStatusText,
  results,
  onPick,
  resultsListRef,
  resultsHasOverflow,
  resultsAtEnd,
  publicClient,
  txs,
}: {
  readonly flow: FlowState;
  readonly items: {
    key: string;
    qty: number;
    title?: string;
    thumbUrl?: string;
  }[];
  readonly leftListRef: React.RefObject<HTMLUListElement | null>;
  readonly leftHasOverflow: boolean;
  readonly leftAtEnd: boolean;
  readonly selectedProfile: CommunityMemberMinimal | null;
  readonly profile: ApiIdentity | null;
  readonly isIdentityLoading: boolean;
  readonly setSelectedProfile: (v: CommunityMemberMinimal | null) => void;
  readonly setSelectedWallet: (v: string | null) => void;
  readonly setResults: (v: CommunityMemberMinimal[]) => void;
  readonly setQuery: (v: string) => void;
  readonly searchInputRef: React.RefObject<HTMLInputElement | null>;
  readonly walletsListRef: React.RefObject<HTMLDivElement | null>;
  readonly walletsHasOverflow: boolean;
  readonly walletsAtEnd: boolean;
  readonly selectedWallet: string | null;
  readonly query: string;
  readonly setQueryExternal: (v: string) => void;
  readonly searchStatusText: string;
  readonly results: CommunityMemberMinimal[];
  readonly onPick: (r: CommunityMemberMinimal) => void;
  readonly resultsListRef: React.RefObject<HTMLDivElement | null>;
  readonly resultsHasOverflow: boolean;
  readonly resultsAtEnd: boolean;
  readonly publicClient: PublicClient | undefined;
  readonly txs: TxEntry[];
}) {
  if (flow === "submission") {
    const anyPending = anyTxsPending(txs);

    return (
      <div className="tw-flex-1 tw-overflow-auto tw-p-4 sm:tw-p-6 tw-space-y-4">
        <div className="tw-flex tw-items-center tw-gap-2 tw-text-xs sm:tw-text-sm tw-opacity-80">
          <span>
            {anyPending
              ? "Follow the prompts in your wallet and keep this tab open."
              : "All transactions have been completed. You can close this window now."}
          </span>
        </div>

        <TxStatusList txs={txs} publicClient={publicClient} />
      </div>
    );
  }

  return (
    <div className="tw-flex-1 tw-overflow-hidden tw-flex tw-flex-col lg:tw-grid lg:tw-grid-cols-2 tw-gap-6 tw-px-4 tw-py-2">
      <div className="tw-min-h-0 tw-max-h-[50%] lg:tw-max-h-none">
        <SelectedSummaryList
          items={items}
          leftListRef={leftListRef}
          leftHasOverflow={leftHasOverflow}
          leftAtEnd={leftAtEnd}
        />
      </div>
      <div className="tw-flex tw-flex-col tw-space-y-2 tw-min-h-0 tw-flex-1 lg:tw-flex-initial">
        <div
          className={`tw-font-semibold ${
            selectedProfile ? "tw-mb-2" : "tw-mb-0"
          }`}>
          Recipient
        </div>
        {selectedProfile ? (
          <RecipientSelected
            selectedProfile={selectedProfile}
            profile={profile}
            isIdentityLoading={isIdentityLoading}
            setSelectedProfile={setSelectedProfile}
            setSelectedWallet={setSelectedWallet}
            setResults={setResults}
            setQuery={setQuery}
            searchInputRef={searchInputRef}
            walletsListRef={walletsListRef}
            walletsHasOverflow={walletsHasOverflow}
            walletsAtEnd={walletsAtEnd}
            selectedWallet={selectedWallet}
          />
        ) : (
          <RecipientSearch
            query={query}
            setQuery={setQueryExternal}
            searchStatusText={searchStatusText}
            results={results}
            onPick={onPick}
            resultsListRef={resultsListRef}
            resultsHasOverflow={resultsHasOverflow}
            resultsAtEnd={resultsAtEnd}
            searchInputRef={searchInputRef}
          />
        )}
      </div>
    </div>
  );
}

function anyTxsPending(txs: TxEntry[]) {
  return txs.some(
    (t) =>
      t.state === "pending" ||
      t.state === "awaiting_approval" ||
      t.state === "submitted"
  );
}

export default function TransferModal({
  open,
  onClose,
}: {
  readonly open: boolean;
  readonly onClose: (opts?: { completed?: boolean }) => void;
}) {
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
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  const [isMounted, setIsMounted] = useState(false);

  const [leftHasOverflow, setLeftHasOverflow] = useState(false);
  const [resultsHasOverflow, setResultsHasOverflow] = useState(false);
  const [walletsHasOverflow, setWalletsHasOverflow] = useState(false);

  const [leftAtEnd, setLeftAtEnd] = useState(false);
  const [resultsAtEnd, setResultsAtEnd] = useState(false);
  const [walletsAtEnd, setWalletsAtEnd] = useState(false);

  const [isClosing, setIsClosing] = useState(false);

  const [flow, setFlow] = useState<FlowState>("review");
  const [txs, setTxs] = useState<TxEntry[]>([]);

  const trxPending = useMemo(() => anyTxsPending(txs), [txs]);

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

  const groupByContractAndOriginator = useCallback(
    async (publicClient: PublicClient, items: TxItem[]) => {
      const by = new Map<
        string,
        {
          contract: string;
          collection: string;
          originKey: string;
          is1155: boolean;
          items: TxItem[];
        }
      >();

      const getOriginKey = async (contract: Address, tokenId: bigint) => {
        try {
          const ext = (await publicClient.readContract({
            address: contract,
            abi: MANIFOLD_CORE_ABI,
            functionName: "tokenExtension",
            args: [tokenId],
          })) as Address;
          return `ext:${ext.toLowerCase()}`;
        } catch {
          // core-minted (no extension for token)
          return `core:${contract.toLowerCase()}`;
        }
      };

      for (const it of items) {
        const contract = (it.contract as string).toLowerCase();
        const is1155 = it.contractType === ContractType.ERC1155;

        let originKey = "erc721";
        if (is1155) {
          const id = BigInt(it.tokenId);
          originKey = await getOriginKey(contract as Address, id);
        }

        const key = `${contract}::${originKey}`;
        const existing = by.get(key);
        if (existing) {
          existing.items.push(it);
        } else {
          by.set(key, {
            contract,
            collection: it.key.split(":")[0],
            originKey,
            is1155,
            items: [it],
          });
        }
      }

      return by;
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

  useEffect(() => {
    if (!open) return;
    setSelectedProfile(null);
    setSelectedWallet(null);
  }, [open]);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const debouncedQuery = useDebouncedValue(trimmedQuery, 350);
  const enabled = open && debouncedQuery.length >= MIN_SEARCH_LENGTH;

  const { data, isFetching } = useQuery<CommunityMemberMinimal[]>({
    queryKey: ["memberSearch", debouncedQuery],
    enabled,
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: 30_000,
    gcTime: 300_000,
    queryFn: async ({ signal }: { signal: AbortSignal }) => {
      try {
        const arr = await commonApiFetch<CommunityMemberMinimal[]>({
          endpoint: "community-members",
          params: { param: debouncedQuery },
          signal,
        });

        if (arr && arr.length > 0) return arr;

        const identity = await getUserProfile({
          user: debouncedQuery,
          headers: {},
        });

        const communityMember: CommunityMemberMinimal = {
          profile_id: identity.id,
          handle: identity.handle,
          wallet: identity.primary_wallet,
          pfp: identity.pfp,
          display: identity.handle ?? null,
          normalised_handle: identity.normalised_handle,
          primary_wallet: identity.primary_wallet,
          tdh: identity.tdh,
          level: identity.level,
          cic_rating: identity.cic,
        };

        return [communityMember];
      } catch {
        return [];
      }
    },
  });

  useEffect(() => {
    const preDebounce =
      open &&
      trimmedQuery.length >= MIN_SEARCH_LENGTH &&
      debouncedQuery !== trimmedQuery;
    setIsSearching(preDebounce || (enabled && isFetching));
  }, [open, trimmedQuery, debouncedQuery, enabled, isFetching]);

  useEffect(() => {
    if (!enabled) {
      setResults([]);
      return;
    }
    setResults(data ?? []);
  }, [enabled, data, setResults]);

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
        const threshold = 4;
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
    if (trxPending) return;
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose({
        completed:
          flow !== "review" &&
          txs.length > 0 &&
          !txs.every((t) => t.state === "error"),
      });
    }, 150);
  }, [isClosing, onClose, flow, trxPending, txs]);

  const handleConfirm = useCallback(async () => {
    if (!publicClient || !address) {
      setTxs([
        {
          id: "init",
          originKey: "init",
          label: "Client not ready",
          state: "error",
          error: "Client not ready. Please reconnect.",
        },
      ]);
      setFlow("submission");
      return;
    }

    const selItems: TxItem[] = Array.from(t.selected.values()).map((it) => ({
      contract: it.contract as Address,
      tokenId: BigInt(it.tokenId),
      qty: BigInt(Math.min(Math.max(1, it.qty ?? 1), Math.max(1, it.max ?? 1))),
      key: it.key,
      contractType: it.contractType,
    }));

    const byContract = await groupByContractAndOriginator(
      publicClient,
      selItems
    );
    for (const value of Array.from(byContract.values())) {
      value.items.sort((a, b) =>
        a.tokenId.toString().localeCompare(b.tokenId.toString())
      );
    }

    const initial: TxEntry[] = [];
    for (const [
      key,
      { collection, originKey, contract, is1155, items: citems },
    ] of Array.from(byContract.entries())) {
      if (is1155) {
        const itemsLabel = citems
          .map((x: TxItem) => {
            const tokenId = x.tokenId.toString();
            const count = x.qty;
            return `#${tokenId}(x${count})`;
          })
          .join(" - ");
        initial.push({
          id: `${key}-batch`,
          originKey,
          label: `${collection} ${itemsLabel}`,
          state: "pending",
        });
      } else {
        for (const x of citems) {
          initial.push({
            id: `${contract}-${x.tokenId.toString()}`,
            originKey,
            label: `${collection} #${x.tokenId.toString()}`,
            state: "pending",
          });
        }
      }
    }
    setTxs(initial);
    setFlow("submission");

    if (!walletClient) {
      setTxs([
        {
          id: "init",
          originKey: "init",
          label: "Wallet not ready",
          state: "error",
          error: "Wallet not ready. Please reconnect.",
        },
      ]);
      return;
    }

    if (!selectedWallet || !isAddress(selectedWallet)) {
      setTxs([
        {
          id: "init",
          originKey: "init",
          label: "Invalid destination wallet",
          state: "error",
          error: "Invalid destination wallet. Please choose another wallet.",
        },
      ]);
      return;
    }

    if (!hasWriteContract(walletClient)) {
      setTxs([
        {
          id: "init",
          originKey: "init",
          label: "Wallet not ready",
          state: "error",
          error: "Wallet does not support writeContract.",
        },
      ]);
      return;
    }

    const destinationWallet = selectedWallet as Address;
    const write = walletClient.writeContract;

    for (const [key, { contract, is1155, items: citems }] of Array.from(
      byContract.entries()
    )) {
      if (is1155) {
        // Try batch
        try {
          const ids = citems.map((x: TxItem) => x.tokenId);
          const amts = citems.map((x: TxItem) => x.qty);
          const { request } = await publicClient.simulateContract({
            account: address,
            address: contract as Address,
            abi: ERC1155_ABI,
            functionName: "safeBatchTransferFrom",
            args: [address as Address, destinationWallet, ids, amts, "0x"],
          });

          setTxs((prev) =>
            prev.map((e) =>
              e.id === `${key}-batch` ? { ...e, state: "awaiting_approval" } : e
            )
          );

          const hash = await write(request);
          setTxs((prev) =>
            prev.map((e) =>
              e.id === `${key}-batch` ? { ...e, state: "submitted", hash } : e
            )
          );
          await waitForPaint();
          const receipt = await publicClient.waitForTransactionReceipt({
            hash,
          });
          setTxs((prev) =>
            prev.map((e) =>
              e.id === `${key}-batch`
                ? {
                    ...e,
                    state: receipt.status === "success" ? "success" : "error",
                  }
                : e
            )
          );
          await waitForPaint();
        } catch (e: any) {
          console.error("Error in batch 1155 transfer", e);
          setTxs((prev) =>
            prev.map((te) =>
              te.id === `${key}-batch`
                ? {
                    ...te,
                    state: "error",
                    error: String(
                      e?.details ?? (e?.shortMessage || e?.message || e)
                    ),
                  }
                : te
            )
          );
        }
      } else {
        // ERC721 one by one
        for (const x of citems) {
          const tid = `${contract}-${x.tokenId.toString()}`;
          try {
            const { request } = await publicClient.simulateContract({
              account: address,
              address: contract as Address,
              abi: ERC721_ABI,
              functionName: "safeTransferFrom",
              args: [address as Address, destinationWallet, x.tokenId],
            });

            setTxs((prev) =>
              prev.map((te) =>
                te.id === tid ? { ...te, state: "awaiting_approval" } : te
              )
            );

            try {
              const hash = await write(request);
              setTxs((prev) =>
                prev.map((te) =>
                  te.id === tid ? { ...te, state: "submitted", hash } : te
                )
              );
              await waitForPaint();
              const receipt = await publicClient.waitForTransactionReceipt({
                hash,
              });
              setTxs((prev) =>
                prev.map((te) =>
                  te.id === tid
                    ? {
                        ...te,
                        state:
                          receipt.status === "success" ? "success" : "error",
                      }
                    : te
                )
              );
              await waitForPaint();
            } catch (e: any) {
              console.error("Error in 721 transfer", e);
              setTxs((prev) =>
                prev.map((te) =>
                  te.id === tid
                    ? {
                        ...te,
                        state: "error",
                        error: String(e?.shortMessage || e?.message || e),
                      }
                    : te
                )
              );
            }
          } catch (error: any) {
            setTxs((prev) =>
              prev.map((te) =>
                te.id === tid
                  ? {
                      ...te,
                      state: "error",
                      error: String(
                        error?.shortMessage || error?.message || error
                      ),
                    }
                  : te
              )
            );
          }
        }
      }
    }
  }, [
    publicClient,
    address,
    t.selected,
    selectedWallet,
    walletClient,
    groupByContractAndOriginator,
  ]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Escape" || e.key === "Esc") && !trxPending) {
        e.preventDefault();
        handleClose();
      }
    };
    globalThis.addEventListener("keydown", onKeyDown);
    return () => globalThis.removeEventListener("keydown", onKeyDown);
  }, [open, trxPending, handleClose]);

  if (!open) return null;

  // Derive search helper text using helper
  const searchStatusText = getSearchStatusText(
    isSearching,
    needsMoreSearchCharacters,
    remainingSearchCharacters,
    results.length,
    trimmedQuery
  );

  const portalTarget = typeof document === "undefined" ? null : document.body;
  const modalContent = (
    <dialog
      ref={dialogRef}
      open
      aria-modal="true"
      aria-labelledby="transfer-title"
      aria-describedby="transfer-desc"
      onCancel={(e) => {
        e.preventDefault();
        if (!trxPending) handleClose();
      }}
      className={[
        "tw-w-full tw-h-full tw-fixed tw-inset-0 tw-z-[1000] tw-bg-white/10 tw-backdrop-blur-sm tw-flex tw-items-center tw-justify-center tw-p-0",
        isClosing
          ? "tw-opacity-0 tw-transition-opacity tw-duration-150"
          : "tw-opacity-100 tw-transition-opacity tw-duration-150",
      ].join(" ")}>
      <div
        className={[
          "tw-w-[95vw] tw-h-[90dvh] sm:tw-w-[90vw] sm:tw-h-[85dvh] md:tw-w-[70vw] md:tw-h-[75vh] tw-max-w-[1100px] tw-max-h-[900px] tw-rounded-2xl tw-bg-[#0c0c0d] tw-ring-[3px] tw-ring-white/30 tw-text-white tw-shadow-xl tw-overflow-hidden tw-flex tw-flex-col",
          isClosing
            ? "tw-scale-95 tw-opacity-0 tw-transition-all tw-duration-150"
            : "tw-scale-100 tw-opacity-100 tw-transition-all tw-duration-150",
          flow === "submission" || isClosing
            ? "tw-h-fit sm:tw-max-h-[90dvh] md:tw-max-h-[90vh]"
            : "",
        ].join(" ")}>
        {/* header */}
        <div className="tw-flex tw-items-center tw-justify-between tw-border-0 tw-border-b-[3px] tw-border-solid tw-border-white/30 tw-p-3 sm:tw-p-4">
          <div className="tw-text-base sm:tw-text-lg tw-font-semibold tw-flex-1 tw-min-w-0 tw-pr-2">
            <FlowTitle flow={flow} txs={txs} />
          </div>
          <HeaderRight
            flow={flow}
            trxPending={trxPending}
            onClose={handleClose}
          />
        </div>
        <p id="transfer-desc" className="tw-sr-only">
          {flow === "review"
            ? "Review selected NFTs and choose the destination recipient and wallet."
            : "Follow wallet prompts. Each transaction will indicate its current status."}
        </p>

        {/* body */}
        <BodyByFlow
          flow={flow}
          items={items}
          leftListRef={leftListRef}
          leftHasOverflow={leftHasOverflow}
          leftAtEnd={leftAtEnd}
          selectedProfile={selectedProfile}
          profile={profile}
          isIdentityLoading={isIdentityLoading}
          setSelectedProfile={setSelectedProfile}
          setSelectedWallet={setSelectedWallet}
          setResults={setResults}
          setQuery={setQuery}
          searchInputRef={searchInputRef}
          walletsListRef={walletsListRef}
          walletsHasOverflow={walletsHasOverflow}
          walletsAtEnd={walletsAtEnd}
          selectedWallet={selectedWallet}
          query={query}
          setQueryExternal={setQuery}
          searchStatusText={searchStatusText}
          results={results}
          onPick={(r) => {
            setSelectedProfile(r);
            setSelectedWallet(null);
          }}
          resultsListRef={resultsListRef}
          resultsHasOverflow={resultsHasOverflow}
          resultsAtEnd={resultsAtEnd}
          publicClient={publicClient}
          txs={txs}
        />

        {/* footer */}
        <div className="tw-flex tw-justify-between tw-items-center tw-gap-2 sm:tw-gap-3 tw-border-0 tw-border-t-[3px] tw-border-solid tw-border-white/30 tw-p-3 sm:tw-p-4">
          <div className="tw-flex tw-items-center tw-gap-2">
            {flow === "submission" && anyTxsPending(txs) && (
              <>
                <FontAwesomeIcon
                  icon={faExclamationTriangle}
                  className="tw-size-8"
                  color="#FFD60A"
                />
                <span className="tw-text-sm tw-font-medium tw-text-[#FFD60A]">
                  Double-check the recipient address and token details before
                  signing.
                  <br />
                  NFT transfers are irreversible once submitted on-chain.
                </span>
              </>
            )}
          </div>
          <FooterActions
            flow={flow}
            canConfirm={!!canConfirm}
            onCancel={handleClose}
            onConfirm={handleConfirm}
            onClose={handleClose}
            txs={txs}
          />
        </div>
      </div>
    </dialog>
  );

  if (!isMounted || !portalTarget) return null;
  return createPortal(modalContent, portalTarget);
}
