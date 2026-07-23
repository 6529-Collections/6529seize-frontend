import Image from "next/image";
import RecipientSelector from "@/components/common/RecipientSelector";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t as translate } from "@/i18n/messages";
import {
  faAnglesDown,
  faAnglesUp,
  faXmarkCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import type { PublicClient } from "viem";
import type { FlowState, TxEntry, TxState } from "./TransferModal.types";

function computeFlowTitle(
  locale: SupportedLocale,
  total: number,
  successCount: number,
  errorCount: number
): { label: string; icon: string } {
  const allSuccess = total > 0 && successCount === total;
  const allFail = total > 0 && errorCount === total;

  if (total === 1 && allSuccess) {
    return {
      label: translate(locale, "transfer.modal.result.singleSuccess"),
      icon: "/emojis/sgt_saluting_face.webp",
    };
  }
  if (total === 1 && allFail) {
    return {
      label: translate(locale, "transfer.modal.result.singleFailure"),
      icon: "/emojis/sgt_sob.webp",
    };
  }
  if (total === 1) {
    return {
      label: translate(locale, "transfer.modal.result.singleComplete"),
      icon: "/emojis/sgt_grimacing.webp",
    };
  }
  if (allSuccess) {
    return {
      label: translate(locale, "transfer.modal.result.allSuccess", {
        count: formatInteger(locale, total),
      }),
      icon: "/emojis/sgt_saluting_face.webp",
    };
  }
  if (allFail) {
    return {
      label: translate(locale, "transfer.modal.result.allFailure", {
        count: formatInteger(locale, total),
      }),
      icon: "/emojis/sgt_sob.webp",
    };
  }
  return {
    label: translate(locale, "transfer.modal.result.mixed", {
      successCount: formatInteger(locale, successCount),
      errorCount: formatInteger(locale, errorCount),
    }),
    icon: "/emojis/sgt_grimacing.webp",
  };
}

export function FlowTitle({
  flow,
  txs,
  locale,
}: {
  readonly flow: FlowState;
  readonly txs: TxEntry[];
  readonly locale: SupportedLocale;
}) {
  if (flow === "review") {
    return <span>{translate(locale, "transfer.modal.reviewTitle")}</span>;
  }

  const anyPending = anyTxsPending(txs);
  if (anyPending) {
    return (
      <span className="tw-flex tw-items-center tw-gap-1.5">
        <span>
          {translate(
            locale,
            txs.length === 1
              ? "transfer.modal.executing.one"
              : "transfer.modal.executing.many",
            { count: formatInteger(locale, txs.length) }
          )}
        </span>
        <CircleLoader size={CircleLoaderSize.MEDIUM} />
      </span>
    );
  }

  const total = txs.length;
  const successCount = txs.filter((t) => t.state === "success").length;
  const errorCount = txs.filter((t) => t.state === "error").length;

  const { label, icon } = computeFlowTitle(
    locale,
    total,
    successCount,
    errorCount
  );

  return (
    <span className="tw-flex tw-items-center tw-gap-1.5">
      <span>{label}</span>
      <img
        src={icon}
        alt={translate(locale, "transfer.modal.statusIconAlt")}
        className="tw-h-6 tw-w-6"
      />
    </span>
  );
}

function SelectedSummaryList({
  items,
  leftListRef,
  leftHasOverflow,
  leftAtEnd,
  locale,
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
  readonly locale: SupportedLocale;
}) {
  const totalUnits = items.reduce((sum, it) => sum + (it.qty || 0), 0);
  const summaryKey =
    items.length === 1
      ? totalUnits === 1
        ? "transfer.modal.summary.oneNftOneItem"
        : "transfer.modal.summary.oneNftManyItems"
      : totalUnits === 1
        ? "transfer.modal.summary.manyNftsOneItem"
        : "transfer.modal.summary.manyNftsManyItems";

  return (
    <div className="tw-flex tw-max-h-full tw-min-h-0 tw-flex-col tw-gap-3 tw-overflow-hidden">
      <div className="tw-flex-shrink-0 tw-pb-1 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-100">
        {translate(locale, summaryKey, {
          nftCount: formatInteger(locale, items.length),
          itemCount: formatInteger(locale, totalUnits),
        })}
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
              className="tw-flex tw-items-center tw-gap-3 tw-rounded-lg tw-bg-iron-900 tw-p-2.5 tw-ring-1 tw-ring-inset tw-ring-white/5"
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
              <div className="tw-text-xs tw-font-medium">
                x{formatInteger(locale, it.qty)}
              </div>
            </li>
          );
        })}
      </ul>
      {leftHasOverflow && (
        <div className="tw-flex-shrink-0 tw-text-center tw-text-xs tw-opacity-75">
          <FontAwesomeIcon icon={leftAtEnd ? faAnglesUp : faAnglesDown} />{" "}
          {translate(locale, "transfer.modal.scrollForMore")}
        </div>
      )}
    </div>
  );
}

function TxStatusList({
  txs,
  publicClient,
  locale,
}: {
  readonly txs: TxEntry[];
  readonly publicClient: PublicClient | undefined;
  readonly locale: SupportedLocale;
}) {
  const explorer = publicClient?.chain?.blockExplorers?.default.url;

  const getStatusClasses = (state: TxState) => {
    switch (state) {
      case "awaiting_approval":
        return "tw-bg-primary-500 tw-text-white";
      case "submitted":
        return "tw-bg-primary-300 tw-text-black";
      case "error":
        return "tw-bg-error tw-text-black";
      case "success":
        return "tw-bg-success tw-text-black";
      default:
        return "tw-bg-iron-100 tw-text-black";
    }
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
        {translate(locale, "transfer.modal.viewTransaction")}
      </Link>
    );
  };

  return (
    <>
      {txs.map((t, index) => (
        <div
          key={t.id}
          className={`tw-rounded-lg tw-p-4 ${getStatusClasses(t.state)}`}
        >
          <div className="tw-font-medium">
            {translate(locale, "transfer.modal.transactionPosition", {
              position: formatInteger(locale, index + 1),
              label: t.label,
            })}
          </div>
          <div className="tw-text-xs tw-opacity-60">
            {translate(locale, "transfer.modal.originator", {
              originator: t.originKey,
            })}
          </div>
          <div className="tw-mt-2 tw-text-sm">
            {t.state === "pending" && (
              <span>{translate(locale, "transfer.modal.status.pending")}</span>
            )}
            {t.state === "awaiting_approval" && (
              <span>
                {translate(locale, "transfer.modal.status.awaitingApproval")}
              </span>
            )}
            {t.state === "error" && (
              <span>
                {translate(locale, "transfer.modal.status.error", {
                  message:
                    t.error ||
                    translate(locale, "transfer.modal.status.failedFallback"),
                })}
                {t.hash && txLink(t.hash)}
              </span>
            )}
            {t.state === "submitted" && (
              <span>
                {translate(locale, "transfer.modal.status.submitted")}
                {t.hash && txLink(t.hash)}
              </span>
            )}
            {t.state === "success" && (
              <span>
                {translate(locale, "transfer.modal.status.success")}
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
  locale,
}: {
  readonly flow: FlowState;
  readonly trxPending: boolean;
  readonly onClose: () => void;
  readonly locale: SupportedLocale;
}) {
  return (
    <div className="tw-flex tw-items-center tw-gap-3">
      {(flow === "review" || !trxPending) && (
        <button
          type="button"
          onClick={onClose}
          aria-label={translate(locale, "transfer.modal.closeAriaLabel")}
          className="tw-flex tw-size-9 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-300 tw-transition-colors hover:tw-bg-iron-900 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
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
  locale,
}: {
  readonly flow: FlowState;
  readonly canConfirm: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
  readonly onClose: () => void;
  readonly txs: TxEntry[];
  readonly locale: SupportedLocale;
}) {
  if (flow === "review") {
    return (
      <div className="tw-flex tw-items-center tw-gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-px-4 tw-py-2 tw-font-medium tw-text-iron-100 tw-transition-colors hover:tw-border-white/20 hover:tw-bg-iron-800 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          {translate(locale, "transfer.modal.cancel")}
        </button>
        <button
          type="button"
          disabled={!canConfirm}
          onClick={onConfirm}
          className="tw-rounded-lg tw-border-0 tw-bg-white tw-px-4 tw-py-2 tw-font-semibold tw-text-black tw-transition-colors hover:tw-bg-iron-100 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
        >
          {translate(locale, "transfer.modal.transfer")}
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
        {translate(locale, "transfer.modal.processing")}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClose}
      className="tw-rounded-lg tw-bg-white tw-px-4 tw-py-2 tw-text-black hover:tw-bg-white/80 hover:tw-text-black"
    >
      {translate(locale, "common.close")}
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
  locale,
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
  readonly locale: SupportedLocale;
}) {
  if (flow === "submission") {
    const anyPending = anyTxsPending(txs);

    return (
      <div className="tw-flex-1 tw-space-y-4 tw-overflow-auto tw-p-4 sm:tw-p-6">
        <div className="tw-flex tw-items-center tw-gap-2 tw-text-xs tw-opacity-80 sm:tw-text-sm">
          <span>
            {translate(
              locale,
              anyPending
                ? "transfer.modal.submission.pending"
                : "transfer.modal.submission.complete"
            )}
          </span>
        </div>

        <TxStatusList txs={txs} publicClient={publicClient} locale={locale} />
      </div>
    );
  }

  return (
    <div className="tw-flex tw-flex-1 tw-flex-col tw-gap-6 tw-overflow-hidden tw-p-4 sm:tw-p-6 lg:tw-grid lg:tw-grid-cols-2">
      <div className="tw-max-h-[50%] tw-min-h-0 lg:tw-max-h-none">
        <SelectedSummaryList
          items={items}
          leftListRef={leftListRef}
          leftHasOverflow={leftHasOverflow}
          leftAtEnd={leftAtEnd}
          locale={locale}
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
