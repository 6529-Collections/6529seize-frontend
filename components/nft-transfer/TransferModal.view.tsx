import Image from "next/image";
import RecipientSelector from "@/components/common/RecipientSelector";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import {
  faAnglesDown,
  faAnglesUp,
  faXmarkCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import type { PublicClient } from "viem";
import type { FlowState, TxEntry, TxState } from "./TransferModal";

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

export function FlowTitle({
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
      <img src={icon} alt="status" className="tw-h-6 tw-w-6" />
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
    title?: string | undefined;
    thumbUrl?: string | undefined;
  }[];
  readonly leftListRef: React.RefObject<HTMLUListElement | null>;
  readonly leftHasOverflow: boolean;
  readonly leftAtEnd: boolean;
}) {
  return (
    <div className="tw-flex tw-max-h-full tw-min-h-0 tw-flex-col tw-space-y-2 tw-overflow-hidden">
      <div className="tw-flex-shrink-0 tw-font-semibold">
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
        className="tw-[scrollbar-gutter:stable] tw-min-h-0 tw-flex-1 tw-space-y-2 tw-overflow-auto tw-pl-0 tw-pr-3 tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-white/30 hover:tw-scrollbar-thumb-white/50"
      >
        {items.map((it) => {
          const [collection, tokenId] = it.key.split(":");
          return (
            <li
              key={it.key}
              className="tw-flex tw-items-center tw-gap-3 tw-rounded-lg tw-bg-white/10 tw-p-2"
            >
              {it.thumbUrl ? (
                <div className="tw-relative tw-h-10 tw-w-10 tw-overflow-hidden tw-rounded-md tw-bg-white/10">
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
        <div className="tw-flex-shrink-0 tw-text-center tw-text-xs tw-opacity-75">
          <FontAwesomeIcon icon={leftAtEnd ? faAnglesUp : faAnglesDown} />{" "}
          Scroll for more
        </div>
      )}
    </div>
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
        className="tw-ml-2 tw-inline-block tw-rounded-md tw-border tw-border-solid tw-border-black tw-bg-white tw-px-2 tw-py-1 !tw-text-sm tw-text-black tw-no-underline hover:tw-bg-white/80 hover:tw-text-black"
      >
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
          }}
        >
          <div className="tw-font-medium">
            {index + 1}/ {t.label}
          </div>
          <div className="tw-text-xs tw-opacity-60">
            Originator: {t.originKey}
          </div>
          <div className="tw-mt-2 tw-text-sm">
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

export function HeaderRight({
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
          className="tw-flex tw-items-center tw-justify-center tw-border-none tw-bg-transparent tw-p-0"
        >
          <FontAwesomeIcon icon={faXmarkCircle} className="tw-size-6" />
        </button>
      )}
    </div>
  );
}

export function FooterActions({
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
          className="tw-rounded-lg tw-border-2 tw-border-solid tw-border-[#444] tw-bg-white/10 tw-px-4 tw-py-2 tw-font-medium hover:tw-bg-white/15"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!canConfirm}
          onClick={onConfirm}
          className="tw-rounded-lg tw-border-2 tw-border-solid tw-border-[#444] tw-bg-white tw-px-4 tw-py-2 tw-font-medium tw-text-black disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
        >
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
        className="tw-rounded-lg tw-bg-white/10 tw-px-4 tw-py-2 tw-font-medium tw-opacity-60"
      >
        Processing…
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClose}
      className="tw-rounded-lg tw-bg-white tw-px-4 tw-py-2 tw-text-black hover:tw-bg-white/80 hover:tw-text-black"
    >
      Close
    </button>
  );
}

export function BodyByFlow({
  flow,
  open,
  items,
  leftListRef,
  leftHasOverflow,
  leftAtEnd,
  selectedProfile,
  setSelectedProfile,
  setSelectedWallet,
  selectedWallet,
  publicClient,
  txs,
}: {
  readonly flow: FlowState;
  readonly open: boolean;
  readonly items: {
    key: string;
    qty: number;
    title?: string | undefined;
    thumbUrl?: string | undefined;
  }[];
  readonly leftListRef: React.RefObject<HTMLUListElement | null>;
  readonly leftHasOverflow: boolean;
  readonly leftAtEnd: boolean;
  readonly selectedProfile: CommunityMemberMinimal | null;
  readonly setSelectedProfile: (v: CommunityMemberMinimal | null) => void;
  readonly setSelectedWallet: (v: string | null) => void;
  readonly selectedWallet: string | null;
  readonly publicClient: PublicClient | undefined;
  readonly txs: TxEntry[];
}) {
  if (flow === "submission") {
    const anyPending = anyTxsPending(txs);

    return (
      <div className="tw-flex-1 tw-space-y-4 tw-overflow-auto tw-p-4 sm:tw-p-6">
        <div className="tw-flex tw-items-center tw-gap-2 tw-text-xs tw-opacity-80 sm:tw-text-sm">
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
    <div className="tw-flex tw-flex-1 tw-flex-col tw-gap-6 tw-overflow-hidden tw-px-4 tw-py-2 lg:tw-grid lg:tw-grid-cols-2">
      <div className="tw-max-h-[50%] tw-min-h-0 lg:tw-max-h-none">
        <SelectedSummaryList
          items={items}
          leftListRef={leftListRef}
          leftHasOverflow={leftHasOverflow}
          leftAtEnd={leftAtEnd}
        />
      </div>
      <RecipientSelector
        open={open}
        selectedProfile={selectedProfile}
        selectedWallet={selectedWallet}
        onProfileSelect={setSelectedProfile}
        onWalletSelect={setSelectedWallet}
      />
    </div>
  );
}

export function anyTxsPending(txs: TxEntry[]) {
  return txs.some(
    (t) =>
      t.state === "pending" ||
      t.state === "awaiting_approval" ||
      t.state === "submitted"
  );
}
