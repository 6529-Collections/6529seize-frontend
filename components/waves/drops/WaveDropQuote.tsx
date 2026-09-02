"use client";

import DropPartMarkdownWithPropLogger from "@/components/drops/view/part/DropPartMarkdownWithPropLogger";
import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import { useLinkPreviewContext } from "@/components/waves/LinkPreviewContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropPart } from "@/generated/models/ApiDropPart";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { areSameProfileIdentity } from "@/helpers/ProfileHelpers";
import Image from "next/image";
import Link from "next/link";
import React, { useMemo } from "react";
import DropNotFound from "./DropNotFound";
import WaveDropTime from "./time/WaveDropTime";
import {
  useWaveDropQuoteDisplay,
  WaveDropQuoteDisplayProvider,
} from "./WaveDropQuoteDisplayContext";
import { ApiDropType } from "@/generated/models/ApiDropType";
import ProposalCardContent from "./proposal/ProposalCardContent";
import { useWaveProposalCardPresentation } from "@/hooks/waves/useWaveProposalCardPresentation";
import ContentModerationDropGate from "@/components/content-moderation/ContentModerationDropGate";

interface WaveDropQuoteProps {
  readonly drop: ApiDrop | null;
  readonly partId: number;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly isNotFound?: boolean;
  readonly embedPath?: readonly string[] | undefined;
  readonly quotePath?: readonly string[] | undefined;
  readonly embedDepth?: number | undefined;
  readonly maxEmbedDepth?: number | undefined;
  readonly hideLinkPreviews?: boolean | undefined;
  readonly onLinkCardActionsActiveChange?:
    | ((href: string, active: boolean) => void)
    | undefined;
}

interface WaveDropQuoteProfilePictureProps {
  readonly drop: ApiDrop | null;
}

function getQuotedWaveHref(drop: ApiDrop | null): string {
  if (drop === null) return "";
  const waveDetails = drop.wave as unknown as {
    chat?:
      | {
          scope?:
            | {
                group?: { is_direct_message?: boolean | undefined } | undefined;
              }
            | undefined;
        }
      | undefined;
  };
  return getWaveRoute({
    waveId: drop.wave.id,
    isDirectMessage: waveDetails.chat?.scope?.group?.is_direct_message ?? false,
    isApp: false,
  });
}

function getEffectiveQuotePath(
  drop: ApiDrop | null,
  quotePath: readonly string[] | undefined
): string[] {
  const path = quotePath ? [...quotePath] : [];
  if (drop?.wave.id === undefined) return path;
  const currentQuoteKey = `${drop.wave.id}:${drop.serial_no}`;
  if (!path.includes(currentQuoteKey)) path.push(currentQuoteKey);
  return path;
}

function handleQuoteClick(
  event: React.MouseEvent<HTMLDivElement>,
  isInteractive: boolean,
  goToQuoteDrop: () => void
) {
  event.stopPropagation();
  if (isInteractive) goToQuoteDrop();
}

function handleQuoteKeyDown(
  event: React.KeyboardEvent<HTMLDivElement>,
  goToQuoteDrop: () => void
) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  event.stopPropagation();
  goToQuoteDrop();
}

function getQuoteContainerAccessibility(
  isInteractive: boolean,
  goToQuoteDrop: () => void
): {
  readonly onKeyDown?:
    | ((event: React.KeyboardEvent<HTMLDivElement>) => void)
    | undefined;
  readonly role?: "button" | undefined;
  readonly tabIndex?: 0 | undefined;
} {
  if (!isInteractive) return {};
  return {
    onKeyDown: (event) => handleQuoteKeyDown(event, goToQuoteDrop),
    role: "button",
    tabIndex: 0,
  };
}

const WaveDropQuoteProfilePicture: React.FC<
  WaveDropQuoteProfilePictureProps
> = ({ drop }) => {
  if (!drop) {
    return (
      <div className="tw-h-full tw-w-full tw-max-w-full tw-animate-pulse tw-overflow-hidden tw-rounded-md tw-bg-iron-900" />
    );
  }

  const resolvedPfp = drop.author.pfp
    ? resolveIpfsUrlSync(drop.author.pfp)
    : null;

  if (resolvedPfp) {
    return (
      <div className="tw-relative tw-h-full tw-w-full">
        <Image
          src={resolvedPfp}
          alt={`${drop.author.handle ?? drop.author.primary_address}'s profile picture`}
          fill
          sizes="24px"
          className="tw-rounded-md tw-bg-transparent tw-object-cover"
        />
      </div>
    );
  }

  return (
    <div className="tw-h-full tw-w-full tw-max-w-full tw-overflow-hidden tw-rounded-md tw-bg-iron-900" />
  );
};

function WaveDropQuoteBody({
  drop,
  quoteAuthorLabel,
  quoteContent,
  waveHref,
}: {
  readonly drop: ApiDrop | null;
  readonly quoteAuthorLabel: string | null;
  readonly quoteContent: React.ReactNode;
  readonly waveHref: string;
}) {
  return (
    <div className="tw-group tw-relative tw-flex tw-w-full tw-flex-col">
      <div className="tw-flex tw-gap-x-2">
        <div className="tw-relative tw-h-6 tw-w-6 tw-flex-shrink-0 tw-rounded-md tw-bg-iron-900">
          <div className="tw-h-full tw-w-full tw-rounded-md">
            <WaveDropQuoteProfilePicture drop={drop} />
          </div>
        </div>
        <div className="tw-flex tw-w-full tw-flex-col">
          <div className="tw-flex tw-items-center tw-gap-x-2">
            <div className="tw-flex tw-items-center tw-gap-x-2">
              {quoteAuthorLabel && (
                <p className="tw-mb-0 tw-text-md tw-font-semibold tw-leading-none">
                  <Link
                    href={`/${quoteAuthorLabel}`}
                    className="tw-text-iron-200 tw-no-underline tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-500"
                  >
                    {quoteAuthorLabel}
                  </Link>
                </p>
              )}

              {!!drop && (
                <UserCICAndLevel
                  level={drop.author.level}
                  size={UserCICAndLevelSize.SMALL}
                />
              )}
            </div>

            {!!drop && (
              <>
                <div className="tw-size-[3px] tw-flex-shrink-0 tw-rounded-full tw-bg-iron-700"></div>
                <WaveDropTime timestamp={drop.created_at} />
              </>
            )}
          </div>
          <div>
            {drop && waveHref && (
              <Link
                href={waveHref}
                className="tw-leading-0 -tw-mt-1 tw-text-[11px] tw-text-iron-500 tw-no-underline tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-300"
              >
                {drop.wave.name}
              </Link>
            )}
          </div>
          <div className="tw-mt-0.5">{quoteContent}</div>
        </div>
      </div>
    </div>
  );
}

const WaveDropQuote: React.FC<WaveDropQuoteProps> = (props) => {
  const drop = props.drop;
  if (drop === null) {
    return <WaveDropQuoteContent {...props} />;
  }

  return (
    <ContentModerationDropGate
      drop={drop}
      compact
      onGlobalTombstoneClick={() => props.onQuoteClick(drop)}
    >
      <WaveDropQuoteContent {...props} />
    </ContentModerationDropGate>
  );
};

const WaveDropQuoteContent: React.FC<WaveDropQuoteProps> = ({
  drop,
  partId,
  onQuoteClick,
  isNotFound = false,
  embedPath,
  quotePath,
  embedDepth,
  maxEmbedDepth,
  hideLinkPreviews = false,
  onLinkCardActionsActiveChange,
}) => {
  const { onCardActionsActiveChange } = useLinkPreviewContext();
  const { flattenWhenAuthorSameAs } = useWaveDropQuoteDisplay();
  const proposalCardPresentation = useWaveProposalCardPresentation(
    drop?.wave.id
  );
  const quotedPart = useMemo<ApiDropPart | null>(() => {
    if (!drop) return null;
    return drop.parts.find((part) => part.part_id === partId) ?? null;
  }, [drop, partId]);

  const goToQuoteDrop = () => {
    if (drop?.wave.id && drop.id) {
      onQuoteClick(drop);
    }
  };

  const waveHref = useMemo(() => getQuotedWaveHref(drop), [drop]);
  const effectiveQuotePath = useMemo(
    () => getEffectiveQuotePath(drop, quotePath),
    [drop, quotePath]
  );

  const resolvedOnLinkCardActionsActiveChange =
    onLinkCardActionsActiveChange ?? onCardActionsActiveChange;
  const isInteractive = drop !== null && !isNotFound;
  const shouldFlattenQuote = areSameProfileIdentity({
    left: drop?.author,
    right: flattenWhenAuthorSameAs,
  });
  const quoteAuthorLabel = drop
    ? (drop.author.handle ?? drop.author.primary_address)
    : null;
  const handleQuoteContainerClick = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    handleQuoteClick(event, isInteractive, goToQuoteDrop);
  };
  const quoteContainerAccessibility = getQuoteContainerAccessibility(
    isInteractive,
    goToQuoteDrop
  );
  const quoteContainerClassName = `tw-mt-1 ${
    isInteractive ? "tw-cursor-pointer" : ""
  } tw-rounded-xl tw-bg-iron-950 tw-px-3 tw-py-3 tw-ring-1 tw-ring-inset tw-ring-iron-800`;

  if (isNotFound) {
    return (
      <div
        className={quoteContainerClassName}
        onClick={handleQuoteContainerClick}
      >
        <DropNotFound />
      </div>
    );
  }

  const quoteContent =
    drop !== null &&
    drop.drop_type !== ApiDropType.Chat &&
    proposalCardPresentation === "proposalCard" ? (
      <ProposalCardContent drop={drop} density="compact" />
    ) : (
      <WaveDropQuoteDisplayProvider flattenWhenAuthorSameAs={null}>
        <DropPartMarkdownWithPropLogger
          partContent={quotedPart?.content ?? ""}
          mentionedUsers={drop?.mentioned_users ?? []}
          mentionedGroups={drop?.mentioned_groups ?? []}
          mentionedWaves={drop?.mentioned_waves ?? []}
          referencedNfts={drop?.referenced_nfts ?? []}
          nftLinks={drop?.nft_links}
          textSize="sm"
          onQuoteClick={onQuoteClick}
          currentDropId={drop?.id}
          embedPath={embedPath}
          quotePath={effectiveQuotePath}
          embedDepth={embedDepth}
          maxEmbedDepth={maxEmbedDepth}
          hideLinkPreviews={hideLinkPreviews}
          onLinkCardActionsActiveChange={resolvedOnLinkCardActionsActiveChange}
        />
      </WaveDropQuoteDisplayProvider>
    );

  if (shouldFlattenQuote) {
    return quoteContent;
  }

  return (
    <div
      className={quoteContainerClassName}
      onClick={handleQuoteContainerClick}
      onKeyDown={quoteContainerAccessibility.onKeyDown}
      role={quoteContainerAccessibility.role}
      tabIndex={quoteContainerAccessibility.tabIndex}
    >
      <WaveDropQuoteBody
        drop={drop}
        quoteAuthorLabel={quoteAuthorLabel}
        quoteContent={quoteContent}
        waveHref={waveHref}
      />
    </div>
  );
};

export default WaveDropQuote;
