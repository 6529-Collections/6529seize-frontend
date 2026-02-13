"use client";

import React, { useEffect, useMemo, useState } from "react";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import Link from "next/link";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropPart } from "@/generated/models/ApiDropPart";
import DropPartMarkdownWithPropLogger from "@/components/drops/view/part/DropPartMarkdownWithPropLogger";
import WaveDropTime from "./time/WaveDropTime";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import Image from "next/image";
import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";

interface WaveDropQuoteProps {
  readonly drop: ApiDrop | null;
  readonly partId: number;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly embedPath?: readonly string[] | undefined;
  readonly quotePath?: readonly string[] | undefined;
  readonly marketplaceImageOnly?: boolean | undefined;
  readonly embedDepth?: number | undefined;
  readonly maxEmbedDepth?: number | undefined;
}

const WaveDropQuote: React.FC<WaveDropQuoteProps> = ({
  drop,
  partId,
  onQuoteClick,
  embedPath,
  quotePath,
  marketplaceImageOnly,
  embedDepth,
  maxEmbedDepth,
}) => {
  const [quotedPart, setQuotedPart] = useState<ApiDropPart | null>(null);
  useEffect(() => {
    if (!drop) {
      return;
    }
    const part = drop.parts.find((part) => part.part_id === partId);
    if (!part) {
      return;
    }
    setQuotedPart(part);
  }, [drop]);

  const renderProfilePicture = () => {
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
            alt={`${drop.author.handle}'s profile picture`}
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

  const goToQuoteDrop = () => {
    if (drop?.wave.id && drop?.id) {
      onQuoteClick(drop);
    }
  };

  const waveHref = useMemo(() => {
    if (!drop) return "";

    const waveDetails = drop.wave as unknown as {
      chat?:
        | {
            scope?:
              | {
                  group?:
                    | { is_direct_message?: boolean | undefined }
                    | undefined;
                }
              | undefined;
          }
        | undefined;
    };

    const isDirectMessage =
      waveDetails?.chat?.scope?.group?.is_direct_message ?? false;

    return getWaveRoute({
      waveId: drop.wave.id,
      isDirectMessage,
      isApp: false,
    });
  }, [drop]);

  const effectiveQuotePath = useMemo(() => {
    const path = quotePath ? [...quotePath] : [];
    if (drop?.wave.id) {
      const currentQuoteKey = `${drop.wave.id}:${drop.serial_no}`;
      if (!path.includes(currentQuoteKey)) {
        path.push(currentQuoteKey);
      }
    }

    return path;
  }, [drop, quotePath]);

  return (
    <div
      className="tw-mt-1 tw-cursor-pointer tw-rounded-xl tw-bg-iron-950 tw-px-3 tw-py-3 tw-ring-1 tw-ring-inset tw-ring-iron-800"
      onClick={(e) => {
        e.stopPropagation();
        goToQuoteDrop();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          goToQuoteDrop();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="tw-group tw-relative tw-flex tw-w-full tw-flex-col">
        <div className="tw-flex tw-gap-x-2">
          <div className="tw-relative tw-h-6 tw-w-6 tw-flex-shrink-0 tw-rounded-md tw-bg-iron-900">
            <div className="tw-h-full tw-w-full tw-rounded-md">
              {renderProfilePicture()}
            </div>
          </div>
          <div className="tw-flex tw-w-full tw-flex-col">
            <div className="tw-flex tw-items-center tw-gap-x-2">
              <div className="tw-flex tw-items-center tw-gap-x-2">
                {!!drop && (
                  <UserCICAndLevel
                    level={drop.author.level}
                    size={UserCICAndLevelSize.SMALL}
                  />
                )}

                <p className="tw-mb-0 tw-text-md tw-font-semibold tw-leading-none">
                  <Link
                    href={`/${drop?.author.handle}`}
                    className="tw-text-iron-200 tw-no-underline tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-500"
                  >
                    {drop?.author.handle}
                  </Link>
                </p>
              </div>

              {!!drop && (
                <>
                  <div className="tw-size-[3px] tw-flex-shrink-0 tw-rounded-full tw-bg-iron-600"></div>
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
            <div className="tw-mt-0.5">
              <DropPartMarkdownWithPropLogger
                partContent={quotedPart?.content ?? ""}
                mentionedUsers={drop?.mentioned_users ?? []}
                mentionedWaves={drop?.mentioned_waves ?? []}
                referencedNfts={drop?.referenced_nfts ?? []}
                textSize="sm"
                onQuoteClick={onQuoteClick}
                currentDropId={drop?.id}
                marketplaceImageOnly={marketplaceImageOnly}
                embedPath={embedPath}
                quotePath={effectiveQuotePath}
                embedDepth={embedDepth}
                maxEmbedDepth={maxEmbedDepth}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaveDropQuote;
