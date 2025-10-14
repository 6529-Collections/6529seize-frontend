'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { createPortal } from "react-dom";
import { createBreakpoint } from "react-use";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight, faXmark } from "@fortawesome/free-solid-svg-icons";

import type {
  XtdhReceivedCollectionSummary,
  XtdhReceivedNft,
} from "@/types/xtdh";

import { XTDH_RECEIVED_COLLECTION_EMPTY_MESSAGE } from "./XtdhReceivedCollectionCard.constants";
import { XtdhReceivedEmptyState } from "./XtdhReceivedEmptyState";
import { XtdhReceivedGranterAvatarGroup } from "./XtdhReceivedGranterAvatarGroup";
import { XtdhReceivedGranterRow } from "./XtdhReceivedGranterRow";
import { useXtdhReceivedCollectionTokens } from "../hooks/useXtdhReceivedCollectionTokens";
import { formatXtdhRate, formatXtdhTotal } from "../utils";

export interface XtdhReceivedCollectionCardContentProps {
  readonly collection: XtdhReceivedCollectionSummary;
  readonly onClose: () => void;
}

const TOKEN_TABLE_COLUMNS =
  "tw-grid-cols-1 md:tw-grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)_auto]";
const useBreakpoint = createBreakpoint({ MD: 768, S: 0 });

function getTokenGrantorCount(nft: XtdhReceivedNft) {
  if (typeof nft.grantorCount === "number") {
    return nft.grantorCount;
  }

  return nft.granters.length;
}

interface TokenRowProps {
  readonly nft: XtdhReceivedNft;
  readonly isActive: boolean;
  readonly onSelect: (tokenId: string) => void;
  readonly detailsRegionId: string;
}

function XtdhReceivedCollectionTokenRow({
  nft,
  isActive,
  onSelect,
  detailsRegionId,
}: TokenRowProps) {
  const handleSelect = useCallback(() => {
    onSelect(nft.tokenId);
  }, [nft.tokenId, onSelect]);

  const grantorCount = getTokenGrantorCount(nft);

  return (
    <div
      role="row"
      className={clsx(
        "tw-grid tw-items-center tw-gap-3 tw-border-b tw-border-iron-900/60 tw-px-4 tw-py-3 tw-text-sm tw-leading-tight tw-transition tw-duration-150 tw-ease-out last:tw-border-none",
        TOKEN_TABLE_COLUMNS,
        isActive
          ? "tw-bg-primary-500/10 tw-ring-1 tw-ring-inset tw-ring-primary-500/60"
          : "hover:tw-bg-iron-900/60",
      )}
    >
      <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-3">
        <img
          src={nft.tokenImage}
          alt={`${nft.tokenName} artwork`}
          className="tw-h-12 tw-w-12 tw-flex-shrink-0 tw-rounded-lg tw-border tw-border-iron-800 tw-object-cover"
          loading="lazy"
        />
        <div className="tw-flex tw-min-w-0 tw-flex-col">
          <span className="tw-truncate tw-text-sm tw-font-semibold tw-text-iron-50">
            {nft.tokenName}
          </span>
          <span className="tw-text-xxs tw-uppercase tw-text-iron-400">
            Token #{nft.tokenId}
          </span>
        </div>
      </div>
      <div className="tw-hidden md:tw-flex md:tw-justify-end">
        <span className="tw-text-sm tw-font-semibold tw-text-iron-100">
          {formatXtdhRate(nft.xtdhRate)}
        </span>
      </div>
      <div className="tw-hidden md:tw-flex md:tw-justify-end">
        <span className="tw-text-sm tw-font-semibold tw-text-iron-100">
          {formatXtdhTotal(nft.totalXtdhReceived)}
        </span>
      </div>
      <div className="tw-hidden md:tw-flex md:tw-justify-start">
        <XtdhReceivedGranterAvatarGroup
          granters={nft.granters}
          totalCount={grantorCount}
          onClick={handleSelect}
          ariaLabel={`View grantors for ${nft.tokenName}`}
        />
      </div>
      <div className="tw-flex tw-justify-end md:tw-justify-end">
        <button
          type="button"
          onClick={handleSelect}
          aria-expanded={isActive}
          aria-controls={detailsRegionId}
          className={clsx(
            "tw-inline-flex tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-transparent tw-bg-transparent tw-px-2 tw-py-1.5 tw-text-xs tw-font-semibold tw-uppercase tw-text-primary-300 tw-transition tw-duration-150 tw-ease-out",
            "hover:tw-text-primary-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950",
          )}
        >
          <span>Details</span>
          <FontAwesomeIcon icon={faChevronRight} className="tw-h-3 tw-w-3" />
        </button>
      </div>
    </div>
  );
}

interface TokenDetailsPanelProps {
  readonly token: XtdhReceivedNft;
  readonly detailsRegionId: string;
  readonly onClose: () => void;
}

function XtdhReceivedCollectionTokenDetails({
  token,
  detailsRegionId,
  onClose,
}: TokenDetailsPanelProps) {
  return (
    <aside
      id={detailsRegionId}
      role="region"
      aria-label={`Grantors for ${token.tokenName}`}
      className="tw-flex tw-h-full tw-flex-col tw-rounded-xl tw-border tw-border-iron-850 tw-bg-iron-950/80 tw-shadow-inner"
    >
      <div className="tw-flex tw-items-center tw-justify-between tw-border-b tw-border-iron-900/60 tw-px-4 tw-py-3">
        <div className="tw-flex tw-items-center tw-gap-3">
          <img
            src={token.tokenImage}
            alt=""
            className="tw-h-10 tw-w-10 tw-flex-shrink-0 tw-rounded-lg tw-border tw-border-iron-800 tw-object-cover"
            loading="lazy"
          />
          <div className="tw-flex tw-flex-col">
            <span className="tw-text-sm tw-font-semibold tw-text-iron-50">
              {token.tokenName}
            </span>
            <span className="tw-text-xxs tw-uppercase tw-text-iron-400">
              {formatXtdhRate(token.xtdhRate)}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="tw-inline-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-iron-800 tw-text-iron-300 tw-transition tw-duration-150 tw-ease-out hover:tw-text-iron-100 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950"
          aria-label="Close token details"
        >
          <FontAwesomeIcon icon={faXmark} className="tw-h-3 tw-w-3" />
        </button>
      </div>
      <div className="tw-flex-1 tw-space-y-2 tw-overflow-y-auto tw-p-4 tw-pr-3 tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-iron-700">
        {token.granters.length === 0 ? (
          <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-iron-900/70 tw-bg-iron-900/50 tw-p-6">
            <span className="tw-text-sm tw-text-iron-300">
              No grantors for this token yet.
            </span>
          </div>
        ) : (
          token.granters.map((granter) => (
            <XtdhReceivedGranterRow
              key={`${token.tokenId}-${granter.profileId}`}
              granter={granter}
            />
          ))
        )}
      </div>
    </aside>
  );
}

function useClientReady() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return ready;
}

function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof document === "undefined") {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [active]);
}

function CollectionTokensTable({
  tokens,
  activeTokenId,
  onSelectToken,
  detailsRegionId,
}: {
  readonly tokens: readonly XtdhReceivedNft[];
  readonly activeTokenId: string | null;
  readonly onSelectToken: (tokenId: string) => void;
  readonly detailsRegionId: string;
}) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-3">
      <div className="tw-flex tw-items-center tw-justify-between tw-text-xs tw-uppercase tw-text-iron-400">
        <span className="tw-font-semibold">Tokens</span>
        <span className="tw-hidden md:tw-inline">Sort: Rate / Received / Grantors</span>
      </div>
      <div className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-iron-850 tw-bg-iron-975/40">
        <div className="tw-max-h-[420px] tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-iron-700">
          <div
            role="row"
            className={clsx(
              "tw-sticky tw-top-0 tw-z-10 tw-grid tw-items-center tw-gap-3 tw-bg-iron-950 tw-px-4 tw-py-3",
              TOKEN_TABLE_COLUMNS,
            )}
          >
            <span className="tw-text-xxs tw-font-semibold tw-tracking-wide tw-text-iron-400">
              Token
            </span>
            <span className="tw-hidden md:tw-block tw-text-xxs tw-font-semibold tw-tracking-wide tw-text-iron-400">
              Rate (/day)
            </span>
            <span className="tw-hidden md:tw-block tw-text-xxs tw-font-semibold tw-tracking-wide tw-text-iron-400">
              Total Received
            </span>
            <span className="tw-hidden md:tw-block tw-text-xxs tw-font-semibold tw-tracking-wide tw-text-iron-400">
              Grantors
            </span>
            <span className="tw-text-xxs tw-font-semibold tw-tracking-wide tw-text-iron-400 tw-text-right">
              Action
            </span>
          </div>
          <div role="rowgroup">
            {tokens.map((token) => (
              <XtdhReceivedCollectionTokenRow
                key={token.tokenId}
                nft={token}
                isActive={token.tokenId === activeTokenId}
                onSelect={onSelectToken}
                detailsRegionId={detailsRegionId}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function InlineCollectionContent({
  tokens,
  activeToken,
  onSelectToken,
  detailsRegionId,
  onCloseDetails,
}: {
  readonly tokens: readonly XtdhReceivedNft[];
  readonly activeToken: XtdhReceivedNft | null;
  readonly onSelectToken: (tokenId: string) => void;
  readonly detailsRegionId: string;
  readonly onCloseDetails: () => void;
}) {
  if (tokens.length === 0) {
    return (
      <div className="tw-border-t tw-border-iron-850 tw-bg-iron-975/30 tw-px-4 tw-py-6">
        <XtdhReceivedEmptyState message={XTDH_RECEIVED_COLLECTION_EMPTY_MESSAGE} />
      </div>
    );
  }

  return (
    <div className="tw-grid tw-gap-6 tw-border-t tw-border-iron-850 tw-bg-iron-975/20 tw-px-4 tw-pb-5 tw-pt-4 xl:tw-grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
      <CollectionTokensTable
        tokens={tokens}
        activeTokenId={activeToken?.tokenId ?? null}
        onSelectToken={onSelectToken}
        detailsRegionId={detailsRegionId}
      />
      <div className="tw-hidden xl:tw-block">
        {activeToken ? (
          <XtdhReceivedCollectionTokenDetails
            token={activeToken}
            detailsRegionId={detailsRegionId}
            onClose={onCloseDetails}
          />
        ) : (
          <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-dashed tw-border-iron-850/70 tw-bg-iron-950/40 tw-p-6">
            <span className="tw-text-sm tw-text-iron-300">
              Select a token to review grantors.
            </span>
          </div>
        )}
      </div>
      <div className="tw-block xl:tw-hidden">
        {activeToken && (
          <XtdhReceivedCollectionTokenDetails
            token={activeToken}
            detailsRegionId={detailsRegionId}
            onClose={onCloseDetails}
          />
        )}
      </div>
    </div>
  );
}

function OverlayCollectionContent({
  collectionName,
  tokens,
  activeToken,
  onSelectToken,
  detailsRegionId,
  onClose,
  onCloseDetails,
}: {
  readonly collectionName: string;
  readonly tokens: readonly XtdhReceivedNft[];
  readonly activeToken: XtdhReceivedNft | null;
  readonly onSelectToken: (tokenId: string) => void;
  readonly detailsRegionId: string;
  readonly onClose: () => void;
  readonly onCloseDetails: () => void;
}) {
  useBodyScrollLock(true);

  const emptyState = (
    <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-px-6">
      <XtdhReceivedEmptyState message={XTDH_RECEIVED_COLLECTION_EMPTY_MESSAGE} />
    </div>
  );

  return (
    <div className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-flex-col tw-bg-iron-1000/90 tw-backdrop-blur-sm">
      <div className="tw-flex tw-items-center tw-justify-between tw-border-b tw-border-iron-900/80 tw-bg-iron-950 tw-px-4 tw-py-3">
        <div className="tw-flex tw-flex-col tw-gap-1">
          <span className="tw-text-sm tw-font-semibold tw-text-iron-50">
            {collectionName}
          </span>
          <span className="tw-text-xxs tw-uppercase tw-text-iron-400">
            Tokens receiving xTDH
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="tw-inline-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-iron-800 tw-text-iron-300 tw-transition tw-duration-150 tw-ease-out hover:tw-text-iron-100 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950"
          aria-label="Close collection details"
        >
          <FontAwesomeIcon icon={faXmark} className="tw-h-4 tw-w-4" />
        </button>
      </div>
      <div className="tw-flex-1 tw-overflow-y-auto tw-px-4 tw-py-5 tw-scrollbar-thin tw-scrollbar-thumb-iron-800">
        {tokens.length === 0 ? (
          emptyState
        ) : (
          <div className="tw-flex tw-flex-col tw-gap-5">
            <CollectionTokensTable
              tokens={tokens}
              activeTokenId={activeToken?.tokenId ?? null}
              onSelectToken={onSelectToken}
              detailsRegionId={detailsRegionId}
            />
            {activeToken && (
              <XtdhReceivedCollectionTokenDetails
                token={activeToken}
                detailsRegionId={detailsRegionId}
                onClose={onCloseDetails}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Handles the expanded body of the collection card with token-level details.
 */
export function XtdhReceivedCollectionCardContent({
  collection,
  onClose,
}: XtdhReceivedCollectionCardContentProps) {
  const tokens = useXtdhReceivedCollectionTokens(collection);
  const [activeTokenId, setActiveTokenId] = useState<string | null>(null);
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "S";
  const clientReady = useClientReady();

  useEffect(() => {
    if (!tokens.length) {
      setActiveTokenId(null);
      return;
    }

    setActiveTokenId((prev) => {
      if (prev && tokens.some((token) => token.tokenId === prev)) {
        return prev;
      }

      return tokens[0]?.tokenId ?? null;
    });
  }, [tokens]);

  const activeToken = useMemo(
    () => tokens.find((token) => token.tokenId === activeTokenId) ?? null,
    [activeTokenId, tokens],
  );

  const detailsRegionId = `collection-${collection.collectionId}-token-details`;

  const handleSelectToken = useCallback((tokenId: string) => {
    setActiveTokenId(tokenId);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setActiveTokenId(null);
  }, []);

  if (isMobile) {
    if (!clientReady || typeof document === "undefined") {
      return null;
    }

    return createPortal(
      <OverlayCollectionContent
        collectionName={collection.collectionName}
        tokens={tokens}
        activeToken={activeToken}
        onSelectToken={handleSelectToken}
        detailsRegionId={detailsRegionId}
        onClose={onClose}
        onCloseDetails={handleCloseDetails}
      />,
      document.body,
    );
  }

  return (
    <InlineCollectionContent
      tokens={tokens}
      activeToken={activeToken}
      onSelectToken={handleSelectToken}
      detailsRegionId={detailsRegionId}
      onCloseDetails={handleCloseDetails}
    />
  );
}
